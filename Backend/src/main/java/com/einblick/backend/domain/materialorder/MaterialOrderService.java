package com.einblick.backend.domain.materialorder;

import com.einblick.backend.domain.program.Program;
import com.einblick.backend.domain.program.ProgramRepository;
import com.einblick.backend.domain.vendor.Vendor;
import com.einblick.backend.domain.vendor.VendorRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MaterialOrderService {

    private final MaterialOrderRepository materialOrderRepository;
    private final ProgramRepository programRepository;
    private final VendorRepository vendorRepository;

    public MaterialOrderService(
        MaterialOrderRepository materialOrderRepository,
        ProgramRepository programRepository,
        VendorRepository vendorRepository
    ) {
        this.materialOrderRepository = materialOrderRepository;
        this.programRepository = programRepository;
        this.vendorRepository = vendorRepository;
    }

    public List<MaterialOrderResponse> list() {
        return materialOrderRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(MaterialOrderResponse::from)
            .toList();
    }

    @Transactional
    public MaterialOrderResponse create(MaterialOrderCreateRequest request) {
        Program program = programRepository.findById(request.programId())
            .orElseThrow(() -> new EntityNotFoundException("PROGRAM을 찾을 수 없습니다: " + request.programId()));
        Vendor vendor = vendorRepository.findById(request.vendorId())
            .orElseThrow(() -> new EntityNotFoundException("VENDOR를 찾을 수 없습니다: " + request.vendorId()));

        MaterialOrder order = MaterialOrder.builder()
            .program(program)
            .vendor(vendor)
            .item(request.item())
            .qty(request.qty())
            .amount(request.amount())
            .transportMethod(request.transportMethod())
            .build();

        return MaterialOrderResponse.from(materialOrderRepository.save(order));
    }

    @Transactional
    public MaterialOrderResponse advanceApproval(Long id) {
        MaterialOrder order = getOrThrow(id);
        order.advanceApproval();
        return MaterialOrderResponse.from(order);
    }

    @Transactional
    public MaterialOrderResponse reject(Long id) {
        MaterialOrder order = getOrThrow(id);
        order.reject();
        return MaterialOrderResponse.from(order);
    }

    @Transactional
    public MaterialOrderResponse advanceWire(Long id) {
        MaterialOrder order = getOrThrow(id);
        order.advanceWire();
        return MaterialOrderResponse.from(order);
    }

    private MaterialOrder getOrThrow(Long id) {
        return materialOrderRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("자재발주를 찾을 수 없습니다: " + id));
    }
}
