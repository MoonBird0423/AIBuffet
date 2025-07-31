package com.aibuffet.repository;

import com.aibuffet.model.UserOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<UserOrder, Long> {
    Optional<UserOrder> findByOutTradeNo(String outTradeNo);

    List<UserOrder> findByUserIdOrderByCreateTimeDesc(Long userId);

    Optional<UserOrder> findFirstByUserIdAndMemberTypeAndPeriodMonthsAndPayTypeAndPayStatus(
            Long userId, String memberType, Integer periodMonths, String payType, String payStatus);

    Page<UserOrder> findByUserIdOrderByCreateTimeDesc(Long userId, Pageable pageable);

    List<UserOrder> findByUserIdAndPayStatusOrderByCreateTimeDesc(Long userId, String payStatus);

    Page<UserOrder> findByUserIdAndPayStatusOrderByCreateTimeDesc(Long userId, String payStatus, Pageable pageable);
}
