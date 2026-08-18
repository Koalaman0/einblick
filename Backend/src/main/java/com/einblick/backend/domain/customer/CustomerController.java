package com.einblick.backend.domain.customer;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public List<CustomerResponse> list() {
        return customerRepository.findAll().stream().map(CustomerResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CustomerCreateRequest request) {
        if (customerRepository.findByCode(request.code()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 거래처 코드입니다.");
        }
        Customer customer = Customer.builder()
            .code(request.code())
            .name(request.name())
            .houseAlias(request.houseAlias() != null ? request.houseAlias() : false)
            .build();
        customer.updatePackingStandard(
            request.packingMethod(), request.format(), request.assortSolid(),
            request.stdRatio(), request.stdPolybag(), request.stdCarton(), request.stdHanger()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(CustomerResponse.from(customerRepository.save(customer)));
    }
}
