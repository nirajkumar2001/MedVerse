package com.tcs.medverse.controller;

import com.tcs.medverse.dto.request.*;
import com.tcs.medverse.dto.response.*;
import com.tcs.medverse.exception.BadRequestException;
import com.tcs.medverse.exception.NotFoundException;
import com.tcs.medverse.service.LearnerBookmarkService;
import com.tcs.medverse.service.LearnerCaseService;
import com.tcs.medverse.service.LearnerFeedService;
import com.tcs.medverse.service.LearnerProfileService;
import com.tcs.medverse.util.ResponseHandler;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Tag(name = "Learner APIs", description = "Learner module endpoints")
@RestController
@RequestMapping("/api/v1/learner")
@RequiredArgsConstructor
public class LearnerController {

    private final LearnerProfileService learnerProfileService;
    private final LearnerCaseService learnerCaseService;
    private final LearnerFeedService learnerFeedService;
    private final LearnerBookmarkService learnerBookmarkService;

    // ==================== MODULE 2: PROFILE ====================

    @GetMapping("/profile")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        String authRefId = (String) authentication.getPrincipal();
        LearnerProfileResponse profile = learnerProfileService.getMyProfile(authRefId);
        return ResponseHandler.success(profile, "Profile retrieved successfully");
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateMyProfile(Authentication authentication,
                                             @Valid @RequestBody LearnerProfileUpdateRequest request) {
        String authRefId = (String) authentication.getPrincipal();
        LearnerProfileResponse profile = learnerProfileService.updateMyProfile(authRefId, request);
        return ResponseHandler.success(profile, "Profile updated successfully");
    }

    @GetMapping("/profile/stats")
    public ResponseEntity<?> getMyStats(Authentication authentication) {
        String authRefId = (String) authentication.getPrincipal();
        LearnerProfileStatsResponse stats = learnerProfileService.getMyStats(authRefId);
        return ResponseHandler.success(stats, "Profile stats retrieved");
    }

    @RequestMapping(value = "/profile/image", method = {RequestMethod.POST, RequestMethod.PUT}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadProfileImage(Authentication authentication,
                                                @RequestPart(value = "file", required = false) MultipartFile file,
                                                @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {
        MultipartFile upload = file != null ? file : profileImage;
        if (upload == null || upload.isEmpty()) {
            throw new BadRequestException("File is required");
        }

        String contentType = upload.getContentType() != null ? upload.getContentType() : "application/octet-stream";
        String base64;
        try {
            base64 = Base64.getEncoder().encodeToString(upload.getBytes());
        } catch (IOException e) {
            throw new BadRequestException("Failed to read uploaded file");
        }
        String dataUrl = "data:" + contentType + ";base64," + base64;

        String authRefId = (String) authentication.getPrincipal();
        LearnerProfileResponse profile = learnerProfileService.updateMyProfileImage(authRefId, dataUrl);
        return ResponseHandler.success(profile, "Profile image saved");
    }

    // ==================== MODULE 3: CASES (SEARCH & VIEW) ====================

    @GetMapping("/cases")
    public ResponseEntity<?> getAllApprovedCases(Authentication authentication,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size) {
        String authRefId = (String) authentication.getPrincipal();
        PageResponse<LearnerFeedItemResponse> result = learnerFeedService.getFeed(authRefId, null, null, null, page, size);
        return ResponseHandler.success(result, "Approved cases retrieved");
    }

    @GetMapping("/cases/search")
    public ResponseEntity<?> searchCases(Authentication authentication,
                                         @RequestParam String keyword,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "10") int size) {
        String authRefId = (String) authentication.getPrincipal();
        PageResponse<LearnerFeedItemResponse> result = learnerFeedService.getFeed(authRefId, keyword, null, null, page, size);
        return ResponseHandler.success(result, "Search results retrieved");
    }

    @GetMapping("/cases/{caseId}")
    public ResponseEntity<?> getCaseById(Authentication authentication, @PathVariable String caseId) {
        String authRefId = (String) authentication.getPrincipal();
        LearnerFeedItemResponse item = learnerFeedService.getCaseById(authRefId, caseId);
        return ResponseHandler.success(item, "Case retrieved successfully");
    }

    @GetMapping("/cases/disease/{diseaseName}")
    public ResponseEntity<?> getCasesByDisease(Authentication authentication,
                                               @PathVariable String diseaseName,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size) {
        String authRefId = (String) authentication.getPrincipal();
        PageResponse<LearnerFeedItemResponse> result = learnerFeedService.getFeed(authRefId, null, diseaseName, null, page, size);
        return ResponseHandler.success(result, "Cases by disease retrieved");
    }

    @GetMapping("/cases/department/{department}")
    public ResponseEntity<?> getCasesByDepartment(Authentication authentication,
                                                  @PathVariable String department,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        String authRefId = (String) authentication.getPrincipal();
        PageResponse<LearnerFeedItemResponse> result = learnerFeedService.getFeed(authRefId, null, null, department, page, size);
        return ResponseHandler.success(result, "Cases by department retrieved");
    }

    @GetMapping("/cases/recommended")
    public ResponseEntity<?> getRecommendedCases(Authentication authentication) {
        String authRefId = (String) authentication.getPrincipal();
        PageResponse<LearnerFeedItemResponse> result = learnerFeedService.getFeed(authRefId, null, null, null, 0, 5);
        return ResponseHandler.success(result.content(), "Recommended cases retrieved");
    }

    @PostMapping("/cases/{caseId}/view")
    public ResponseEntity<?> trackCaseViewed(@PathVariable String caseId) {
        // No-op for now as per your original code
        return ResponseHandler.success(Map.of("caseId", caseId, "status", "viewed"), "Case view recorded");
    }

    // ==================== MODULE 4: SUBMISSIONS ====================

    @PostMapping(value = "/submissions", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> submitCase(@Valid @RequestBody LearnerSubmitCaseRequest request,
                                        Authentication authentication) {
        String authRefId = (String) authentication.getPrincipal();
        LearnerSubmissionDetailResponse submitted = learnerCaseService.submitCase(authRefId, request);
        return ResponseHandler.created(submitted, "Case submitted successfully");
    }

    @PostMapping(value = "/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitCaseMultipart(Authentication authentication,
                                                 @RequestPart("title") String title,
                                                 @RequestPart("disease") String disease,
                                                 @RequestPart("department") String department,
                                                 @RequestPart("description") String description,
                                                 @RequestPart(value = "pdfFile", required = false) MultipartFile pdfFile) throws Exception {

        String authRefId = (String) authentication.getPrincipal();
        byte[] caseDoc = (pdfFile != null && !pdfFile.isEmpty()) ? pdfFile.getBytes() : null;

        LearnerSubmitCaseRequest request = new LearnerSubmitCaseRequest(
                title,
                description,
                department,
                disease,
                caseDoc,
                pdfFile != null && !pdfFile.isEmpty() ? pdfFile.getOriginalFilename() : null,
                pdfFile != null && !pdfFile.isEmpty() ? pdfFile.getContentType() : null
        );
        LearnerSubmissionDetailResponse submitted = learnerCaseService.submitCase(authRefId, request);

        return ResponseHandler.created(submitted, "Case submitted successfully");
    }

    @GetMapping("/submissions")
    public ResponseEntity<?> getMySubmissions(Authentication authentication,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size) {
        String authRefId = (String) authentication.getPrincipal();
        PageResponse<LearnerSubmissionResponse> result = learnerCaseService.listMySubmissions(authRefId, page, size);
        return ResponseHandler.success(result, "Submissions retrieved");
    }

    @GetMapping("/submissions/{submissionId}")
    public ResponseEntity<?> getSubmissionById(Authentication authentication, @PathVariable String submissionId) {
        String authRefId = (String) authentication.getPrincipal();
        String caseId = parseSubmissionId(submissionId);
        LearnerSubmissionDetailResponse detail = learnerCaseService.getMySubmission(authRefId, caseId);
        return ResponseHandler.success(detail, "Submission retrieved");
    }

    @PutMapping(value = "/submissions/{submissionId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> resubmitCase(Authentication authentication,
                                          @PathVariable String submissionId,
                                          @Valid @RequestBody LearnerSubmitCaseRequest request) {
        String authRefId = (String) authentication.getPrincipal();

        String caseId = parseSubmissionId(submissionId);
        LearnerSubmissionDetailResponse updated = learnerCaseService.resubmitCase(authRefId, caseId, request);
        return ResponseHandler.success(updated, "Case resubmitted successfully");
    }

    @PutMapping(value = "/submissions/{submissionId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> resubmitCaseMultipart(Authentication authentication,
                                                   @PathVariable String submissionId,
                                                   @RequestPart("title") String title,
                                                   @RequestPart("disease") String disease,
                                                   @RequestPart("department") String department,
                                                   @RequestPart("description") String description,
                                                   @RequestPart(value = "pdfFile", required = false) MultipartFile pdfFile) throws Exception {

        String authRefId = (String) authentication.getPrincipal();
        String caseId = parseSubmissionId(submissionId);

        byte[] caseDoc = (pdfFile != null && !pdfFile.isEmpty()) ? pdfFile.getBytes() : null;

        LearnerSubmitCaseRequest request = new LearnerSubmitCaseRequest(
                title,
                description,
                department,
                disease,
                caseDoc,
                pdfFile != null && !pdfFile.isEmpty() ? pdfFile.getOriginalFilename() : null,
                pdfFile != null && !pdfFile.isEmpty() ? pdfFile.getContentType() : null
        );
        LearnerSubmissionDetailResponse updated = learnerCaseService.resubmitCase(authRefId, caseId, request);

        return ResponseHandler.success(updated, "Case resubmitted successfully");
    }

    @DeleteMapping("/submissions/{submissionId}")
    public ResponseEntity<?> deleteSubmission(Authentication authentication, @PathVariable String submissionId) {
        String authRefId = (String) authentication.getPrincipal();
        String caseId = parseSubmissionId(submissionId);
        learnerCaseService.deletePendingSubmission(authRefId, caseId);
        return ResponseHandler.success(Map.of("submissionId", submissionId), "Submission deleted successfully");
    }

    @PostMapping("/submissions/{submissionId}/publish")
    public ResponseEntity<?> publishSubmission(Authentication authentication, @PathVariable String submissionId) {
        String authRefId = (String) authentication.getPrincipal();
        String caseId = parseSubmissionId(submissionId);
        LearnerSubmissionDetailResponse published = learnerCaseService.publishApprovedSubmission(authRefId, caseId);
        return ResponseHandler.success(published, "Case published successfully");
    }

    @GetMapping("/submissions/{submissionId}/status")
    public ResponseEntity<?> getSubmissionStatus(Authentication authentication, @PathVariable String submissionId) {
        String authRefId = (String) authentication.getPrincipal();
        String caseId = parseSubmissionId(submissionId);
        String status = learnerCaseService.getSubmissionStatus(authRefId, caseId);
        return ResponseHandler.success(Map.of("submissionId", submissionId, "status", status), "Status retrieved");
    }

    // ==================== MODULE 5: FEED ====================

    @GetMapping("/feed")
    public ResponseEntity<?> getFeed(Authentication authentication,
                                     @RequestParam(required = false) String q,
                                     @RequestParam(required = false) String disease,
                                     @RequestParam(required = false) String department,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "10") int size) {
        String authRefId = (String) authentication.getPrincipal();
        PageResponse<LearnerFeedItemResponse> feed = learnerFeedService.getFeed(authRefId, q, disease, department, page, size);
        return ResponseHandler.success(feed, "Feed retrieved successfully");
    }

    @GetMapping("/feed/filter")
    public ResponseEntity<?> getFeedFiltered(Authentication authentication,
                                             @RequestParam(required = false) String department,
                                             @RequestParam(required = false) String disease,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "10") int size) {
        String authRefId = (String) authentication.getPrincipal();
        PageResponse<LearnerFeedItemResponse> feed = learnerFeedService.getFeed(authRefId, null, disease, department, page, size);
        return ResponseHandler.success(feed, "Filtered feed retrieved");
    }

    // ==================== MODULE 6: BOOKMARKS ====================

    @GetMapping("/bookmarks")
    public ResponseEntity<?> listMyBookmarks(Authentication authentication,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "10") int size) {
        String authRefId = (String) authentication.getPrincipal();
        PageResponse<LearnerBookmarkResponse> result = learnerBookmarkService.listMyBookmarks(authRefId, page, size);
        return ResponseHandler.success(result, "Bookmarks retrieved");
    }

    @PostMapping("/bookmarks/{caseId}")
    public ResponseEntity<?> addBookmark(Authentication authentication, @PathVariable String caseId) {
        String authRefId = (String) authentication.getPrincipal();
        LearnerBookmarkResponse bookmark = learnerBookmarkService.addBookmark(authRefId, caseId);
        return ResponseHandler.created(bookmark, "Bookmark added successfully");
    }

    @DeleteMapping("/bookmarks/{caseId}")
    public ResponseEntity<?> removeBookmark(Authentication authentication, @PathVariable String caseId) {
        String authRefId = (String) authentication.getPrincipal();
        learnerBookmarkService.removeBookmark(authRefId,caseId);
        return ResponseHandler.success(Map.of("caseId", caseId), "Bookmark removed");
    }

    @GetMapping("/bookmarks/{caseId}/status")
    public ResponseEntity<?> isBookmarked(Authentication authentication, @PathVariable String caseId) {
        String authRefId = (String) authentication.getPrincipal();
        boolean bookmarked = learnerBookmarkService.isBookmarked(authRefId, caseId);
        return ResponseHandler.success(Map.of("caseId", caseId, "isBookmarked", bookmarked), "Bookmark status");
    }

    // ==================== MODULE 7: REPOSITORY ====================

    @GetMapping("/repository/diseases")
    public ResponseEntity<?> listDiseases() {
        return ResponseHandler.success(learnerFeedService.listDiseases(), "Diseases list retrieved");
    }

    @GetMapping("/repository")
    public ResponseEntity<?> listRepository(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size,
                                            @RequestParam(required = false) String filter) {
        List<DiseaseRepositoryItemResponse> items = buildRepositoryItems(learnerFeedService.listDiseases(), null, filter);
        PageResponse<DiseaseRepositoryItemResponse> response = toPage(items, page, size);
        return ResponseHandler.success(response, "Repository retrieved");
    }

    @GetMapping("/repository/search")
    public ResponseEntity<?> searchRepository(@RequestParam String keyword,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size) {
        List<DiseaseRepositoryItemResponse> items = buildRepositoryItems(learnerFeedService.listDiseases(), keyword, null);
        PageResponse<DiseaseRepositoryItemResponse> response = toPage(items, page, size);
        return ResponseHandler.success(response, "Repository search results");
    }

    @GetMapping("/repository/{repoId}")
    public ResponseEntity<?> getRepositoryEntry(@PathVariable long repoId) {
        List<DiseaseRepositoryItemResponse> items = buildRepositoryItems(learnerFeedService.listDiseases(), null, null);
        DiseaseRepositoryItemResponse found = items.stream()
                .filter(i -> i.repoId() == repoId)
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Repository entry not found"));

        return ResponseHandler.success(found, "Repository entry retrieved");
    }

    // ==================== HELPER METHODS ====================

    private static String parseSubmissionId(String submissionId) {
        if (submissionId == null || submissionId.isBlank()) {
            throw new BadRequestException("submissionId is required");
        }
        if (submissionId.startsWith("CASE_")) {
            return submissionId.substring(5);
        }
        return submissionId;
    }

    private static List<DiseaseRepositoryItemResponse> buildRepositoryItems(List<String> diseases,
                                                                            String keyword,
                                                                            String filter) {
        LocalDate today = LocalDate.now();
        return diseases.stream()
                .filter(d -> keyword == null || d.toLowerCase().contains(keyword.toLowerCase()))
                .map(d -> {
                    long id = Math.abs(d.toLowerCase().hashCode());
                    return new DiseaseRepositoryItemResponse(
                            id,
                            d,
                            "Repository content for " + d,
                            (id % 2 == 0),
                            (id % 3 == 0),
                            today.minusDays(id % 30)
                    );
                })
                .filter(item -> {
                    if (filter == null || filter.isBlank()) return true;
                    String f = filter.toLowerCase();
                    return switch (f) {
                        case "recommended" -> item.recommended();
                        case "popular" -> item.popular();
                        case "recent" -> item.createdAt().isAfter(today.minusDays(14));
                        default -> true;
                    };
                })
                .toList();
    }

    private static <T> PageResponse<T> toPage(List<T> content, int page, int size) {
        int from = Math.min(page * size, content.size());
        int to = Math.min(from + size, content.size());
        List<T> subList = content.subList(from, to);
        int totalPages = size <= 0 ? 1 : (int) Math.ceil(content.size() / (double) size);
        return new PageResponse<>(subList, page, size, content.size(), totalPages);
    }
}
