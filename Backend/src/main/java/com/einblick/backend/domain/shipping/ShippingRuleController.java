package com.einblick.backend.domain.shipping;

import com.einblick.backend.domain.program.Program;
import com.einblick.backend.domain.program.ProgramRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipping-rules")
public class ShippingRuleController {

    private final ShippingRuleRepository shippingRuleRepository;
    private final ProgramRepository programRepository;

    public ShippingRuleController(ShippingRuleRepository shippingRuleRepository, ProgramRepository programRepository) {
        this.shippingRuleRepository = shippingRuleRepository;
        this.programRepository = programRepository;
    }

    @GetMapping
    public List<ShippingRuleResponse> list() {
        return shippingRuleRepository.findAll().stream().map(ShippingRuleResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<ShippingRuleResponse> create(@Valid @RequestBody ShippingRuleCreateRequest request) {
        Program program = programRepository.findById(request.programId())
            .orElseThrow(() -> new EntityNotFoundException("PROGRAM을 찾을 수 없습니다: " + request.programId()));

        ShippingRule rule = ShippingRule.builder()
            .program(program)
            .season(request.season())
            .poRangeFrom(request.poRangeFrom())
            .poRangeTo(request.poRangeTo())
            .transportMethod(request.transportMethod())
            .exFactoryDate(request.exFactoryDate())
            .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(ShippingRuleResponse.from(shippingRuleRepository.save(rule)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!shippingRuleRepository.existsById(id)) {
            throw new EntityNotFoundException("배송 규칙을 찾을 수 없습니다: " + id);
        }
        shippingRuleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(e.getMessage()));
    }

    public record ErrorResponse(String message) {}
}
