// 流式调试工具
class StreamDebugger {
  constructor() {
    this.events = [];
    this.startTime = Date.now();
  }

  // 记录事件
  log(eventType, data = {}) {
    const timestamp = Date.now() - this.startTime;
    const event = {
      timestamp,
      eventType,
      data,
      time: new Date().toISOString()
    };
    
    this.events.push(event);
    // 移除多余日志，只在性能分析时输出
  }

  // 分析流式输出性能（不输出日志，只返回数据）
  analyze() {
    const sseEvents = this.events.filter(e => e.eventType.startsWith('SSE_'));
    const uiEvents = this.events.filter(e => e.eventType.startsWith('UI_'));
    const chatEvents = this.events.filter(e => e.eventType.startsWith('CHAT_'));

    // 分析SSE事件间隔
    let sseAnalysis = null;
    if (sseEvents.length > 1) {
      const intervals = [];
      for (let i = 1; i < sseEvents.length; i++) {
        intervals.push(sseEvents[i].timestamp - sseEvents[i-1].timestamp);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const maxInterval = Math.max(...intervals);
      const minInterval = Math.min(...intervals);
      
      // 检测异常间隔
      const abnormalIntervals = intervals.filter(interval => interval > 1000);
      
      sseAnalysis = {
        avgInterval: avgInterval.toFixed(2),
        maxInterval,
        minInterval,
        abnormalIntervals
      };
    }

    // 分析UI更新延迟
    let uiAnalysis = null;
    const uiUpdateDelays = [];
    for (let i = 0; i < sseEvents.length; i++) {
      const sseEvent = sseEvents[i];
      const nextUIEvent = uiEvents.find(ui => ui.timestamp >= sseEvent.timestamp);
      if (nextUIEvent) {
        uiUpdateDelays.push(nextUIEvent.timestamp - sseEvent.timestamp);
      }
    }

    if (uiUpdateDelays.length > 0) {
      const avgDelay = uiUpdateDelays.reduce((a, b) => a + b, 0) / uiUpdateDelays.length;
      const maxDelay = Math.max(...uiUpdateDelays);
      uiAnalysis = {
        avgDelay: avgDelay.toFixed(2),
        maxDelay
      };
    }

    return {
      totalEvents: this.events.length,
      sseEvents: sseEvents.length,
      uiEvents: uiEvents.length,
      chatEvents: chatEvents.length,
      sseAnalysis,
      uiAnalysis,
      events: this.events
    };
  }

  // 输出性能分析报告
  printReport() {
    const analysis = this.analyze();

    console.log('[StreamDebug] 性能分析报告:');
    console.log('总事件数:', analysis.totalEvents);
    console.log('SSE事件数:', analysis.sseEvents);
    console.log('UI事件数:', analysis.uiEvents);
    console.log('Chat事件数:', analysis.chatEvents);

    if (analysis.sseAnalysis) {
      console.log('SSE事件间隔分析:');
      console.log('  平均间隔:', analysis.sseAnalysis.avgInterval, 'ms');
      console.log('  最大间隔:', analysis.sseAnalysis.maxInterval, 'ms');
      console.log('  最小间隔:', analysis.sseAnalysis.minInterval, 'ms');
      
      if (analysis.sseAnalysis.abnormalIntervals.length > 0) {
        console.warn('检测到异常间隔:', analysis.sseAnalysis.abnormalIntervals);
      }
    }

    if (analysis.uiAnalysis) {
      console.log('UI更新延迟分析:');
      console.log('  平均延迟:', analysis.uiAnalysis.avgDelay, 'ms');
      console.log('  最大延迟:', analysis.uiAnalysis.maxDelay, 'ms');
    }
  }

  // 重置调试器
  reset() {
    this.events = [];
    this.startTime = Date.now();
  }

  // 导出事件数据
  export() {
    return {
      events: this.events,
      analysis: this.analyze()
    };
  }
}

// 全局调试器实例
window.streamDebugger = new StreamDebugger();

// 导出调试器
export default window.streamDebugger;
