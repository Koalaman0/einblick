package com.einblick.backend.domain.reconciliation;

import com.einblick.backend.domain.assort.Assort;
import com.einblick.backend.domain.assort.AssortRepository;
import com.einblick.backend.domain.assort.AssortSize;
import com.einblick.backend.domain.customer.Customer;
import com.einblick.backend.domain.customer.CustomerRepository;
import com.einblick.backend.domain.po.PoLine;
import com.einblick.backend.domain.po.PurchaseOrderRepository;
import com.einblick.backend.domain.program.Program;
import com.einblick.backend.domain.program.ProgramRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

// PoLine <-> Assort를 같은 Program + team + player끼리 짝지어 totalQty를 비교한다.
// team/player 조합이 프로그램당 1개씩만 있다고 가정하며, 중복이 있으면 먼저 발견된 것만 사용한다.
// 수량 비교 외에, ERP 업무 규칙 명세서(v2)에 정리된 검증 로직 중 기존 데이터만으로 확인 가능한
// 항목(RATIO 정합성, 고객사별 패킹정보 마스터 대비 이탈)도 함께 확인해 문제가 있으면 NEEDS_REVIEW로
// 표시하고 note에 사유를 남긴다.
// (STY 세그먼트-PLAYER 일치 검증은 실제 데이터로 시도했다가 제거함 - PDF 파싱이 선수명을 TEAM
// 필드에만 넣고 PLAYER는 항상 공란으로 저장해서, 이 검증은 실사용에서 거의 모든 선수 라인을
// 오탐으로 판정했다. PLAYER를 실제로 채우는 파싱 로직이 생기기 전까지는 재도입하지 않는다.)
@Service
public class ReconciliationService {

    private final ProgramRepository programRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AssortRepository assortRepository;
    private final CustomerRepository customerRepository;
    private final ReconciliationResultRepository reconciliationResultRepository;

    public ReconciliationService(
        ProgramRepository programRepository,
        PurchaseOrderRepository purchaseOrderRepository,
        AssortRepository assortRepository,
        CustomerRepository customerRepository,
        ReconciliationResultRepository reconciliationResultRepository
    ) {
        this.programRepository = programRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.assortRepository = assortRepository;
        this.customerRepository = customerRepository;
        this.reconciliationResultRepository = reconciliationResultRepository;
    }

    // 재실행 시 이전 결과를 전부 지우고 다시 계산한다 (검토 이력 보존은 이후 과제).
    @Transactional
    public List<ReconciliationResult> run() {
        reconciliationResultRepository.deleteAllInBatch();

        List<ReconciliationResult> results = new ArrayList<>();
        for (Program program : programRepository.findAll()) {
            results.addAll(runForProgram(program));
        }
        return reconciliationResultRepository.saveAll(results);
    }

    private List<ReconciliationResult> runForProgram(Program program) {
        List<PoLine> poLines = purchaseOrderRepository.findByProgram(program).stream()
            .flatMap(po -> po.getPoLines().stream())
            .toList();
        List<Assort> assorts = assortRepository.findByProgram(program);

        if (poLines.isEmpty() && assorts.isEmpty()) {
            return List.of();
        }

        Map<LineKey, PoLine> poLineByKey = poLines.stream()
            .collect(Collectors.toMap(l -> LineKey.of(l.getTeam(), l.getPlayer()), l -> l, (a, b) -> a));
        Map<LineKey, Assort> assortByKey = assorts.stream()
            .collect(Collectors.toMap(a -> LineKey.of(a.getTeam(), a.getPlayer()), a -> a, (a, b) -> a));

        Set<LineKey> keys = new LinkedHashSet<>();
        keys.addAll(poLineByKey.keySet());
        keys.addAll(assortByKey.keySet());

        List<ReconciliationResult> results = new ArrayList<>();
        for (LineKey key : keys) {
            results.add(buildResult(poLineByKey.get(key), assortByKey.get(key)));
        }
        return results;
    }

    private ReconciliationResult buildResult(PoLine poLine, Assort assort) {
        int diff;
        ReconciliationResult.Status status;
        boolean houseMatched = false;

        if (poLine != null && assort != null) {
            diff = poLine.getTotalQty() - assort.getTotalQty();
            status = diff == 0 ? ReconciliationResult.Status.OK : ReconciliationResult.Status.QTY_MISMATCH;
            houseMatched = isHouseAlias(assort.getCustomerLabel());
        } else if (poLine != null) {
            diff = poLine.getTotalQty();
            status = ReconciliationResult.Status.MISSING_IN_ASSORT;
        } else {
            diff = -assort.getTotalQty();
            status = ReconciliationResult.Status.MISSING_IN_PO;
            houseMatched = isHouseAlias(assort.getCustomerLabel());
        }

        List<String> notes = new ArrayList<>();
        if (assort != null) {
            notes.addAll(validatePackingInfo(assort));
        }
        // 수량은 이미 일치(OK)했는데 업무 규칙 위반이 새로 발견되면 확인 필요로 격상한다.
        // 이미 QTY_MISMATCH/MISSING인 건은 그 상태를 그대로 유지하되 note는 같이 붙여준다.
        if (!notes.isEmpty() && status == ReconciliationResult.Status.OK) {
            status = ReconciliationResult.Status.NEEDS_REVIEW;
        }

        return ReconciliationResult.builder()
            .poLine(poLine)
            .assort(assort)
            .diffQty(diff)
            .status(status)
            .houseMatched(houseMatched)
            .note(notes.isEmpty() ? null : String.join(" / ", notes))
            .build();
    }

    // CUSTOMER 라벨이 공란이면 HOUSE로 자동 매칭된 것으로 간주한다.
    private boolean isHouseAlias(String customerLabel) {
        return customerLabel == null || customerLabel.isBlank();
    }

    // RATIO 정합성 + 고객사 패킹정보 마스터 대비 이탈을 확인한다.
    private List<String> validatePackingInfo(Assort assort) {
        List<String> notes = new ArrayList<>();

        String assortSolid = normalize(assort.getAssortSolid());
        String ratio = normalize(assort.getRatio());
        boolean hasRatio = ratio != null && !ratio.equals("-");

        if (assortSolid != null && assortSolid.equalsIgnoreCase("ASSORT") && !hasRatio) {
            notes.add("ASSORT 구분인데 RATIO가 비어 있습니다");
        }
        if (assortSolid != null && assortSolid.equalsIgnoreCase("SOLID") && hasRatio) {
            notes.add("SOLID 구분인데 RATIO 값이 있습니다 (" + ratio + ")");
        }
        if (hasRatio) {
            addIfPresent(notes, validateRatioAgainstSizes(ratio, assort.getSizes()));
        }

        Customer master = resolveCustomerMaster(assort.getCustomerLabel());
        if (master == null) {
            if (assort.getCustomerLabel() != null && !assort.getCustomerLabel().isBlank()) {
                notes.add("고객사 패킹정보 마스터에 없는 거래처입니다: " + assort.getCustomerLabel());
            }
        } else {
            addIfPresent(notes, diffField("ASSORT/SOLID", assort.getAssortSolid(), master.getAssortSolid()));
            addIfPresent(notes, diffField("POLYBAG", assort.getPolybag(), master.getStdPolybag()));
            addIfPresent(notes, diffField("CARTON", assort.getCarton(), master.getStdCarton()));
        }

        return notes;
    }

    private Customer resolveCustomerMaster(String customerLabel) {
        if (customerLabel == null || customerLabel.isBlank()) {
            return customerRepository.findByCode("HOUSE").orElse(null);
        }
        String trimmed = customerLabel.trim();
        return customerRepository.findByNameIgnoreCase(trimmed)
            .or(() -> customerRepository.findByCode(trimmed))
            .orElse(null);
    }

    // 고객사 마스터의 ASSORT/SOLID처럼 "SOLID/ASSORT" 혼재로 등록된 값은 둘 중 하나만 맞아도
    // 정상이다 - "/"로 나눠 그 중 하나와 일치하면 통과시킨다 (그 외 필드는 원래 하나의 값만 오므로
    // 이 분기가 실질적으로 영향을 주지 않는다).
    private String diffField(String label, String actual, String standard) {
        String s = normalize(standard);
        if (s == null) {
            return null; // 마스터에 기준값이 없으면 비교를 생략한다 (오탐 방지)
        }
        String a = normalize(actual);
        if (a == null) {
            return null; // ASSORT에 미입력이면 별도 표시하지 않는다
        }
        boolean matches = Arrays.stream(s.split("/"))
            .map(String::trim)
            .anyMatch(part -> part.equalsIgnoreCase(a));
        if (!matches) {
            return label + "이(가) 고객사 표준(" + s + ")과 다릅니다 (실제: " + a + ")";
        }
        return null;
    }

    // 실제 사이즈별 QTY를 GCD로 약분한 값(오름차순)이 RATIO에 적힌 값(오름차순)과 같은지 확인한다.
    // 사이즈 순서와 RATIO 표기 순서가 항상 일치한다는 보장이 없어 순서는 무시하고 값의 다중집합만 비교한다.
    private String validateRatioAgainstSizes(String ratio, List<AssortSize> sizes) {
        if (sizes.isEmpty()) {
            return null;
        }
        List<Integer> ratioParts = parseRatioParts(ratio);
        if (ratioParts == null) {
            return null; // 알 수 없는 표기 형식이면 검증을 생략한다
        }
        List<Integer> qtys = sizes.stream().map(AssortSize::getQty).filter(q -> q != null && q > 0).toList();
        if (qtys.isEmpty()) {
            return null;
        }
        int computedGcd = 0;
        for (int q : qtys) {
            computedGcd = gcd(computedGcd, q);
        }
        if (computedGcd == 0) {
            return null;
        }
        final int gcd = computedGcd;
        List<Integer> reduced = qtys.stream().map(q -> q / gcd).sorted().toList();
        List<Integer> sortedRatio = ratioParts.stream().sorted().toList();
        if (!reduced.equals(sortedRatio)) {
            return "RATIO(" + ratio + ")가 실제 사이즈별 수량 약분값(" + reduced + ")과 일치하지 않습니다";
        }
        return null;
    }

    private List<Integer> parseRatioParts(String ratio) {
        String[] tokens = ratio.split("[:/]");
        List<Integer> parts = new ArrayList<>();
        for (String token : tokens) {
            try {
                parts.add(Integer.parseInt(token.trim()));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return parts.isEmpty() ? null : parts;
    }

    private int gcd(int a, int b) {
        return b == 0 ? a : gcd(b, a % b);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void addIfPresent(List<String> notes, String note) {
        if (note != null) {
            notes.add(note);
        }
    }

    private record LineKey(String team, String player) {
        static LineKey of(String team, String player) {
            return new LineKey(team, player);
        }
    }
}
