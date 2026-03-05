package com.claimswift.claimservice.repository;

import com.claimswift.claimservice.entity.Claim;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Claim Repository
 */
@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    
    Optional<Claim> findByClaimNumber(String claimNumber);
    
    Page<Claim> findByClaimantId(Long claimantId, Pageable pageable);

    List<Claim> findByClaimantId(Long claimantId);
    
    Page<Claim> findByStatus(Claim.ClaimStatus status, Pageable pageable);

    List<Claim> findByStatus(Claim.ClaimStatus status);
    
    Page<Claim> findByAdjusterId(Long adjusterId, Pageable pageable);

    List<Claim> findByAdjusterId(Long adjusterId);
    
    List<Claim> findByStatusAndAdjusterId(Claim.ClaimStatus status, Long adjusterId);
    
    @Query("SELECT c FROM Claim c WHERE c.policyNumber = :policyNumber AND c.status != 'CANCELLED'")
    List<Claim> findActiveClaimsByPolicyNumber(@Param("policyNumber") String policyNumber);
    
    @Query("SELECT c FROM Claim c WHERE c.createdAt BETWEEN :startDate AND :endDate")
    List<Claim> findClaimsByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(c) FROM Claim c WHERE c.status = :status")
    Long countByStatus(@Param("status") Claim.ClaimStatus status);
    
    @Query("SELECT COALESCE(SUM(c.approvedAmount), 0) FROM Claim c WHERE c.status = 'APPROVED'")
    BigDecimal sumApprovedClaims();

    @Query("""
            SELECT c FROM Claim c
            WHERE LOWER(c.claimNumber) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(c.policyNumber) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(c.vehicleRegistration) LIKE LOWER(CONCAT('%', :query, '%'))
            ORDER BY c.createdAt DESC
            """)
    List<Claim> searchClaims(@Param("query") String query);
}
