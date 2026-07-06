package com.hanlim.wms.domain.po;

import com.hanlim.wms.domain.customer.Customer;
import com.hanlim.wms.domain.program.Program;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PURCHASE_ORDERS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PO_ID")
    private Long id;

    @Column(name = "PO_NUMBER", nullable = false, unique = true, length = 30)
    private String poNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROGRAM_ID", nullable = false)
    private Program program;

    // PO상 CUSTOMER 칸이 공란이면 서비스 레이어에서 HOUSE customer로 매핑해서 저장
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CUSTOMER_ID", nullable = false)
    private Customer customer;

    @Column(name = "DLVY_DATE")
    private LocalDate dlvyDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "TRANSPORT_METHOD", nullable = false, length = 20)
    @Builder.Default
    private TransportMethod transportMethod = TransportMethod.UNASSIGNED;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.RECEIVED;

    @Column(name = "ORIGINAL_PDF_URL", length = 500)
    private String originalPdfUrl;

    // PoLine 합계 캐시 - 대사 화면/대시보드 조회 성능용, PoLine 변경 시 서비스 레이어에서 갱신
    @Column(name = "TOTAL_QTY", nullable = false)
    @Builder.Default
    private Integer totalQty = 0;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PoLine> poLines = new ArrayList<>();

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void addPoLine(PoLine poLine) {
        poLines.add(poLine);
        poLine.assignPurchaseOrder(this);
    }

    public enum TransportMethod {
        AIR, BOAT, SPLIT, UNASSIGNED
    }

    public enum Status {
        RECEIVED, IN_REVIEW, RECONCILED, MISMATCH, SHIPPED, CLOSED
    }
}
