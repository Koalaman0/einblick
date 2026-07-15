package com.einblick.backend.pdf;

/**
 * PO PDF 파싱/저장 과정에서 발생하는 예외.
 * 컨트롤러에서 잡아서 400 응답 + 사용자에게 보여줄 메시지로 변환함.
 */
public class PoPdfParseException extends RuntimeException {
    public PoPdfParseException(String message) {
        super(message);
    }

    public PoPdfParseException(String message, Throwable cause) {
        super(message, cause);
    }
}
