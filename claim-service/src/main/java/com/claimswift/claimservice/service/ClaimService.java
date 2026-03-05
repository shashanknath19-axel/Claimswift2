package com.claimswift.claimservice.service;

import com.claimswift.claimservice.client.AssessmentServiceClient;
import com.claimswift.claimservice.client.AuthServiceClient;
import com.claimswift.claimservice.client.NotificationServiceClient;
import com.claimswift.claimservice.client.ReportingServiceClient;
import com.claimswift.claimservice.dto.ClaimRequest;
import com.claimswift.claimservice.dto.ClaimResponse;
import com.claimswift.claimservice.dto.ClaimStatusUpdateRequest;
import com.claimswift.claimservice.entity.Claim;
import com.claimswift.claimservice.mapper.ClaimMapper;
import com.claimswift.claimservice.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ClaimMapper claimMapper;
    private final AssessmentServiceClient assessmentServiceClient;
    private final AuthServiceClient authServiceClient;
    private final ReportingServiceClient reportingServiceClient;
    private final NotificationServiceClient notificationServiceClient;
    private final Map<Claim.ClaimStatus, Set<Claim.ClaimStatus>> allowedTransitions = buildAllowedTransitions();

    @Transactional
    public ClaimResponse submitClaim(ClaimRequest request, Long claimantId, String username) {
        Claim claim = claimMapper.toEntity(request);
        claim.setClaimNumber(generateClaimNumber());
        claim.setClaimantId(claimantId);
        applyClaimantSnapshot(claim, username);
        claim.setStatus(Claim.ClaimStatus.SUBMITTED);
        claim.setCreatedBy(username);
        claim.setUpdatedBy(username);

        Claim savedClaim = claimRepository.save(claim);
        log.info("Claim submitted: {}", savedClaim.getClaimNumber());

        // Report to Reporting Service
        reportClaimEvent(savedClaim, "CLAIM_SUBMITTED");
        notifyClaimStatus(savedClaim, Claim.ClaimStatus.SUBMITTED.name());

        return claimMapper.toResponse(savedClaim);
    }

    @Transactional(readOnly = true)
    public ClaimResponse getClaimById(Long id) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found with id: " + id));
        return claimMapper.toResponse(claim);
    }

    @Transactional(readOnly = true)
    public ClaimResponse getClaimByNumber(String claimNumber) {
        Claim claim = claimRepository.findByClaimNumber(claimNumber)
                .orElseThrow(() -> new RuntimeException("Claim not found with number: " + claimNumber));
        return claimMapper.toResponse(claim);
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaimsByClaimant(Long claimantId) {
        List<Claim> claims = claimRepository.findByClaimantId(claimantId);
        return claimMapper.toResponseList(claims);
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaimHistory(Long claimantId) {
        List<Claim> claims = claimRepository.findByClaimantId(claimantId);
        return claimMapper.toResponseList(claims);
    }

    @Transactional
    public ClaimResponse updateClaimStatus(Long claimId, ClaimStatusUpdateRequest request, String username) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found with id: " + claimId));

        Claim.ClaimStatus newStatus = request.getStatus();
        Claim.ClaimStatus oldStatus = claim.getStatus();
        validateStatusTransition(oldStatus, newStatus);

        claim.updateStatus(newStatus, username);

        if (request.getAssignedAdjusterId() != null) {
            claim.setAdjusterId(request.getAssignedAdjusterId());
        }

        applyApprovedAmount(claim, newStatus, request.getApprovedAmount());

        Claim updatedClaim = claimRepository.save(claim);
        log.info("Claim {} status updated from {} to {}", claim.getClaimNumber(), oldStatus, newStatus);

        // Report status change to Reporting Service
        reportStatusChange(updatedClaim, oldStatus.name(), newStatus.name());
        notifyClaimStatus(updatedClaim, newStatus.name());

        // Notify Assessment Service if approved
        if (newStatus == Claim.ClaimStatus.APPROVED) {
            notifyAssessmentComplete(updatedClaim);
        }

        return claimMapper.toResponse(updatedClaim);
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaimsByStatus(String status) {
        Claim.ClaimStatus claimStatus = Claim.ClaimStatus.valueOf(status);
        List<Claim> claims = claimRepository.findByStatus(claimStatus);
        return claimMapper.toResponseList(claims);
    }

    @Transactional(readOnly = true)
    public Page<ClaimResponse> getClaimsPage(int page, int size, String status, String sortBy, String sortDir) {
        Sort sort = Sort.by("desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Claim> claimsPage;
        if (status != null && !status.isBlank()) {
            Claim.ClaimStatus claimStatus = Claim.ClaimStatus.valueOf(status.toUpperCase());
            claimsPage = claimRepository.findByStatus(claimStatus, pageable);
        } else {
            claimsPage = claimRepository.findAll(pageable);
        }

        return claimsPage.map(claimMapper::toResponse);
    }

    @Transactional
    public ClaimResponse updateClaim(Long id, ClaimRequest request, String username) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found with id: " + id));
        claimMapper.updateEntityFromRequest(request, claim);
        claim.setUpdatedBy(username);
        return claimMapper.toResponse(claimRepository.save(claim));
    }

    @Transactional
    public void deleteClaim(Long id) {
        if (!claimRepository.existsById(id)) {
            throw new RuntimeException("Claim not found with id: " + id);
        }
        claimRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getAssignedClaims(Long adjusterId) {
        return claimMapper.toResponseList(claimRepository.findByStatusAndAdjusterId(Claim.ClaimStatus.UNDER_REVIEW, adjusterId));
    }

    @Transactional
    public ClaimResponse assignClaim(Long claimId, Long adjusterId, String username) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found with id: " + claimId));

        validateStatusTransition(claim.getStatus(), Claim.ClaimStatus.UNDER_REVIEW);
        claim.setAdjusterId(adjusterId);
        claim.updateStatus(Claim.ClaimStatus.UNDER_REVIEW, username);
        return claimMapper.toResponse(claimRepository.save(claim));
    }

    @Transactional
    public ClaimResponse unassignClaim(Long claimId, String username) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found with id: " + claimId));

        Claim.ClaimStatus oldStatus = claim.getStatus();
        claim.setAdjusterId(null);

        if (oldStatus == Claim.ClaimStatus.UNDER_REVIEW) {
            claim.updateStatus(Claim.ClaimStatus.SUBMITTED, username);
        } else {
            claim.setUpdatedBy(username);
        }

        Claim updatedClaim = claimRepository.save(claim);
        if (oldStatus != updatedClaim.getStatus()) {
            reportStatusChange(updatedClaim, oldStatus.name(), updatedClaim.getStatus().name());
            notifyClaimStatus(updatedClaim, updatedClaim.getStatus().name());
        }

        return claimMapper.toResponse(updatedClaim);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getClaimStatistics() {
        long total = claimRepository.count();
        long submitted = claimRepository.countByStatus(Claim.ClaimStatus.SUBMITTED);
        long underReview = claimRepository.countByStatus(Claim.ClaimStatus.UNDER_REVIEW);
        long approved = claimRepository.countByStatus(Claim.ClaimStatus.APPROVED);
        long rejected = claimRepository.countByStatus(Claim.ClaimStatus.REJECTED);
        long adjusted = claimRepository.countByStatus(Claim.ClaimStatus.ADJUSTED);
        long paid = claimRepository.countByStatus(Claim.ClaimStatus.PAID);
        long paymentFailed = claimRepository.countByStatus(Claim.ClaimStatus.PAYMENT_FAILED);
        long cancelled = claimRepository.countByStatus(Claim.ClaimStatus.CANCELLED);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalClaims", total);
        stats.put("submittedClaims", submitted);
        stats.put("underReviewClaims", underReview);
        stats.put("approvedClaims", approved);
        stats.put("rejectedClaims", rejected);
        stats.put("adjustedClaims", adjusted);
        stats.put("paidClaims", paid);
        stats.put("paymentFailedClaims", paymentFailed);
        stats.put("cancelledClaims", cancelled);
        stats.put("closedClaims", paid);
        stats.put("approvedAmount", claimRepository.sumApprovedClaims());
        return stats;
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> searchClaims(String query) {
        return claimMapper.toResponseList(claimRepository.searchClaims(query));
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> searchMyClaims(
            Long claimantId,
            String query,
            String status,
            String fromDate,
            String toDate
    ) {
        Claim.ClaimStatus parsedStatus = null;
        if (status != null && !status.isBlank()) {
            parsedStatus = Claim.ClaimStatus.valueOf(status.trim().toUpperCase());
        }

        return claimMapper.toResponseList(claimRepository.searchMyClaims(
                claimantId,
                normalizeQuery(query),
                parsedStatus,
                parseDate(fromDate),
                parseDate(toDate)
        ));
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getAllClaims() {
        return claimMapper.toResponseList(claimRepository.findAll());
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaimsByAdjuster(Long adjusterId) {
        return claimMapper.toResponseList(claimRepository.findByAdjusterId(adjusterId));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getClaimsSummary(String startDate, String endDate) {
        Map<String, Object> summary = new HashMap<>(getClaimStatistics());
        summary.put("startDate", startDate);
        summary.put("endDate", endDate);
        return summary;
    }

    private String generateClaimNumber() {
        return "CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void reportClaimEvent(Claim claim, String eventType) {
        try {
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("claimId", claim.getId());
            eventData.put("claimNumber", claim.getClaimNumber());
            eventData.put("eventType", eventType);
            eventData.put("timestamp", LocalDateTime.now());
            reportingServiceClient.reportClaimEvent(eventData);
        } catch (Exception e) {
            log.error("Failed to report claim event", e);
        }
    }

    private void reportStatusChange(Claim claim, String oldStatus, String newStatus) {
        try {
            Map<String, Object> statusData = new HashMap<>();
            statusData.put("claimId", claim.getId());
            statusData.put("claimNumber", claim.getClaimNumber());
            statusData.put("oldStatus", oldStatus);
            statusData.put("newStatus", newStatus);
            statusData.put("timestamp", claim.getStatusChangedAt());
            reportingServiceClient.reportStatusChange(statusData);
        } catch (Exception e) {
            log.error("Failed to report status change", e);
        }
    }

    private void notifyAssessmentComplete(Claim claim) {
        try {
            Map<String, Object> assessmentData = new HashMap<>();
            assessmentData.put("claimId", claim.getId());
            assessmentData.put("claimNumber", claim.getClaimNumber());
            assessmentData.put("approvedAmount", claim.getApprovedAmount());
            assessmentServiceClient.notifyAssessmentComplete(assessmentData);
        } catch (Exception e) {
            log.error("Failed to notify assessment service", e);
        }
    }

    private void notifyClaimStatus(Claim claim, String status) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("userId", claim.getClaimantId());
            payload.put("claimId", claim.getId());
            payload.put("claimNumber", claim.getClaimNumber());
            payload.put("status", status);
            notificationServiceClient.sendClaimStatusNotification(payload);
        } catch (Exception e) {
            log.error("Failed to notify notification service for claim {}", claim.getId(), e);
        }
    }

    private void applyApprovedAmount(Claim claim, Claim.ClaimStatus newStatus, BigDecimal requestedApprovedAmount) {
        if (requestedApprovedAmount != null) {
            claim.setApprovedAmount(requestedApprovedAmount);
            return;
        }

        if ((newStatus == Claim.ClaimStatus.APPROVED || newStatus == Claim.ClaimStatus.PAID)
                && claim.getApprovedAmount() == null
                && claim.getClaimAmount() != null) {
            claim.setApprovedAmount(claim.getClaimAmount());
        }
    }

    private void validateStatusTransition(Claim.ClaimStatus currentStatus, Claim.ClaimStatus newStatus) {
        Set<Claim.ClaimStatus> validTransitions = allowedTransitions.getOrDefault(currentStatus, EnumSet.noneOf(Claim.ClaimStatus.class));
        if (!validTransitions.contains(newStatus)) {
            throw new IllegalArgumentException("Invalid claim status transition from " + currentStatus + " to " + newStatus);
        }
    }

    private Map<Claim.ClaimStatus, Set<Claim.ClaimStatus>> buildAllowedTransitions() {
        Map<Claim.ClaimStatus, Set<Claim.ClaimStatus>> transitions = new EnumMap<>(Claim.ClaimStatus.class);
        transitions.put(Claim.ClaimStatus.SUBMITTED, EnumSet.of(Claim.ClaimStatus.UNDER_REVIEW, Claim.ClaimStatus.CANCELLED));
        transitions.put(Claim.ClaimStatus.UNDER_REVIEW, EnumSet.of(Claim.ClaimStatus.APPROVED, Claim.ClaimStatus.REJECTED, Claim.ClaimStatus.ADJUSTED, Claim.ClaimStatus.CANCELLED));
        transitions.put(Claim.ClaimStatus.ADJUSTED, EnumSet.of(Claim.ClaimStatus.APPROVED, Claim.ClaimStatus.REJECTED, Claim.ClaimStatus.CANCELLED));
        transitions.put(Claim.ClaimStatus.APPROVED, EnumSet.of(Claim.ClaimStatus.PAID, Claim.ClaimStatus.PAYMENT_FAILED));
        transitions.put(Claim.ClaimStatus.PAYMENT_FAILED, EnumSet.of(Claim.ClaimStatus.PAID, Claim.ClaimStatus.CANCELLED));
        transitions.put(Claim.ClaimStatus.REJECTED, EnumSet.noneOf(Claim.ClaimStatus.class));
        transitions.put(Claim.ClaimStatus.PAID, EnumSet.noneOf(Claim.ClaimStatus.class));
        transitions.put(Claim.ClaimStatus.CANCELLED, EnumSet.noneOf(Claim.ClaimStatus.class));
        return transitions;
    }

    @SuppressWarnings("unchecked")
    private void applyClaimantSnapshot(Claim claim, String fallbackUsername) {
        String claimantName = fallbackUsername;
        String claimantPhone = null;
        try {
            Map<String, Object> envelope = authServiceClient.getCurrentUser();
            if (envelope != null) {
                Object dataObject = envelope.get("data");
                if (dataObject instanceof Map<?, ?> dataMap) {
                    String firstName = toTrimmedString(dataMap.get("firstName"));
                    String lastName = toTrimmedString(dataMap.get("lastName"));
                    String fullName = (firstName + " " + lastName).trim();
                    if (!fullName.isBlank()) {
                        claimantName = fullName;
                    }
                    claimantPhone = toTrimmedString(dataMap.get("phoneNumber"));
                }
            }
        } catch (Exception ex) {
            log.warn("Failed to fetch claimant profile snapshot: {}", ex.getMessage());
        }
        claim.setClaimantName(claimantName);
        claim.setClaimantPhone(claimantPhone);
    }

    private String toTrimmedString(Object value) {
        if (value == null) {
            return null;
        }
        String resolved = String.valueOf(value).trim();
        return resolved.isBlank() ? null : resolved;
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }
        String trimmed = query.trim().toLowerCase();
        return trimmed.isBlank() ? null : trimmed;
    }

    private java.time.LocalDate parseDate(String dateValue) {
        if (dateValue == null || dateValue.isBlank()) {
            return null;
        }
        try {
            return java.time.LocalDate.parse(dateValue.trim());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid date format. Use YYYY-MM-DD.");
        }
    }
}
