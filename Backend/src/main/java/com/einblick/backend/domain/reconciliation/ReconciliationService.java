package com.einblick.backend.domain.reconciliation;

import com.einblick.backend.domain.assort.Assort;
import com.einblick.backend.domain.assort.AssortRepository;
import com.einblick.backend.domain.po.PoLine;
import com.einblick.backend.domain.po.PurchaseOrderRepository;
import com.einblick.backend.domain.program.Program;
import com.einblick.backend.domain.program.ProgramRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

// PoLine <-> Assort를 같은 Program + team + player끼리 짝지어 totalQty를 비교한다.
// team/player 조합이 프로그램당 1개씩만 있다고 가정하며, 중복이 있으면 먼저 발견된 것만 사용한다.
@Service
public class ReconciliationService {

    private final ProgramRepository programRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AssortRepository assortRepository;
    private final ReconciliationResultRepository reconciliationResultRepository;

    public ReconciliationService(
        ProgramRepository programRepository,
        PurchaseOrderRepository purchaseOrderRepository,
        AssortRepository assortRepository,
        ReconciliationResultRepository reconciliationResultRepository
    ) {
        this.programRepository = programRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.assortRepository = assortRepository;
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
        if (poLine != null && assort != null) {
            int diff = poLine.getTotalQty() - assort.getTotalQty();
            return ReconciliationResult.builder()
                .poLine(poLine)
                .assort(assort)
                .diffQty(diff)
                .status(diff == 0 ? ReconciliationResult.Status.OK : ReconciliationResult.Status.QTY_MISMATCH)
                .houseMatched(isHouseAlias(assort.getCustomerLabel()))
                .build();
        }
        if (poLine != null) {
            return ReconciliationResult.builder()
                .poLine(poLine)
                .diffQty(poLine.getTotalQty())
                .status(ReconciliationResult.Status.MISSING_IN_ASSORT)
                .build();
        }
        return ReconciliationResult.builder()
            .assort(assort)
            .diffQty(-assort.getTotalQty())
            .status(ReconciliationResult.Status.MISSING_IN_PO)
            .houseMatched(isHouseAlias(assort.getCustomerLabel()))
            .build();
    }

    // CUSTOMER 라벨이 공란이면 HOUSE로 자동 매칭된 것으로 간주한다.
    private boolean isHouseAlias(String customerLabel) {
        return customerLabel == null || customerLabel.isBlank();
    }

    private record LineKey(String team, String player) {
        static LineKey of(String team, String player) {
            return new LineKey(team, player);
        }
    }
}
