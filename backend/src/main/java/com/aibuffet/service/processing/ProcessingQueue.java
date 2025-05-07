package com.aibuffet.service.processing;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

@Slf4j
@Component
public class ProcessingQueue {
    private final BlockingQueue<ProcessingTask> taskQueue;
    private volatile boolean running;
    
    public ProcessingQueue() {
        this.taskQueue = new LinkedBlockingQueue<>(100);
        this.running = true;
    }
    
    @PostConstruct
    public void startProcessing() {
        Thread processingThread = new Thread(this::processQueue, "processing-queue-thread");
        processingThread.setDaemon(true);
        processingThread.start();
        log.info("处理队列线程已启动");
    }
    
    private void processQueue() {
        while (running) {
            try {
                ProcessingTask task = taskQueue.take();
                processTask(task);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("处理队列线程被中断", e);
                break;
            } catch (Exception e) {
                log.error("处理任务时发生错误", e);
            }
        }
    }
    
    public void enqueue(ProcessingTask task) {
        try {
            taskQueue.put(task);
            log.info("任务已加入队列: taskId={}, type={}", task.getDocId(), task.getType());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("添加任务到队列时被中断", e);
            throw new RuntimeException("Failed to enqueue task", e);
        }
    }
    
    private void processTask(ProcessingTask task) {
        try {
            log.info("开始处理任务: taskId={}, type={}", task.getDocId(), task.getType());
            task.getProcessor().process(task.getContext());
            log.info("任务处理完成: taskId={}, type={}", task.getDocId(), task.getType());
        } catch (Exception e) {
            log.error("任务处理失败: taskId={}, type={}, error={}", 
                task.getDocId(), task.getType(), e.getMessage(), e);
            
            if (task.getRetryCount() < 3) {
                task.setRetryCount(task.getRetryCount() + 1);
                enqueue(task);
                log.info("任务已重新入队: taskId={}, type={}, retryCount={}", 
                    task.getDocId(), task.getType(), task.getRetryCount());
            } else {
                log.error("任务重试次数已达上限: taskId={}, type={}", task.getDocId(), task.getType());
            }
        }
    }
    
    public void shutdown() {
        running = false;
    }
}
