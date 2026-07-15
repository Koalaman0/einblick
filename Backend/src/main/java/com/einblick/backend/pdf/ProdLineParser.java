package com.einblick.backend.pdf;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * PO PDF 2페이지 "Prod Line Details" 테이블 파서.
 *
 * 전제: PDFBox PDFTextStripper.setSortByPosition(true)로 추출한 텍스트를 입력으로 받음.
 * 이 템플릿은 컬럼 폭이 좁아서 스타일코드/팀명이 길면 다음 줄로 줄바꿈되는 특징이 있음
 * (예: "HZ3B3GA2B0" + 다음줄 "0" = "HZ3B3GA2B00").
 *
 * 주의: 팀명 2단어("TORONTO BLUE JAYS") / 컬러 2단어("RUSH BLUE") 기준으로 단어 개수를 가정함.
 * 다른 PO 샘플에서 단어 개수가 다르면 (예: 팀명 1단어, 컬러 3단어) 아래 prefix 분리 로직을 조정해야 함.
 * 실제 서비스에서는 여러 PO 샘플로 검증 후 필요시 버전(템플릿)별 파서로 분리할 것.
 */
public class ProdLineParser {

    // UPC=12자리, HTS=10자리 숫자를 앵커로 잡아서 그 사이 값들을 추출
    private static final Pattern ROW_PATTERN = Pattern.compile(
        "^(?<prefix>.+?)\\s+(?<size>\\S+)\\s+(?<upc>\\d{12})\\s+(?<qty>\\d+)\\s+(?<hts>\\d{10})\\s+(?<desc>.+)$"
    );

    public record ProdLineRow(
        String styleCode,
        String team,
        String customerCode,
        String color,
        String sizeCode,
        String upc,
        int qty,
        String hts,
        String description
    ) {}

    public List<ProdLineRow> parse(String extractedText) {
        List<ProdLineRow> result = new ArrayList<>();
        String[] lines = extractedText.split("\n");

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            Matcher m = ROW_PATTERN.matcher(line);
            if (!m.matches()) continue;

            String prefix = m.group("prefix").trim();
            String size = m.group("size");
            String upc = m.group("upc");
            int qty = Integer.parseInt(m.group("qty"));
            String hts = m.group("hts");
            String desc = m.group("desc").trim();

            // 다음 줄이 새로운 데이터 행이 아니면(=UPC/HTS 패턴이 없으면) 줄바꿈 연속으로 간주
            String continuation = "";
            if (i + 1 < lines.length) {
                String next = lines[i + 1].trim();
                if (!next.isEmpty() && !ROW_PATTERN.matcher(next).matches()) {
                    continuation = next;
                    i++; // 다음 줄 소비 (다시 순회하지 않도록)
                }
            }

            // prefix 예: "HZ3B3GA2B0 TORONTO BLUE NDJ RUSH BLUE"
            // 구조: [스타일코드] [팀명 2단어] [고객코드 1단어] [컬러 2단어]
            String[] parts = prefix.split("\\s+");
            String styleCode = parts.length > 0 ? parts[0] : "";
            String customerCode = "";
            String team = "";
            String color = "";

            if (parts.length >= 6) {
                team = parts[1] + " " + parts[2];
                customerCode = parts[3];
                color = parts[4] + " " + parts[5];
            } else if (parts.length > 1) {
                // 예상과 다른 단어 수 - 최대한 안전하게 남은 걸 team에 몰아넣고 표시
                team = String.join(" ", Arrays.copyOfRange(parts, 1, parts.length));
            }

            if (!continuation.isEmpty()) {
                String[] contParts = continuation.split("\\s+", 2);
                styleCode += contParts[0]; // "0" 이어붙여서 "HZ3B3GA2B00"
                if (contParts.length > 1) {
                    team = (team + " " + contParts[1]).trim(); // "JAYS" 이어붙임
                }
            }

            result.add(new ProdLineRow(styleCode, team, customerCode, color, size, upc, qty, hts, desc));
        }
        return result;
    }
}
