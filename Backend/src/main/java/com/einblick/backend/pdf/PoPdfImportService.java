package com.einblick.backend.pdf;

import com.einblick.backend.domain.customer.Customer;
import com.einblick.backend.domain.customer.CustomerRepository;
import com.einblick.backend.domain.po.PoLine;
import com.einblick.backend.domain.po.PoLineSize;
import com.einblick.backend.domain.po.PurchaseOrder;
import com.einblick.backend.domain.po.PurchaseOrderRepository;
import com.einblick.backend.domain.program.Program;
import com.einblick.backend.domain.program.ProgramRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PoPdfImportService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProgramRepository programRepository;
    private final CustomerRepository customerRepository;
    private final PoHeaderParser headerParser = new PoHeaderParser();
    private final ProdLineParser prodLineParser = new ProdLineParser();

    public PoPdfImportService(
        PurchaseOrderRepository purchaseOrderRepository,
        ProgramRepository programRepository,
        CustomerRepository customerRepository
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.programRepository = programRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional
    public PurchaseOrder importPdf(MultipartFile file) {
        String headerPageText = null;
        StringBuilder dataPagesText = new StringBuilder();

        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            int pageCount = doc.getNumberOfPages();
            for (int pageNum = 1; pageNum <= pageCount; pageNum++) {
                String pageText = extractPage(doc, pageNum);

                // 페이지 번호가 아니라 내용으로 유형 판별
                // - "PURCHASE ORDER" 헤더 박스가 있는 페이지 = PO 헤더 정보
                // - "PACKING/UPC INFO" 헤더 박스가 있는 페이지 = 사이즈별 수량 데이터
                // 사이즈/컬러가 많아서 데이터 페이지가 여러 장이어도 전부 이어붙여서 하나로 처리
                if (pageText.contains("PACKING") && pageText.contains("UPC")) {
                    dataPagesText.append(pageText).append("\n");
                } else if (headerPageText == null && pageText.contains("PURCHASE ORDER")) {
                    headerPageText = pageText;
                }
            }
        } catch (IOException e) {
            throw new PoPdfParseException("PDF 파일을 읽을 수 없습니다: " + e.getMessage(), e);
        }

        if (headerPageText == null) {
            throw new PoPdfParseException("PO 헤더 페이지(PURCHASE ORDER)를 찾지 못했습니다.");
        }
        if (dataPagesText.isEmpty()) {
            throw new PoPdfParseException("사이즈별 수량 데이터 페이지(PACKING/UPC INFO)를 찾지 못했습니다.");
        }

        PoHeaderParser.PoHeader header = headerParser.parse(headerPageText);
        if (header.poNumber() == null) {
            throw new PoPdfParseException("PO NUMBER를 PDF에서 추출하지 못했습니다. 템플릿 형식을 확인해주세요.");
        }
        if (purchaseOrderRepository.existsByPoNumber(header.poNumber())) {
            throw new PoPdfParseException("이미 등록된 PO입니다: " + header.poNumber());
        }

        List<ProdLineParser.ProdLineRow> rows = prodLineParser.parse(dataPagesText.toString());
        if (rows.isEmpty()) {
            throw new PoPdfParseException("사이즈별 수량 정보를 추출하지 못했습니다.");
        }

        Program program = findOrCreateProgram(header);
        Customer customer = findOrCreateHouseCustomer();

        int grandTotalQty = rows.stream().mapToInt(ProdLineParser.ProdLineRow::qty).sum();

        PurchaseOrder po = PurchaseOrder.builder()
            .poNumber(header.poNumber())
            .program(program)
            .customer(customer)
            .dlvyDate(header.xfactoryDate())
            .transportMethod(parseTransportMethod(header.transportMethod()))
            .totalQty(grandTotalQty)
            .originalPdfUrl(null) // 실제 파일 저장 경로 붙일 위치 (스토리지 연동 시 채울 것)
            .build();

        // 이 템플릿은 사이즈별로 행이 나뉘어 있고 팀은 전부 동일 -> team별로 묶어서 PoLine을 생성
        // (한 PO 안에 팀이 여러 개 섞인 경우도 이 로직이 자동으로 PoLine을 team 개수만큼 나눠서 만들어줌)
        Map<String, List<ProdLineParser.ProdLineRow>> byTeam = new HashMap<>();
        for (ProdLineParser.ProdLineRow row : rows) {
            byTeam.computeIfAbsent(row.team(), k -> new java.util.ArrayList<>()).add(row);
        }

        for (Map.Entry<String, List<ProdLineParser.ProdLineRow>> entry : byTeam.entrySet()) {
            int lineTotal = entry.getValue().stream().mapToInt(ProdLineParser.ProdLineRow::qty).sum();

            PoLine poLine = PoLine.builder()
                .team(entry.getKey())
                .totalQty(lineTotal)
                .build();

            for (ProdLineParser.ProdLineRow row : entry.getValue()) {
                PoLineSize size = PoLineSize.builder()
                    .sizeCode(row.sizeCode())
                    .qty(row.qty())
                    .build();
                poLine.addSize(size);
            }
            po.addPoLine(poLine);
        }

        return purchaseOrderRepository.save(po);
    }

    private String extractPage(PDDocument doc, int pageNumber) throws IOException {
        PDFTextStripper stripper = new PDFTextStripper();
        stripper.setSortByPosition(true);
        stripper.setStartPage(pageNumber);
        stripper.setEndPage(pageNumber);
        return stripper.getText(doc);
    }

    private Program findOrCreateProgram(PoHeaderParser.PoHeader header) {
        return programRepository.findByStyleCodeAndSeason(header.styleCode(), header.season())
            .orElseGet(() -> programRepository.save(
                Program.builder()
                    .styleCode(header.styleCode())
                    .styleName(header.styleName())
                    .brand(header.brand())
                    .league(header.league())
                    .season(header.season())
                    .build()
            ));
    }

    private Customer findOrCreateHouseCustomer() {
        return customerRepository.findByCode("HOUSE")
            .orElseGet(() -> customerRepository.save(
                Customer.builder()
                    .code("HOUSE")
                    .name("HOUSE")
                    .houseAlias(true)
                    .build()
            ));
    }

    private PurchaseOrder.TransportMethod parseTransportMethod(String raw) {
        if (raw == null) return PurchaseOrder.TransportMethod.UNASSIGNED;
        try {
            return PurchaseOrder.TransportMethod.valueOf(raw);
        } catch (IllegalArgumentException e) {
            return PurchaseOrder.TransportMethod.UNASSIGNED;
        }
    }
}
