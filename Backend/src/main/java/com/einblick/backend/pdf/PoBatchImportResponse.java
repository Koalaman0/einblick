package com.einblick.backend.pdf;

import java.util.List;

/**
 * PDF 한 장에 PO가 여러 개 묶여 있을 수 있어서, 업로드 결과를 항상 배치 단위로 내려준다.
 * PO가 하나뿐인 파일도 detected=1, succeeded=1인 배치 응답으로 취급한다.
 */
public record PoBatchImportResponse(
    int detected,
    int succeeded,
    int failed,
    List<PoImportResponse> created,
    List<String> failureMessages
) {}
