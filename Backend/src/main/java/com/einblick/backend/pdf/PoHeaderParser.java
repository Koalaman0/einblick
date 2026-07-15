package com.einblick.backend.pdf;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * PO PDF 1페이지 헤더 정보 파서.
 *
 * 벤더 주소 블록이 텍스트 사이사이에 섞여 나오기 때문에, 전체를 순서대로 파싱하지 않고
 * 레이블(문자열)을 앵커로 삼아 "그 레이블 근처에서 원하는 패턴(날짜/코드 등)을 찾는" 방식으로 설계함.
 * STYLE 라인은 레이블:값 형태가 안 깨지고 한 줄에 나오므로 정규식으로 바로 추출 가능.
 */
public class PoHeaderParser {

    private static final DateTimeFormatter FMT_SLASH_YY = DateTimeFormatter.ofPattern("MM/dd/yy");
    private static final DateTimeFormatter FMT_SLASH_YYYY = DateTimeFormatter.ofPattern("MM/dd/yyyy");

    public record PoHeader(
        String season,
        String caNumber,
        String poNumber,
        String styleCode,
        String styleName,
        String brand,
        String league,
        String sizeRange,
        LocalDate xfactoryDate,
        LocalDate issueDate,
        LocalDate revDate,
        Integer revision,
        String transportMethod,   // AIR / BOAT / SPLIT
        LocalDate earliestShipDate,
        LocalDate cnxlDate
    ) {}

    public PoHeader parse(String text) {
        String season = extractSeason(text);

        // "RN#: CA#   53223 123456" -> CA# 다음 첫 숫자가 CA#, 그 다음 숫자가 P/O NUMBER
        // (P/O NUMBER 박스가 원본 레이아웃상 우측 상단 별도 표라 텍스트 추출 시 CA# 뒤로 밀려서 나옴)
        String caNumber = null, poNumber = null;
        Matcher caPoM = Pattern.compile("CA#\\s*(?<ca>\\d+)\\s+(?<po>\\d+)").matcher(text);
        if (caPoM.find()) {
            caNumber = caPoM.group("ca");
            poNumber = caPoM.group("po");
        }

        // STYLE: HZ3BGER00 ALT.2 GAME JERSEY -BLANK BRAND: CA - Nike LEAGUE: MLB SIZE RANGE: Boys 4-7 XFACTORY DATE: 04/15/2026
        Pattern stylePattern = Pattern.compile(
            "STYLE:\\s*(?<style>\\S+)\\s+(?<desc>.+?)\\s+BRAND:\\s*(?<brand>.+?)\\s+LEAGUE:\\s*(?<league>\\S+)\\s+SIZE RANGE:\\s*(?<size>.+?)\\s+XFACTORY DATE:\\s*(?<xf>\\d{2}/\\d{2}/\\d{4})"
        );
        Matcher m = stylePattern.matcher(text);
        String styleCode = null, styleName = null, brand = null, league = null, sizeRange = null;
        LocalDate xfactoryDate = null;
        if (m.find()) {
            styleCode = m.group("style");
            styleName = m.group("desc").trim();
            brand = m.group("brand").trim();
            league = m.group("league").trim();
            sizeRange = m.group("size").trim();
            xfactoryDate = LocalDate.parse(m.group("xf"), FMT_SLASH_YYYY);
        }

        // ISSUE DATE / REV DATE / REVISION: "01/19/26 01/19/26 3" 형태로 연달아 나옴 (yy 2자리)
        LocalDate issueDate = null, revDate = null;
        Integer revision = null;
        Matcher datesM = Pattern.compile(
            "(\\d{2}/\\d{2}/\\d{2})\\s+(\\d{2}/\\d{2}/\\d{2})\\s+(\\d+)"
        ).matcher(text);
        if (datesM.find()) {
            issueDate = LocalDate.parse(datesM.group(1), FMT_SLASH_YY);
            revDate = LocalDate.parse(datesM.group(2), FMT_SLASH_YY);
            revision = Integer.parseInt(datesM.group(3));
        }

        // SHIPVIA: AIR/BOAT/SPLIT 중 하나가 독립된 단어로 등장 - 값 자체가 고정 enum이라 위치 안 따져도 안전
        String transportMethod = null;
        Matcher shipM = Pattern.compile("\\b(AIR|BOAT|SPLIT)\\b").matcher(text);
        if (shipM.find()) {
            transportMethod = shipM.group(1);
        }

        // EARLIEST SHIP DATE 레이블 뒤로 100자 이내에서 첫 날짜(MM/dd/yyyy) 탐색
        LocalDate earliestShipDate = extractDateNear(text, "EARLIEST SHIP DATE", FMT_SLASH_YYYY);
        LocalDate cnxlDate = extractDateNear(text, "CNXL DATE", FMT_SLASH_YYYY);

        return new PoHeader(season, caNumber, poNumber, styleCode, styleName, brand, league, sizeRange,
            xfactoryDate, issueDate, revDate, revision, transportMethod, earliestShipDate, cnxlDate);
    }

    private String extractSeason(String text) {
        Matcher m = Pattern.compile("Page\\s+\\d+\\s+Of\\s+\\d+\\s+(.+)").matcher(text);
        return m.find() ? m.group(1).trim() : null;
    }

    private LocalDate extractDateNear(String text, String label, DateTimeFormatter fmt) {
        int idx = text.indexOf(label);
        if (idx < 0) return null;
        String window = text.substring(idx, Math.min(text.length(), idx + 150));
        Matcher m = Pattern.compile("\\d{2}/\\d{2}/\\d{4}").matcher(window);
        return m.find() ? LocalDate.parse(m.group(), fmt) : null;
    }
}
