package com.einblick.backend.pdf;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * PO PDF "Prod Line Details" 테이블 파서.
 *
 * 전제: PDFBox PDFTextStripper.setSortByPosition(true)로 추출한 텍스트를 입력으로 받음.
 * 페이지 경계는 PoPdfImportService가 pageMarker(n)으로 찍어 넣은 마커 줄로 구분한다 - 파싱에
 * 실패한 줄이 원본 PDF 몇 페이지에 있었는지 사용자에게 알려주기 위함(수동 등록 시 참고용).
 *
 * 실제 발주서에서 확인된 특징:
 * - HTS 코드(10자리 숫자)는 항상 있고, 그 바로 앞 토큰이 수량(정수)이다 -> 이 둘을 오른쪽에서부터
 *   찾는 게 가장 안정적인 앵커. UPC는 12자리 숫자일 때도 있지만 아직 배정 전이면 "Contact" 같은
 *   문자열이 들어오기도 하고, UPC와 수량 사이에 Ratio(팩 비율) 숫자가 하나 더 끼어드는 템플릿도
 *   있어서 UPC를 앵커로 쓰면(예전 방식) 매칭이 깨진다.
 * - 사이즈 코드("S-8", "M-10/12", "XL-18/20"처럼 하이픈이 들어간 토큰)로 사이즈 위치를 우선
 *   찾고, 못 찾으면 [스타일코드][팀명][고객코드 1단어][컬러 2단어] 다음 토큰을 사이즈로 가정한다.
 * - 컬럼 폭이 좁아 팀/플레이어명이 다음 줄로 줄바꿈되는 경우가 있는데(예: "TORONTO BLUE" +
 *   다음줄 "JAYS"), 그 다음 줄에는 설명(description)이 줄바꿈된 것("Outerstuff For", "UPC")도
 *   똑같이 나타나서 "데이터 행이 아닌 다음 줄 = 팀명 이어붙이기"로 자동 판단할 수가 없다.
 *   설명 텍스트를 팀명에 잘못 붙이면 사이즈/수량은 멀쩡해도 팀명이 오염돼 대사(reconciliation)
 *   매칭이 깨지므로, 이어붙이기는 하지 않고 팀명이 줄바꿈으로 잘리는 것을 감수한다 - 고객코드/
 *   컬러는 항상 사이즈 바로 앞 고정 위치(끝에서부터 3칸)에 있어서 팀명 단어 수가 줄어들어도
 *   영향받지 않는다.
 *
 * 다른 벤더/템플릿에서 컬러가 3단어 이상이면 아래 고정폭 가정을 조정해야 할 수 있음 - 실제
 * 서비스에서는 여러 PO 샘플로 계속 검증할 것.
 */
public class ProdLineParser {

    private static final Pattern HTS_PATTERN = Pattern.compile("\\d{10}");
    private static final Pattern DIGITS_PATTERN = Pattern.compile("\\d+");
    private static final Pattern ANY_DIGIT = Pattern.compile(".*\\d.*");
    private static final int PREFIX_TOKEN_COUNT = 6; // 스타일코드 + 팀명(2) + 고객코드(1) + 컬러(2)

    // PoPdfImportService가 페이지 경계에 심어두는 마커 줄. 실제 PDF 본문 텍스트와 겹칠 일이
    // 없도록 흔치 않은 토큰(EINBLICKPAGEMARKER)으로 감싼다.
    private static final String MARKER_TAG = "EINBLICKPAGEMARKER";
    private static final Pattern PAGE_MARKER = Pattern.compile("^" + MARKER_TAG + "(\\d+)" + MARKER_TAG + "$");
    // 페이지 하단 "Page 3 Of 8" 같은 반복 문구 - 데이터 행이 아니라 매 페이지 나오는 노이즈라 제외.
    private static final Pattern PAGE_FOOTER = Pattern.compile("(?i)^Page\\s+\\d+\\s+Of\\s+\\d+.*");

    public static String pageMarker(int pageNumber) {
        return MARKER_TAG + pageNumber + MARKER_TAG;
    }

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

    // 파싱 못 한(=HTS/사이즈 앵커를 못 찾은) 줄 중, 숫자가 섞여 있어 데이터 행이었을 가능성이
    // 있는 것만 후보로 모은다. 완벽한 판별은 불가능하므로 "확인해볼 만한 줄" 정도로 취급할 것.
    public record SkippedLine(int page, String text) {}

    public record ParseResult(List<ProdLineRow> rows, List<SkippedLine> skipped) {}

    public ParseResult parse(String extractedText) {
        List<ProdLineRow> result = new ArrayList<>();
        List<SkippedLine> skipped = new ArrayList<>();
        String[] lines = extractedText.split("\n");
        int currentPage = 0;

        for (String rawLine : lines) {
            String trimmed = rawLine.trim();
            Matcher markerM = PAGE_MARKER.matcher(trimmed);
            if (markerM.matches()) {
                currentPage = Integer.parseInt(markerM.group(1));
                continue;
            }
            if (trimmed.isEmpty()) continue;

            String[] tokens = tokenize(trimmed);
            int htsIdx = findHtsIndex(tokens);
            if (htsIdx < 0) {
                addIfLooksLikeData(skipped, currentPage, trimmed, tokens);
                continue;
            }

            int sizeIdx = findSizeIndex(tokens, htsIdx);
            if (sizeIdx < 0) {
                addIfLooksLikeData(skipped, currentPage, trimmed, tokens);
                continue;
            }

            int qty = Integer.parseInt(tokens[htsIdx - 1]);
            String hts = tokens[htsIdx];
            String desc = String.join(" ", Arrays.copyOfRange(tokens, htsIdx + 1, tokens.length));
            String sizeCode = tokens[sizeIdx];
            String upc = sizeIdx + 1 <= htsIdx - 2 ? tokens[sizeIdx + 1] : "";

            // prefix 예: "HZ3B7B1AP00 BARGER ADDISON NJW COBALT PULSE"
            // 구조: [스타일코드] [팀명(가변 단어 수)] [고객코드 1단어] [컬러 2단어]
            // 고객코드/컬러는 항상 사이즈 바로 앞 고정 위치(끝에서 3칸)에 있으므로, 팀명이
            // 줄바꿈으로 일부 잘려 단어 수가 달라져도 안전하게 분리된다.
            String[] prefixTokens = Arrays.copyOfRange(tokens, 0, sizeIdx);
            String styleCode = prefixTokens.length > 0 ? prefixTokens[0] : "";
            String customerCode = "";
            String team = "";
            String color = "";

            if (prefixTokens.length >= 4) {
                color = prefixTokens[prefixTokens.length - 2] + " " + prefixTokens[prefixTokens.length - 1];
                customerCode = prefixTokens[prefixTokens.length - 3];
                team = String.join(" ", Arrays.copyOfRange(prefixTokens, 1, prefixTokens.length - 3));
            } else if (prefixTokens.length > 1) {
                team = String.join(" ", Arrays.copyOfRange(prefixTokens, 1, prefixTokens.length));
            }

            result.add(new ProdLineRow(styleCode, team, customerCode, color, sizeCode, upc, qty, hts, desc));
        }
        return new ParseResult(result, skipped);
    }

    // 숫자가 하나도 없는 줄(설명 텍스트, 헤더 등)이나 페이지 하단 "Page N Of M" 문구는 제외하고,
    // 그 외에 토큰이 3개 이상이면서 숫자가 섞인 줄만 "혹시 놓친 데이터 행일 수 있음" 후보로 남긴다.
    // 완벽한 판별기가 아니라 사용자가 페이지를 열어 직접 확인하라는 참고용 신호다.
    private void addIfLooksLikeData(List<SkippedLine> skipped, int page, String trimmed, String[] tokens) {
        if (tokens.length < 3) return;
        if (PAGE_FOOTER.matcher(trimmed).matches()) return;
        if (!ANY_DIGIT.matcher(trimmed).matches()) return;
        skipped.add(new SkippedLine(page, trimmed));
    }

    private String[] tokenize(String line) {
        return line.isEmpty() ? new String[0] : line.split("\\s+");
    }

    // 오른쪽부터 훑어서 "HTS(10자리 숫자) 바로 앞이 수량(정수)"인 첫 위치를 데이터 행의 HTS로 본다.
    private int findHtsIndex(String[] tokens) {
        for (int t = tokens.length - 1; t >= PREFIX_TOKEN_COUNT + 2; t--) {
            if (HTS_PATTERN.matcher(tokens[t]).matches() && DIGITS_PATTERN.matcher(tokens[t - 1]).matches()) {
                return t;
            }
        }
        return -1;
    }

    // 사이즈 코드는 하이픈과 숫자가 둘 다 들어간 토큰("S-8", "M-10/12")으로 우선 찾고, 없으면
    // prefix가 6토큰(스타일+팀2+고객1+컬러2)이라는 기존 가정대로 그다음 토큰을 사이즈로 본다.
    private int findSizeIndex(String[] tokens, int htsIdx) {
        for (int t = 1; t < htsIdx - 1; t++) {
            if (tokens[t].contains("-") && ANY_DIGIT.matcher(tokens[t]).matches()) {
                return t;
            }
        }
        return htsIdx - 1 > PREFIX_TOKEN_COUNT ? PREFIX_TOKEN_COUNT : -1;
    }
}
