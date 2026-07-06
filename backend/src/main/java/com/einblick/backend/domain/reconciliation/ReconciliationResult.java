package com.hanlim.wms.domain.reconciliation;

import com.hanlim.wms.domain.assort.Assort;
import com.hanlim.wms.domain.po.PoLine;
import com.hanlim.wms.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "RECONCILIATION_RESULTS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ReconciliationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RECONCILIATION_ID")
    private Long id;

    // NULL이면 ASSORT에는 있는데 PO에 없는 케이스(오작성)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PO_LINE_ID")
    private PoLine poLine;

    // NULL이면 PO에는 있는데 ASSORT에 없는 케이스(누락)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ASSORT_ID")
    private Assort assort;

    // PO 수량 - ASSORT 수량
    @Column(name = "DIFF_QTY", nullable = false)
    @Builder.Default
    private Integer diffQty = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 20)
    private Status status;

    // CUSTOMER 공란=HOUSE 자동인식 로직이 적용된 매칭인지 표시
    @Column(name = "IS_HOUSE_MATCHED", nullable = false)
    @Builder.Default
    private Boolean houseMatched = false;

    @Column(name = "NOTE", length = 500)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CHECKED_BY")
    private User checkedBy;

    @Column(name = "CHECKED_AT")
    private LocalDateTime checkedAt;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Status {
        OK, MISSING_IN_ASSORT, MISSING_IN_PO, QTY_MISMATCH, NEEDS_REVIEW
    }
}
