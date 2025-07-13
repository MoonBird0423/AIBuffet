package com.aibuffet.repository;

import com.aibuffet.model.UserOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<UserOrder, Long> {
    Optional<UserOrder> findByOutTradeNo(String outTradeNo);

    List<UserOrder> findByUserIdOrderByCreateTimeDesc(Long userId);

    Optional<UserOrder> findFirstByUserIdAndMemberTypeAndPeriodMonthsAndPayTypeAndPayStatus(
            Long userId, String memberType, Integer periodMonths, String payType, String payStatus);
} 