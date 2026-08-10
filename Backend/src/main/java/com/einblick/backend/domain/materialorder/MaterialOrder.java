package com.einblick.backend.domain.materialorder;

import com.einblick.backend.domain.program.Program;
import com.einblick.backend.domain.vendor.Vendor;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "MATERIAL_ORDERS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class MaterialOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MATERIAL_ORDER_ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROGRAM_ID", nullable = false)
    private Program program;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VENDOR_ID", nullable = false)
    private Vendor vendor;

    @Column(name = "ITEM", length = 200)
    private String item;

    @Column(name = "QTY")
    private Integer qty;

    @Column(name = "AMOUNT", precision = 14, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "APPROVAL_STATUS", nullable = false, length = 20)
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "WIRE_STATUS", nullable = false, length = 20)
    @Builder.Default
    private WireStatus wireStatus = WireStatus.NOT_SENT;

    @Enumerated(EnumType.STRING)
    @Column(name = "TRANSPORT_METHOD", length = 20)
    private TransportMethod transportMethod;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    private static final ApprovalStatus[] APPROVAL_FLOW = {
        ApprovalStatus.DRAFT, ApprovalStatus.MANAGER_REVIEW, ApprovalStatus.DIRECTOR_REVIEW, ApprovalStatus.APPROVED
    };

    public void advanceApproval() {
        int idx = indexOf(APPROVAL_FLOW, approvalStatus);
        if (idx < 0 || idx == APPROVAL_FLOW.length - 1) {
            throw new IllegalStateException("더 이상 진행할 수 없는 결재 상태입니다: " + approvalStatus);
        }
        this.approvalStatus = APPROVAL_FLOW[idx + 1];
    }

    public void reject() {
        if (approvalStatus == ApprovalStatus.APPROVED) {
            throw new IllegalStateException("이미 승인된 발주는 반려할 수 없습니다.");
        }
        this.approvalStatus = ApprovalStatus.REJECTED;
    }

    private static final WireStatus[] WIRE_FLOW = { WireStatus.NOT_SENT, WireStatus.WIRED, WireStatus.CONFIRMED };

    public void advanceWire() {
        if (approvalStatus != ApprovalStatus.APPROVED) {
            throw new IllegalStateException("결재가 승인된 발주만 송금 단계를 진행할 수 있습니다.");
        }
        int idx = indexOf(WIRE_FLOW, wireStatus);
        if (idx < 0 || idx == WIRE_FLOW.length - 1) {
            throw new IllegalStateException("더 이상 진행할 수 없는 송금 상태입니다: " + wireStatus);
        }
        this.wireStatus = WIRE_FLOW[idx + 1];
    }

    private static <T> int indexOf(T[] arr, T value) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == value) return i;
        }
        return -1;
    }

    public enum ApprovalStatus {
        DRAFT, MANAGER_REVIEW, DIRECTOR_REVIEW, APPROVED, REJECTED
    }

    public enum WireStatus {
        NOT_SENT, WIRED, CONFIRMED
    }

    public enum TransportMethod {
        AIR, BOAT, FEDEX
    }
}
