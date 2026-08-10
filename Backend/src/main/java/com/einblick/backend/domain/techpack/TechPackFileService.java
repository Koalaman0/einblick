package com.einblick.backend.domain.techpack;

import com.einblick.backend.domain.program.Program;
import com.einblick.backend.domain.program.ProgramRepository;
import com.einblick.backend.domain.user.User;
import com.einblick.backend.domain.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;

@Service
public class TechPackFileService {

    private final TechPackFileRepository techPackFileRepository;
    private final ProgramRepository programRepository;
    private final UserRepository userRepository;

    public TechPackFileService(TechPackFileRepository techPackFileRepository, ProgramRepository programRepository, UserRepository userRepository) {
        this.techPackFileRepository = techPackFileRepository;
        this.programRepository = programRepository;
        this.userRepository = userRepository;
    }

    public List<TechPackFileResponse> list() {
        return techPackFileRepository.findAllSummaries();
    }

    @Transactional
    public TechPackFileResponse upload(Long programId, TechPackFile.Type fileType, MultipartFile file) {
        Program program = programRepository.findById(programId)
            .orElseThrow(() -> new EntityNotFoundException("PROGRAM을 찾을 수 없습니다: " + programId));
        User uploader = userRepository.findByLoginId(SecurityContextHolder.getContext().getAuthentication().getName())
            .orElse(null);

        try {
            TechPackFile techPackFile = TechPackFile.builder()
                .program(program)
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed")
                .fileType(fileType)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .fileData(file.getBytes())
                .uploadedBy(uploader)
                .build();
            TechPackFile saved = techPackFileRepository.save(techPackFile);
            return new TechPackFileResponse(
                saved.getId(), saved.getFileName(), program.getBrand(), program.getSeason(),
                saved.getFileType().name(), saved.getFileSize(), saved.getStatus().name(),
                saved.getUpdatedAt(), uploader != null ? uploader.getName() : null
            );
        } catch (IOException e) {
            throw new UncheckedIOException("파일을 읽는 중 오류가 발생했습니다.", e);
        }
    }

    @Transactional
    public TechPackFileResponse updateStatus(Long id, TechPackStatusUpdateRequest request) {
        TechPackFile file = getOrThrow(id);
        file.updateStatus(request.status());
        return new TechPackFileResponse(
            file.getId(), file.getFileName(), file.getProgram().getBrand(), file.getProgram().getSeason(),
            file.getFileType().name(), file.getFileSize(), file.getStatus().name(),
            file.getUpdatedAt(), file.getUploadedBy() != null ? file.getUploadedBy().getName() : null
        );
    }

    public TechPackFile getOrThrow(Long id) {
        return techPackFileRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("파일을 찾을 수 없습니다: " + id));
    }
}
