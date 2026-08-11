package com.einblick.backend.domain.program;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/programs")
public class ProgramController {

    private final ProgramRepository programRepository;

    public ProgramController(ProgramRepository programRepository) {
        this.programRepository = programRepository;
    }

    @GetMapping
    public List<ProgramSummaryResponse> list() {
        return programRepository.findAll().stream().map(ProgramSummaryResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<ProgramSummaryResponse> create(@Valid @RequestBody ProgramCreateRequest request) {
        if (programRepository.findByStyleCodeAndSeason(request.styleCode(), request.season()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 같은 스타일 코드 + 시즌 조합이 존재합니다.");
        }
        Program program = Program.builder()
            .brand(request.brand())
            .league(request.league())
            .styleCode(request.styleCode())
            .styleName(request.styleName())
            .season(request.season())
            .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(ProgramSummaryResponse.from(programRepository.save(program)));
    }
}
