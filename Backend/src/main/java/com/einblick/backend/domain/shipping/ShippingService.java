package com.einblick.backend.domain.shipping;

import com.einblick.backend.domain.po.PurchaseOrder;
import com.einblick.backend.domain.po.PurchaseOrderRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ShippingService {

    private static final Pattern TRAILING_DIGITS = Pattern.compile("(\\d+)$");

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ShippingRuleRepository shippingRuleRepository;

    public ShippingService(PurchaseOrderRepository purchaseOrderRepository, ShippingRuleRepository shippingRuleRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.shippingRuleRepository = shippingRuleRepository;
    }

    public List<ShippingResponse> list() {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(po -> ShippingResponse.from(po, violatesRule(po)))
            .toList();
    }

    @Transactional
    public ShippingResponse register(Long poId, ShippingRegisterRequest request) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
            .orElseThrow(() -> new EntityNotFoundException("PO를 찾을 수 없습니다: " + poId));
        po.registerShipment(request.dlvyDate(), request.transportMethod());
        return ShippingResponse.from(po, violatesRule(po));
    }

    // PO가 속한 프로그램의 SHIPPING_RULES 중, PO번호 끝자리 숫자가 po_range_from~to 범위에 들거나
    // 범위가 비어있고 시즌이 일치하는 규칙을 찾아 지정된 운송수단과 실제 운송수단을 비교한다.
    // 규칙이 없거나 아직 운송수단이 미지정(UNASSIGNED)이면 위반으로 보지 않는다.
    private boolean violatesRule(PurchaseOrder po) {
        if (po.getTransportMethod() == PurchaseOrder.TransportMethod.UNASSIGNED) {
            return false;
        }
        List<ShippingRule> rules = shippingRuleRepository.findByProgram(po.getProgram());
        Integer poSeq = extractTrailingNumber(po.getPoNumber());

        for (ShippingRule rule : rules) {
            if (matchesRange(rule, poSeq) || matchesSeason(rule, po)) {
                return !allows(rule.getTransportMethod(), po.getTransportMethod());
            }
        }
        return false;
    }

    private boolean matchesRange(ShippingRule rule, Integer poSeq) {
        if (poSeq == null || rule.getPoRangeFrom() == null || rule.getPoRangeTo() == null) {
            return false;
        }
        Integer from = extractTrailingNumber(rule.getPoRangeFrom());
        Integer to = extractTrailingNumber(rule.getPoRangeTo());
        return from != null && to != null && poSeq >= from && poSeq <= to;
    }

    private boolean matchesSeason(ShippingRule rule, PurchaseOrder po) {
        return rule.getPoRangeFrom() == null && rule.getPoRangeTo() == null
            && rule.getSeason() != null
            && rule.getSeason().equals(po.getProgram().getSeason());
    }

    private boolean allows(ShippingRule.RequiredTransportMethod required, PurchaseOrder.TransportMethod actual) {
        return switch (required) {
            case AIR_ONLY -> actual == PurchaseOrder.TransportMethod.AIR;
            case BOAT_ONLY -> actual == PurchaseOrder.TransportMethod.BOAT;
            case SPLIT -> actual == PurchaseOrder.TransportMethod.SPLIT;
        };
    }

    private Integer extractTrailingNumber(String value) {
        if (value == null) return null;
        Matcher matcher = TRAILING_DIGITS.matcher(value);
        return matcher.find() ? Integer.valueOf(matcher.group(1)) : null;
    }
}
