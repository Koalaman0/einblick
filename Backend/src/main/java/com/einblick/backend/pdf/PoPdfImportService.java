package com.einblick.backend.pdf;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * PO PDF 업로드 진입점. PDF 한 장에 PO가 여러 개 묶여 있을 수 있어서, 페이지를 앞에서부터
 * 훑으며 "PURCHASE ORDER" 헤더 페이지를 만날 때마다 새 PO로 구분하고, 그 뒤로 이어지는
 * "PACKING"+"UPC" 데이터 페이지들을 해당 PO에 붙인다. PO별로 PoImportUnitService를 호출해
 * 독립적으로 저장하므로, 여러 PO 중 일부가 실패해도 나머지는 정상 등록된다.
 */
@Service
public class PoPdfImportService {

    private static final Logger log = LoggerFactory.getLogger(PoPdfImportService.class);

    private final PoImportUnitService poImportUnitService;

    public PoPdfImportService(PoImportUnitService poImportUnitService) {
        this.poImportUnitService = poImportUnitService;
    }

    public PoBatchImportResponse importPdf(MultipartFile file) {
        List<PoSegment> segments = extractSegments(file);
        if (segments.isEmpty()) {
            throw new PoPdfParseException("PO 헤더 페이지(PURCHASE ORDER)를 찾지 못했습니다.");
        }

        List<PoImportResponse> created = new ArrayList<>();
        List<String> failures = new ArrayList<>();

        for (int i = 0; i < segments.size(); i++) {
            PoSegment segment = segments.get(i);
            String label = segments.size() > 1 ? (i + 1) + "번째 PO: " : "";
            try {
                if (segment.headerPageText() == null) {
                    throw new PoPdfParseException("PO 헤더 페이지(PURCHASE ORDER)를 찾지 못했습니다.");
                }
                if (segment.dataIsEmpty()) {
                    throw new PoPdfParseException("사이즈별 수량 데이터 페이지(PACKING/UPC INFO)를 찾지 못했습니다.");
                }
                created.add(PoImportResponse.from(
                    poImportUnitService.importOne(segment.headerPageText(), segment.dataPagesText())
                ));
            } catch (PoPdfParseException e) {
                failures.add(label + e.getMessage());
            } catch (DataIntegrityViolationException e) {
                log.error("PO PDF 저장 중 데이터 무결성 오류", e);
                failures.add(label + "데이터 저장 중 오류가 발생했습니다.");
            } catch (RuntimeException e) {
                log.error("PO PDF 파싱 중 예상치 못한 오류", e);
                failures.add(label + "처리 중 예상치 못한 오류가 발생했습니다: " + e.getMessage());
            }
        }

        if (created.isEmpty()) {
            throw new PoPdfParseException(String.join(" / ", failures));
        }

        return new PoBatchImportResponse(segments.size(), created.size(), failures.size(), created, failures);
    }

    private List<PoSegment> extractSegments(MultipartFile file) {
        List<PoSegment> segments = new ArrayList<>();
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            int pageCount = doc.getNumberOfPages();
            PoSegment current = null;
            for (int pageNum = 1; pageNum <= pageCount; pageNum++) {
                String pageText = extractPage(doc, pageNum);

                // 페이지 번호가 아니라 내용으로 유형 판별
                // - "PACKING/UPC INFO" 헤더 박스가 있는 페이지 = 사이즈별 수량 데이터 -> 현재 PO에 이어붙임
                // - "PURCHASE ORDER" 헤더 박스가 있는 페이지 = 새 PO의 시작
                if (pageText.contains("PACKING") && pageText.contains("UPC")) {
                    if (current == null) {
                        current = new PoSegment(null);
                        segments.add(current);
                    }
                    current.appendData(pageText);
                } else if (pageText.contains("PURCHASE ORDER")) {
                    current = new PoSegment(pageText);
                    segments.add(current);
                }
            }
        } catch (IOException e) {
            throw new PoPdfParseException("PDF 파일을 읽을 수 없습니다: " + e.getMessage(), e);
        }
        return segments;
    }

    private String extractPage(PDDocument doc, int pageNumber) throws IOException {
        PDFTextStripper stripper = new PDFTextStripper();
        stripper.setSortByPosition(true);
        stripper.setStartPage(pageNumber);
        stripper.setEndPage(pageNumber);
        return stripper.getText(doc);
    }

    private static final class PoSegment {
        private final String headerPageText;
        private final StringBuilder dataPagesText = new StringBuilder();

        PoSegment(String headerPageText) {
            this.headerPageText = headerPageText;
        }

        String headerPageText() {
            return headerPageText;
        }

        void appendData(String text) {
            dataPagesText.append(text).append("\n");
        }

        String dataPagesText() {
            return dataPagesText.toString();
        }

        boolean dataIsEmpty() {
            return dataPagesText.isEmpty();
        }
    }
}
