package com.einblick.backend.domain.po;

import java.util.List;

public record PoBulkDeleteResponse(int deleted, int failed, List<String> failureMessages) {}
