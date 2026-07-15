package com.einblick.backend.pdf;



import com.einblick.backend.domain.po.PurchaseOrder;
import com.einblick.backend.pdf.PoPdfImportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Postman 없이 실제 DB에 붙여서 PO PDF 업로드 로직을 바로 테스트하기 위한 테스트.
 * 진짜로 Oracle에 데이터가 저장되니, 같은 PO를 두 번 실행하면 "이미 등록된 PO입니다" 에러가 나는 게 정상.
 */
@SpringBootTest
public class PoPdfImportServiceTest {

    @Autowired
    private PoPdfImportService poPdfImportService;

    @Test
    void PO_PDF를_업로드하면_저장된다() throws Exception {
        // 실제 PO PDF 파일 경로로 바꿔주세요
        Path pdfPath = Path.of("C:/Users/이지원/Downloads/PO_sample.pdf");
        byte[] pdfBytes = Files.readAllBytes(pdfPath);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "PO_sample.pdf",
                "application/pdf",
                pdfBytes
        );

        PurchaseOrder saved = poPdfImportService.importPdf(file);

        System.out.println("=== 저장 결과 ===");
        System.out.println("PO ID: " + saved.getId());
        System.out.println("PO Number: " + saved.getPoNumber());
        System.out.println("Style: " + saved.getProgram().getStyleCode());
        System.out.println("Brand: " + saved.getProgram().getBrand());
        System.out.println("Transport: " + saved.getTransportMethod());
        System.out.println("Total Qty: " + saved.getTotalQty());
        saved.getPoLines().forEach(line -> {
            System.out.println("  PoLine team=" + line.getTeam() + " totalQty=" + line.getTotalQty());
            line.getSizes().forEach(size ->
                    System.out.println("    size=" + size.getSizeCode() + " qty=" + size.getQty())
            );
        });
    }
}