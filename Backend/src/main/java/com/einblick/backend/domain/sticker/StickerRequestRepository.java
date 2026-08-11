package com.einblick.backend.domain.sticker;

import com.einblick.backend.domain.po.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StickerRequestRepository extends JpaRepository<StickerRequest, Long> {
    List<StickerRequest> findAllByOrderByIdDesc();
    void deleteByPurchaseOrder(PurchaseOrder purchaseOrder);
}
