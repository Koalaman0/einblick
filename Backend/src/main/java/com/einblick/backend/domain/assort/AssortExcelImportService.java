package com.einblick.backend.domain.assort;

import com.einblick.backend.domain.program.Program;
import com.einblick.backend.domain.program.ProgramRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ERP 업무 규칙 명세서(v2) 2-3장에 정리된 표준 ASSORT 엑셀 양식을 읽어 Assort/AssortSize로 저장한다.
 * 헤더 행 위치를 고정하지 않고(명세서는 "보통 9행"이라고만 함) STY/TEAM NAME/SIZE/QTY 컬럼이 모두
 * 있는 행을 찾아 그 행을 헤더로 쓴다. 1행 = 스타일·코드·사이즈 1개 조합이라는 명세서 설명대로
 * 같은 (STY, TEAM NAME, PLAYER, CUSTOMER)를 사이즈 개수만큼 여러 행으로 묶어 Assort 하나로 합친다.
 */
@Service
public class AssortExcelImportService {

    private static final List<String> REQUIRED_HEADERS = List.of("STY", "TEAM NAME", "SIZE", "QTY");

    private final ProgramRepository programRepository;
    private final AssortRepository assortRepository;

    public AssortExcelImportService(ProgramRepository programRepository, AssortRepository assortRepository) {
        this.programRepository = programRepository;
        this.assortRepository = assortRepository;
    }

    public record ImportResult(int rowsRead, int skippedRows, List<Assort> created) {}

    @Transactional
    public ImportResult importExcel(MultipartFile file) {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int headerRowIdx = findHeaderRow(sheet);
            if (headerRowIdx < 0) {
                throw new AssortImportException(
                    "ASSORT 표준 양식의 헤더 행(STY/TEAM NAME/SIZE/QTY 컬럼)을 찾지 못했습니다. 표준 템플릿 형식을 확인해주세요.");
            }
            Map<String, Integer> columns = buildColumnIndex(sheet.getRow(headerRowIdx));

            Map<GroupKey, GroupAccumulator> groups = new LinkedHashMap<>();
            int rowsRead = 0;
            int skippedRows = 0;

            for (int r = headerRowIdx + 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String styleCode = cellText(row, columns.get("STY"));
                String team = cellText(row, columns.get("TEAM NAME"));
                String sizeCode = cellText(row, columns.get("SIZE"));
                Integer qty = cellInt(row, columns.get("QTY"));
                if (styleCode == null || team == null || sizeCode == null || qty == null) {
                    continue; // 빈 줄/합계 줄 등 데이터 행이 아닌 경우 - 실패로 세지 않고 조용히 지나간다
                }
                rowsRead++;

                String season = cellText(row, columns.get("SEASON#"));
                String league = cellText(row, columns.get("LEAGUE"));
                Program program;
                try {
                    program = findOrCreateProgram(styleCode, season, league);
                } catch (RuntimeException e) {
                    skippedRows++;
                    continue;
                }

                String player = cellText(row, columns.get("PLAYER"));
                String customerLabel = cellText(row, columns.get("CUSTOMER"));

                GroupKey key = new GroupKey(program.getId(), team, player, customerLabel);
                GroupAccumulator group = groups.computeIfAbsent(key, k -> new GroupAccumulator(
                    program, team, player, customerLabel == null ? "" : customerLabel,
                    cellText(row, columns.get("ASSORT/SOLID")),
                    cellText(row, columns.get("RATIO")),
                    cellText(row, columns.get("POLYBAG")),
                    cellText(row, columns.get("CARTON")),
                    cellText(row, columns.get("HANGER")),
                    file.getOriginalFilename()
                ));
                group.sizeQty.merge(sizeCode, qty, Integer::sum);
            }

            List<Assort> created = new ArrayList<>();
            for (GroupAccumulator group : groups.values()) {
                created.add(assortRepository.save(group.toAssort()));
            }
            return new ImportResult(rowsRead, skippedRows, created);
        } catch (IOException e) {
            throw new UncheckedIOException("엑셀 파일을 읽을 수 없습니다: " + e.getMessage(), e);
        }
    }

    private int findHeaderRow(Sheet sheet) {
        int limit = Math.min(sheet.getLastRowNum(), 30);
        for (int r = 0; r <= limit; r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;
            Map<String, Integer> columns = buildColumnIndex(row);
            if (columns.keySet().containsAll(REQUIRED_HEADERS)) {
                return r;
            }
        }
        return -1;
    }

    private Map<String, Integer> buildColumnIndex(Row headerRow) {
        Map<String, Integer> columns = new LinkedHashMap<>();
        for (Cell cell : headerRow) {
            String text = cellText(cell);
            if (text != null) {
                columns.put(text.toUpperCase(), cell.getColumnIndex());
            }
        }
        return columns;
    }

    private Program findOrCreateProgram(String styleCode, String season, String league) {
        if (season != null && !season.isBlank()) {
            var exact = programRepository.findByStyleCodeAndSeason(styleCode, season);
            if (exact.isPresent()) return exact.get();
        }
        var anyForStyle = programRepository.findFirstByStyleCode(styleCode);
        if (anyForStyle.isPresent()) return anyForStyle.get();

        return programRepository.save(Program.builder()
            .styleCode(styleCode)
            .brand("NIKE") // 이 모듈은 명세서 기준 NIKE MLB 전용 - 신규 STY 생성 시 기본값
            .league(league)
            .season(season)
            .build());
    }

    private String cellText(Row row, Integer colIndex) {
        if (colIndex == null || row == null) return null;
        return cellText(row.getCell(colIndex));
    }

    private String cellText(Cell cell) {
        if (cell == null) return null;
        String text = switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double v = cell.getNumericCellValue();
                yield v == Math.floor(v) ? String.valueOf((long) v) : String.valueOf(v);
            }
            case FORMULA -> cell.getCellFormula();
            default -> null;
        };
        if (text == null) return null;
        String trimmed = text.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Integer cellInt(Row row, Integer colIndex) {
        if (colIndex == null || row == null) return null;
        Cell cell = row.getCell(colIndex);
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return (int) Math.round(cell.getNumericCellValue());
            }
            String text = cellText(cell);
            return text == null ? null : Integer.parseInt(text.replaceAll("[^0-9-]", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private record GroupKey(Long programId, String team, String player, String customerLabel) {}

    private static final class GroupAccumulator {
        final Program program;
        final String team;
        final String player;
        final String customerLabel;
        final String assortSolid;
        final String ratio;
        final String polybag;
        final String carton;
        final String hanger;
        final String sourceFile;
        final Map<String, Integer> sizeQty = new LinkedHashMap<>();

        GroupAccumulator(
            Program program, String team, String player, String customerLabel,
            String assortSolid, String ratio, String polybag, String carton, String hanger, String sourceFile
        ) {
            this.program = program;
            this.team = team;
            this.player = player;
            this.customerLabel = customerLabel;
            this.assortSolid = assortSolid;
            this.ratio = ratio;
            this.polybag = polybag;
            this.carton = carton;
            this.hanger = hanger;
            this.sourceFile = sourceFile;
        }

        Assort toAssort() {
            int totalQty = sizeQty.values().stream().mapToInt(Integer::intValue).sum();
            Assort assort = Assort.builder()
                .program(program)
                .team(team)
                .player(player)
                .customerLabel(customerLabel)
                .assortSolid(assortSolid)
                .ratio(ratio)
                .polybag(polybag)
                .carton(carton)
                .hanger(hanger)
                .sourceFile(sourceFile)
                .totalQty(totalQty)
                .build();
            for (Map.Entry<String, Integer> entry : sizeQty.entrySet()) {
                assort.addSize(AssortSize.builder().sizeCode(entry.getKey()).qty(entry.getValue()).build());
            }
            return assort;
        }
    }
}
