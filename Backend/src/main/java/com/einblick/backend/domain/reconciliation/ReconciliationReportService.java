package com.einblick.backend.domain.reconciliation;

import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.UnderlinePatterns;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTShd;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.STShd;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * PO-ASSORT 대사 결과(reconciliation_results)를 명세서 6장 양식(개요 - 종합 결과 - 상세 내용 -
 * 정상 확인 항목 - 참고사항)에 맞춰 .docx 보고서로 만든다. ReconciliationService.run()이 만든
 * status/note를 그대로 재배치하는 것이라, 검증 로직 자체를 바꾸지 않고 결과를 보고서 형태로
 * 내려주는 역할만 한다.
 */
@Service
public class ReconciliationReportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final String COLOR_GRAY = "D9D9D9";
    private static final String COLOR_GREEN = "C6EFCE";
    private static final String COLOR_RED = "FFC7CE";
    private static final String COLOR_AMBER = "FFEB9C";

    public byte[] generate(List<ReconciliationResult> results) {
        try (XWPFDocument doc = new XWPFDocument()) {
            addTitle(doc, results);
            addOverviewSection(doc, results);
            addSummarySection(doc, results);
            addDetailSection(doc, results);
            addVerifiedSection(doc, results);
            addNotesSection(doc);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("보고서 생성 중 오류가 발생했습니다.", e);
        }
    }

    private void addTitle(XWPFDocument doc, List<ReconciliationResult> results) {
        XWPFParagraph title = doc.createParagraph();
        title.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun run = title.createRun();
        run.setText("PO-ASSORT 대사 보고서");
        run.setBold(true);
        run.setFontSize(20);

        XWPFParagraph subtitle = doc.createParagraph();
        subtitle.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun subRun = subtitle.createRun();
        subRun.setText("검토일: " + LocalDate.now().format(DATE_FMT) + "  ·  대상 " + results.size() + "건");
        subRun.setColor("64748B");
        subRun.setFontSize(11);
    }

    private void addOverviewSection(XWPFDocument doc, List<ReconciliationResult> results) {
        addHeading(doc, "1. 검토 개요");
        addParagraph(doc, "대조 방법론: PO(PurchaseOrder)와 ASSORT를 프로그램(스타일) + TEAM + PLAYER 조합으로 매칭하여 수량을 비교합니다.");
        addParagraph(doc, "검증 범위: 수량 일치 여부 외에, RATIO 정합성(GCD 약분), ASSORT/SOLID·CARTON의 고객사 표준 대비 이탈, "
            + "CUSTOMER 공란=HOUSE 자동 인식, STY 세그먼트-PLAYER 일치 여부를 함께 확인합니다.");
        addParagraph(doc, "대상 건수: " + results.size() + "건");
    }

    private void addSummarySection(XWPFDocument doc, List<ReconciliationResult> results) {
        addHeading(doc, "2. 종합 결과");

        Map<ReconciliationResult.Status, Long> counts = new LinkedHashMap<>();
        for (ReconciliationResult.Status status : ReconciliationResult.Status.values()) {
            counts.put(status, 0L);
        }
        for (ReconciliationResult result : results) {
            counts.merge(result.getStatus(), 1L, Long::sum);
        }

        XWPFTable table = doc.createTable(counts.size() + 1, 2);
        setHeaderRow(table.getRow(0), List.of("상태", "건수"));
        int rowIdx = 1;
        for (Map.Entry<ReconciliationResult.Status, Long> entry : counts.entrySet()) {
            XWPFTableCell labelCell = table.getRow(rowIdx).getCell(0);
            labelCell.setText(statusLabel(entry.getKey()));
            shadeCell(labelCell, statusColor(entry.getKey()));
            table.getRow(rowIdx).getCell(1).setText(String.valueOf(entry.getValue()));
            rowIdx++;
        }
    }

    private void addDetailSection(XWPFDocument doc, List<ReconciliationResult> results) {
        addHeading(doc, "3. 상세 내용");

        List<ReconciliationResult> problems = results.stream()
            .filter(r -> r.getStatus() != ReconciliationResult.Status.OK)
            .toList();

        if (problems.isEmpty()) {
            addParagraph(doc, "불일치/확인필요 항목이 없습니다.");
            return;
        }

        for (ReconciliationResult r : problems) {
            XWPFParagraph sub = doc.createParagraph();
            XWPFRun subRun = sub.createRun();
            subRun.setText("[" + statusLabel(r.getStatus()) + "] " + lineLabel(r));
            subRun.setBold(true);
            subRun.setColor(statusTextColor(r.getStatus()));
            subRun.setFontSize(13);

            XWPFTable table = doc.createTable(2, 4);
            setHeaderRow(table.getRow(0), List.of("PO 수량", "ASSORT 수량", "차이", "고객사"));
            table.getRow(1).getCell(0).setText(r.getPoLine() != null ? String.valueOf(r.getPoLine().getTotalQty()) : "-");
            table.getRow(1).getCell(1).setText(r.getAssort() != null ? String.valueOf(r.getAssort().getTotalQty()) : "-");
            table.getRow(1).getCell(2).setText(String.valueOf(r.getDiffQty()));
            table.getRow(1).getCell(3).setText(r.getAssort() != null && !r.getAssort().getCustomerLabel().isBlank()
                ? r.getAssort().getCustomerLabel() : (r.getHouseMatched() ? "(공란 · HOUSE)" : "-"));

            if (r.getNote() != null && !r.getNote().isBlank()) {
                addParagraph(doc, "근거: " + r.getNote());
            }
            doc.createParagraph(); // spacing
        }
    }

    private void addVerifiedSection(XWPFDocument doc, List<ReconciliationResult> results) {
        addHeading(doc, "4. 정상 확인 항목");
        long okCount = results.stream().filter(r -> r.getStatus() == ReconciliationResult.Status.OK).count();
        addBullet(doc, okCount + "건은 PO/ASSORT 수량이 일치하고, 아래 규칙 위반도 발견되지 않았습니다.");
        addBullet(doc, "CUSTOMER 공란은 오류가 아니라 HOUSE로 자동 인식하여 비교했습니다.");
        addBullet(doc, "RATIO가 기재된 건은 실제 사이즈별 수량을 GCD로 약분한 값과 일치하는지 확인했습니다.");
        addBullet(doc, "ASSORT/SOLID 구분에 따라 RATIO 기재 여부(ASSORT=필수, SOLID=공란)를 확인했습니다.");
        addBullet(doc, "ASSORT/SOLID·CARTON 값을 고객사 패킹정보 마스터의 표준값과 대조했습니다.");
    }

    private void addNotesSection(XWPFDocument doc) {
        addHeading(doc, "5. 참고사항");
        addBullet(doc, "STY 세그먼트(B/P/S)-PLAYER 일치 검증은 이번 버전에 포함되지 않습니다 - PDF 파싱이 선수명을 TEAM "
            + "필드에만 기록하고 PLAYER는 채우지 않아, 검증을 시도했을 때 실제 선수 라인 대부분이 오탐으로 잡혔습니다.");
        addBullet(doc, "STY 리비전 '01' 허용팀 화이트리스트, PACKING/UPC 페이지 고객사명 화이트리스트 매칭, PO 분할/전환 인식, "
            + "시즌/출하수단 스코프 규칙은 이번 버전에 포함되지 않았습니다.");
        addBullet(doc, "이 보고서는 대사 실행(POST /api/reconciliation/run) 시점의 데이터를 기준으로 생성됩니다.");
    }

    // ---- helpers ----

    private void addHeading(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(300);
        XWPFRun run = p.createRun();
        run.setText(text);
        run.setBold(true);
        run.setFontSize(15);
        run.setUnderline(UnderlinePatterns.SINGLE);
    }

    private void addParagraph(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        XWPFRun run = p.createRun();
        run.setText(text);
        run.setFontSize(11);
    }

    private void addBullet(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        p.setIndentationLeft(300);
        XWPFRun run = p.createRun();
        run.setText("• " + text);
        run.setFontSize(11);
    }

    private void setHeaderRow(XWPFTableRow row, List<String> labels) {
        for (int i = 0; i < labels.size(); i++) {
            XWPFTableCell cell = row.getCell(i);
            cell.setText(labels.get(i));
            shadeCell(cell, COLOR_GRAY);
            for (XWPFParagraph p : cell.getParagraphs()) {
                for (XWPFRun r : p.getRuns()) {
                    r.setBold(true);
                }
            }
        }
    }

    private void shadeCell(XWPFTableCell cell, String hexColor) {
        CTShd shd = cell.getCTTc().addNewTcPr().addNewShd();
        shd.setVal(STShd.CLEAR);
        shd.setColor("auto");
        shd.setFill(hexColor);
    }

    private String statusLabel(ReconciliationResult.Status status) {
        return switch (status) {
            case OK -> "일치";
            case QTY_MISMATCH -> "불일치";
            case MISSING_IN_ASSORT -> "ASSORT 누락";
            case MISSING_IN_PO -> "PO 누락";
            case NEEDS_REVIEW -> "확인 필요";
        };
    }

    private String statusColor(ReconciliationResult.Status status) {
        return switch (status) {
            case OK -> COLOR_GREEN;
            case QTY_MISMATCH -> COLOR_RED;
            case NEEDS_REVIEW -> COLOR_AMBER;
            case MISSING_IN_ASSORT, MISSING_IN_PO -> COLOR_GRAY;
        };
    }

    private String statusTextColor(ReconciliationResult.Status status) {
        return switch (status) {
            case QTY_MISMATCH -> "C00000";
            case NEEDS_REVIEW -> "B45309";
            case MISSING_IN_ASSORT, MISSING_IN_PO -> "475569";
            case OK -> "1E7B34";
        };
    }

    private String lineLabel(ReconciliationResult r) {
        String team = r.getPoLine() != null ? r.getPoLine().getTeam() : (r.getAssort() != null ? r.getAssort().getTeam() : null);
        String player = r.getPoLine() != null ? r.getPoLine().getPlayer() : (r.getAssort() != null ? r.getAssort().getPlayer() : null);
        String styleCode = r.getPoLine() != null
            ? r.getPoLine().getPurchaseOrder().getProgram().getStyleCode()
            : (r.getAssort() != null ? r.getAssort().getProgram().getStyleCode() : "-");
        String poNumber = r.getPoLine() != null ? r.getPoLine().getPurchaseOrder().getPoNumber() : null;
        StringBuilder sb = new StringBuilder(styleCode).append(" · ");
        if (team != null && !team.isBlank()) sb.append(team);
        if (player != null && !player.isBlank()) sb.append(" · ").append(player);
        if (poNumber != null) sb.append(" (").append(poNumber).append(")");
        return sb.toString();
    }
}
