package com.aibuffet.config;

import io.netty.channel.ChannelOption;
import io.netty.channel.epoll.Epoll;
import io.netty.channel.epoll.EpollDatagramChannel;
import io.netty.channel.socket.DatagramChannel;
import io.netty.channel.socket.nio.NioDatagramChannel;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import io.netty.resolver.dns.DnsAddressResolverGroup;
import io.netty.resolver.dns.DnsNameResolverBuilder;
import io.netty.resolver.dns.DnsServerAddressStreamProvider;
import io.netty.resolver.dns.DnsServerAddresses;
import io.netty.resolver.dns.SequentialDnsServerAddressStreamProvider;
import io.netty.resolver.dns.DefaultDnsCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.netty.handler.logging.LogLevel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;
import java.net.InetSocketAddress;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import jakarta.annotation.PostConstruct;

@Configuration
public class WebClientConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(WebClientConfig.class);

    @Value("${dns.nameservers}")
    private String[] nameservers;
    
    @Value("${dns.query-timeout:10}")
    private int queryTimeout;
    
    @Value("${dns.cache-ttl:1800}")
    private int cacheTtl;
    
    @Value("${dns.min-ttl:60}")
    private int minTtl;
    
    @Value("${dns.max-queries:3}")
    private int maxQueries;

    @Value("${monitor.resolver.enabled:true}")
    private boolean monitoringEnabled;
    
    @PostConstruct
    public void init() {
        // 记录DNS配置信息
        StringBuilder dnsServers = new StringBuilder();
        for (String ns : nameservers) {
            if (dnsServers.length() > 0) {
                dnsServers.append(",");
            }
            dnsServers.append(ns.split(":")[0]);
        }
        logger.info("DNS配置: servers={}, timeout={}s, maxQueries={}", 
            dnsServers, queryTimeout, maxQueries);
    }

    private DnsAddressResolverGroup createDnsResolver() {
        // 解析DNS服务器列表
        List<InetSocketAddress> dnsServers = Arrays.stream(nameservers)
            .map(server -> {
                String[] parts = server.split(":");
                return new InetSocketAddress(
                    parts[0], 
                    parts.length > 1 ? Integer.parseInt(parts[1]) : 53
                );
            })
            .collect(Collectors.toList());

        // 动态选择传输方式
        Class<? extends DatagramChannel> channelType = Epoll.isAvailable() ? 
            EpollDatagramChannel.class : NioDatagramChannel.class;

        DnsNameResolverBuilder builder = new DnsNameResolverBuilder()
            .channelType(channelType)  // 动态设置channel类型
            .queryTimeoutMillis(queryTimeout * 1000L)
            .maxQueriesPerResolve(maxQueries)
            .nameServerProvider(hostname -> DnsServerAddresses.sequential(dnsServers).stream())
            .resolveCache(new DefaultDnsCache())    // 添加DNS缓存
            .ndots(1)
            .recursionDesired(true);                // 启用递归查询

        return new DnsAddressResolverGroup(builder);
    }
    
    @Bean
    public WebClient.Builder webClientBuilder() {
        // 创建优化的连接池
        ConnectionProvider provider = ConnectionProvider.builder("custom-provider")
            .maxConnections(100)
            .maxIdleTime(Duration.ofMinutes(5))
            .maxLifeTime(Duration.ofMinutes(30))
            .pendingAcquireTimeout(Duration.ofMinutes(2))
            .evictInBackground(Duration.ofMinutes(5))
            .build();

        // 配置增强的HttpClient
        HttpClient httpClient = HttpClient.create(provider)
            // 基础连接配置
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000)
            .option(ChannelOption.SO_KEEPALIVE, true)
            .option(ChannelOption.TCP_NODELAY, true)
            .responseTimeout(Duration.ofSeconds(45))
            
            // 设置自定义DNS解析器
            .resolver(createDnsResolver())
            
            // 启用wiretap以便调试
            .wiretap(this.getClass().getCanonicalName(), 
                    monitoringEnabled ? LogLevel.DEBUG : LogLevel.INFO)
            
            // 超时和监控配置
            .doOnConnected(connection -> {
                connection.addHandlerLast(new ReadTimeoutHandler(45, TimeUnit.SECONDS))
                         .addHandlerLast(new WriteTimeoutHandler(45, TimeUnit.SECONDS));
                logger.debug("建立新连接: {}", connection.address());
            })
            .doOnDisconnected(conn -> logger.debug("连接断开: {}", conn.address()));

        // 创建WebClient.Builder
        return WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .filter(logRequest())
            .filter(logResponse());
    }

    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            logger.info("发送请求: {} {}", clientRequest.method(), clientRequest.url());
            clientRequest.headers().forEach((name, values) -> 
                values.forEach(value -> logger.debug("{}={}", name, value)));
            return Mono.just(clientRequest);
        });
    }

    private ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
            logger.info("收到响应: {}", clientResponse.statusCode());
            return Mono.just(clientResponse);
        });
    }
}
