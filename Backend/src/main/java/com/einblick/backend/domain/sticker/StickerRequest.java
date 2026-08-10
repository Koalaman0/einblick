package com.einblick.backend.domain.sticker;

import com.einblick.backend.domain.po.PurchaseOrder;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "STICKER_REQUESTS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class StickerRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "STICKER_REQUEST_ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PO_ID", nullable = false)
    private PurchaseOrder purchaseOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "STICKER_TYPE", nullable = false, length = 10)
    private Type stickerType;

    @Column(name = "QTY")
    private Integer qty;

    @Column(name = "LOSS_RATE", precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal lossRate = new BigDecimal("1.00");

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.REQUESTED;

    public void updateStatus(Status status) {
        this.status = status;
    }

    public enum Type { UPC, PRN, LPN }

    public enum Status { REQUESTED, SENT_TO_FACTORY, CONFIRMED }
}
