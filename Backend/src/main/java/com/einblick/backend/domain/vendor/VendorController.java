package com.einblick.backend.domain.vendor;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
public class VendorController {

    private final VendorRepository vendorRepository;

    public VendorController(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    @GetMapping
    public List<VendorResponse> list() {
        return vendorRepository.findAll().stream().map(VendorResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<VendorResponse> create(@Valid @RequestBody VendorRequest request) {
        Vendor vendor = Vendor.builder()
            .name(request.name())
            .overseas(request.overseas() != null ? request.overseas() : false)
            .contactName(request.contactName())
            .contactInfo(request.contactInfo())
            .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(VendorResponse.from(vendorRepository.save(vendor)));
    }
}
