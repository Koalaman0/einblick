package com.einblick.backend.domain.customer;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * '고객사 별 패킹 정보.xlsx' 마스터(43개 거래처)를 CUSTOMERS 테이블에 upsert한다.
 * 이름(대소문자 무시)으로 기존 거래처를 찾아 패킹 표준값만 갱신하고, 없으면 새로 만든다.
 * 앱 기동 시마다 실행되지만 upsert라 몇 번을 실행해도 결과는 같다(멱등).
 */
@Component
public class CustomerPackingMasterSeeder implements ApplicationRunner {

    private final CustomerRepository customerRepository;

    public CustomerPackingMasterSeeder(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    private record Row(
        String name, String method, String format, String code,
        String assortSolid, String ratio, String polybag, String carton, String hanger
    ) {}

    // name, method(STK), format, code, assortSolid, ratio, polybag, carton, hanger
    // 원본: CUSTOMER 별 패킹 정보.xlsx (2026-08-14 업로드본, S26 STK 시트)
    private static final List<Row> ROWS = List.of(
        new Row("ACADEMY SPORTS", "RFID", "DSG", "ACA", "SOLID", "-", "6", "12", "485B(4-20)/497B(INF-TOD)"),
        new Row("ARAMARK RETAIL METS", "RFID", "A903104", "NYM", "SOLID", "-", "12", "12", null),
        new Row("ARAMARK SPORTS & ENT PHILLIES", "RFID", "A903104", "PHI", "SOLID", "-", "6", "36", "485B(8-20)/472W(4-7)/496W(TOD-INF)"),
        new Row("BRAVES", "PRN", null, "ATL", "SOLID", "-", "12", "12", null),
        new Row("CLEVELAND GUARDIANS", "RFID", "L90339", "GUA", "SOLID", "-", "12", "12", "496W(INF-TOD)"),
        new Row("DELAWARE NORTH COMPANIES", "PRN", null, "DNC", "SOLID", "-", "12", "12", null),
        new Row("DELAWARE N-SPRTS SVC MERC-REDS", "RFID", "L90339", "CIN", "SOLID", "-", "12", "12", "496W(INF-TOD)"),
        new Row("DICKS SPORTING GOODS", "RFID", "DSG", "DSG", null, null, null, null, "485B(4-20) 498B(TOD) /CS1Q"),
        new Row("FANATICS", "UPC", null, "FAN", "SOLID", "-", "IND", "36", null),
        new Row("FANATICS IN VENUE", "PRN", null, "FIV", "SOLID", "-", "IND", "36", null),
        new Row("FANATICS INTERNATIONAL", "PRN", null, "FAI", null, null, null, null, null),
        new Row("FGL SPORTS LTD", "RFID", "FGL", "FGL", "SOLID/ASSORT", "-", "IND", "36", null),
        new Row("FOLLETT", "PRN", null, "FOL", "SOLID/ASSORT", null, "6", "12", "472W(4-20)/496W(TOD-INF)"),
        new Row("FOOT LOCKER", "PRN", null, "FTL", "ASSORT", "-", "6", "36", null),
        new Row("HATWORLD INC/GCO CANADA", "PRN", null, null, "SOLID", "-", "IND", "36", null),
        new Row("HOUSE", "UPC PRN(AUS)", null, null, "SOLID", "-", "IND", "36", null),
        new Row("HOUSTON ASTROS BASEBALL", "RFID", "L90339", "HOU", "SOLID", "-", "12", "12", "496W(NB-INF)"),
        new Row("INNOVA", "UPC", null, "INN", "SOLID", "-", "IND", "36", null),
        new Row("JC PENNEY", "PRN", null, "JCP", "SOLID/ASSORT", null, "6", "6", "485B(8-20)/472W(4-7)/496W(TOD-INF)"),
        new Row("LA DODGERS", "PRN", null, "LAD", "SOLID", "-", "24", "24", null),
        new Row("LEGENDS GLOBAL MERCHANDISE MLB STORE", "RFID", "MAINGATE", "MLB", "SOLID", "-", "12", "12", null),
        new Row("LEGENDS HM-YANKEES", "RFID", "DSG", "NYY", "SOLID", "-", "12", "12", null),
        new Row("LEGENDS HOSPITALITY LLC - ANGELS", "PRN", null, "LAA", "SOLID", "-", "12", "12", null),
        new Row("LEVY PARTNERS CUBS", "UPC", null, "CUB", "SOLID", "-", "12", "12", null),
        new Row("LEVY TAMPA BAY RAYS", "PRN", null, "TBR", "SOLID", "-", "12", "12", null),
        new Row("LIDS SPORTS GROUP", "UPC", null, null, "SOLID", null, "IND", "36", null),
        new Row("LS TRAVEL RETAIL NA", "PRN", null, null, "SOLID", "-", "IND", "36", null),
        new Row("MAIN GATE", "RFID", "MGT", null, null, null, null, null, null),
        new Row("NIKE COMMECIAL", "PRN", null, null, "SOLID", null, "IND", "36", "-"),
        new Row("NIKE EMPLOYEE STORES", "UPC", null, "NIK", "SOLID", "-", "IND", "24", "485B(4-20)/498B(INF-TOD)"),
        new Row("PRO HOCKEY LIFE", "PRN", null, null, "SOLID", null, "IND", "36", null),
        new Row("SAMPLER STORES INC", "UPC", null, "SSI", "ASSORT", "3:4:3:2", "12", "12", "496W(0-4T)"),
        new Row("SCHEELS ALL SPORTS INC", "UPC", null, "SCH", "ASSORT", "3:4:3:2", "12", "12", "496W(0-4T)"),
        new Row("THE SEATTLE MARINERS", "PRN", null, "MRN", "SOLID", "-", "12", "12", null),
        new Row("TORONTO BLUE JAYS", "PRN", null, "TBJ", "SOLID", null, "IND", "36", null),
        new Row("OVADIA SPORTING GOODS", "UPC", null, "OVA", "SOLID", null, "IND", "36", "-"),
        new Row("M&N LIMITED DISTRIBUTION", "PRN(CAD,US,AUS) UPC(EU)", null, null, "SOLID", null, "IND", "36", "-"),
        new Row("MITCHELL & NESS", "PRN", null, null, "SOLID", null, "IND", "36", "-"),
        new Row("MITCHELL & NESS - ECOM", "PRN", null, null, "SOLID", null, "IND", "36", "-"),
        new Row("SAM'S CLUB", "RFID", null, "SAM", "SOLID", "-", "IND", "24", null),
        new Row("SAM'S ECOMMERCE", "UPC", null, "SME", "SOLID", "-", "IND", "24", null),
        new Row("CHAMPS SPORTS", "UPC", "매번 달라지니 그때그때 물어보기", null, null, null, null, null, null),
        new Row("DALLAS COWBOYS", "UPC", null, null, "SOLID", null, "IND", "72", "-")
    );

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (Row row : ROWS) {
            Customer customer = customerRepository.findByNameIgnoreCase(row.name())
                .orElseGet(() -> customerRepository.save(
                    Customer.builder()
                        .code(resolveCode(row))
                        .name(row.name())
                        .houseAlias("HOUSE".equalsIgnoreCase(row.name()))
                        .build()
                ));
            customer.updatePackingStandard(
                row.method(), row.format(), row.assortSolid(),
                row.ratio(), row.polybag(), row.carton(), row.hanger()
            );
        }
    }

    private String resolveCode(Row row) {
        if (row.code() != null && !row.code().isBlank()) {
            return row.code();
        }
        String fallback = row.name().toUpperCase().replaceAll("[^A-Z0-9]+", "_");
        if (fallback.length() > 30) {
            fallback = fallback.substring(0, 30);
        }
        return fallback;
    }
}
