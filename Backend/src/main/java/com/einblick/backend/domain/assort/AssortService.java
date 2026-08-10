package com.einblick.backend.domain.assort;

import com.einblick.backend.domain.program.Program;
import com.einblick.backend.domain.program.ProgramRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssortService {

    private final AssortRepository assortRepository;
    private final ProgramRepository programRepository;

    public AssortService(AssortRepository assortRepository, ProgramRepository programRepository) {
        this.assortRepository = assortRepository;
        this.programRepository = programRepository;
    }

    @Transactional
    public Assort create(AssortCreateRequest request) {
        Program program = programRepository.findById(request.programId())
            .orElseThrow(() -> new EntityNotFoundException("PROGRAM을 찾을 수 없습니다: " + request.programId()));

        int totalQty = request.sizes().stream().mapToInt(AssortCreateRequest.SizeItem::qty).sum();

        Assort assort = Assort.builder()
            .program(program)
            .team(request.team())
            .player(request.player())
            .customerLabel(request.customerLabel() == null ? "" : request.customerLabel())
            .sourceFile(request.sourceFile())
            .totalQty(totalQty)
            .build();

        for (AssortCreateRequest.SizeItem item : request.sizes()) {
            assort.addSize(AssortSize.builder()
                .sizeCode(item.sizeCode())
                .qty(item.qty())
                .build());
        }

        return assortRepository.save(assort);
    }
}
