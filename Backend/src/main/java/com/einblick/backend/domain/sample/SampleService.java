package com.einblick.backend.domain.sample;

import com.einblick.backend.domain.program.Program;
import com.einblick.backend.domain.program.ProgramRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SampleService {

    private final SampleRepository sampleRepository;
    private final ProgramRepository programRepository;

    public SampleService(SampleRepository sampleRepository, ProgramRepository programRepository) {
        this.sampleRepository = sampleRepository;
        this.programRepository = programRepository;
    }

    public List<SampleResponse> list() {
        return sampleRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(SampleResponse::from)
            .toList();
    }

    @Transactional
    public SampleResponse create(SampleCreateRequest request) {
        Program program = programRepository.findById(request.programId())
            .orElseThrow(() -> new EntityNotFoundException("PROGRAM을 찾을 수 없습니다: " + request.programId()));

        Sample sample = Sample.builder()
            .program(program)
            .type(request.type())
            .dueDate(request.dueDate())
            .commentSource(request.commentSource())
            .build();

        return SampleResponse.from(sampleRepository.save(sample));
    }

    @Transactional
    public SampleResponse updateType(Long id, SampleTypeUpdateRequest request) {
        Sample sample = getOrThrow(id);
        sample.updateType(request.type());
        return SampleResponse.from(sample);
    }

    @Transactional
    public SampleResponse updateStatus(Long id, SampleStatusUpdateRequest request) {
        Sample sample = getOrThrow(id);
        sample.updateStatus(request.status());
        return SampleResponse.from(sample);
    }

    private Sample getOrThrow(Long id) {
        return sampleRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("샘플을 찾을 수 없습니다: " + id));
    }
}
