package com.einblick.backend.domain.reconciliation;

/**
 * STY# 코드 해독. 구조: [가변 길이 접두] + [제품군 1자] + [버전코드 2자] + [세그먼트 1자] + [리비전 2자리]
 * (예: "9Z3B7HHMP00" -> 접두 9Z3B7, 제품군 H, 버전코드 HM, 세그먼트 P, 리비전 00)
 * 뒤에서부터 고정폭 11자리로 파싱한다 - 접두 길이가 템플릿마다 다를 수 있어서다.
 * 실제 운영 STY 코드로 아직 검증되지 않았으니, 이 로직을 근거로 한 검증 결과는 참고용으로 다루고
 * 오탐(false positive)이 보이면 바로 알려줘야 한다.
 */
public final class StyleCodeDecoder {

    private StyleCodeDecoder() {}

    public record Decoded(char productFamily, String versionCode, char segment, String revision) {
        // PLAYER 필드가 비어있으면(세그먼트 B) 기대되는 segment, 아니면 P/S
        public boolean expectsBlankPlayer() {
            return segment == 'B';
        }
    }

    public static Decoded decode(String styleCode) {
        if (styleCode == null || styleCode.length() < 11) {
            return null;
        }
        String core = styleCode.substring(styleCode.length() - 11);
        char productFamily = core.charAt(5);
        String versionCode = core.substring(6, 8);
        char segment = core.charAt(8);
        String revision = core.substring(9, 11);
        return new Decoded(productFamily, versionCode, segment, revision);
    }
}
