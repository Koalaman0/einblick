package com.hanlim.wms.domain.po;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PO_LINES")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class PoLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PO_LINE_ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PO_ID", nullable = false)
    private PurchaseOrder purchaseOrder;

    @Column(name = "TEAM", length = 100)
    private String team;

    @Column(name = "PLAYER", length = 100)
    private String player;

    // 사이즈별 수량(PoLineSize) 합계 캐시
    @Column(name = "TOTAL_QTY", nullable = false)
    @Builder.Default
    private Integer totalQty = 0;

    @Column(name = "CARTON_QTY")
    private Integer cartonQty;

    @OneToMany(mappedBy = "poLine", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PoLineSize> sizes = new ArrayList<>();

    void assignPurchaseOrder(PurchaseOrder purchaseOrder) {
        this.purchaseOrder = purchaseOrder;
    }

    public void addSize(PoLineSize size) {
        sizes.add(size);
        size.assignPoLine(this);
    }
}
