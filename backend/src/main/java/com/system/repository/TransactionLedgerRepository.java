package com.system.repository;

import com.system.entity.TransactionLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface TransactionLedgerRepository extends JpaRepository<TransactionLedger, Long> {

    List<TransactionLedger> findByDepositId(Long depositId);

    List<TransactionLedger> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM TransactionLedger t WHERE t.transactionType = 'DEPOSIT_RECEIVED' AND t.status = 'CONFIRMED'")
    BigDecimal getTotalHoldingDepositAmount();
}
