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
    console.log(`[StreamDebug] ${eventType}:`, { timestamp, ...data });
  }

  // 分析流式输出性能
  analyze() {
    const sseEvents = this.events.filter(e => e.eventType.startsWith('SSE_'));
    const uiEvents = this.events.filter(e => e.eventType.startsWith('UI_'));
    const chatEvents = this.events.filter(e => e.eventType.startsWith('CHAT_'));

    console.log('[StreamDebug] 性能分析报告:');
    console.log('总事件数:', this.events.length);
    console.log('SSE事件数:', sseEvents.length);
    console.log('UI事件数:', uiEvents.length);
    console.log('Chat事件数:', chatEvents.length);

    // 分析SSE事件间隔
    if (sseEvents.length > 1) {
      const intervals = [];
      for (let i = 1; i < sseEvents.length; i++) {
        intervals.push(sseEvents[i].timestamp - sseEvents[i-1].timestamp);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const maxInterval = Math.max(...intervals);
      const minInterval = Math.min(...intervals);
      
      console.log('SSE事件间隔分析:');
      console.log('  平均间隔:', avgInterval.toFixed(2), 'ms');
      console.log('  最大间隔:', maxInterval, 'ms');
      console.log('  最小间隔:', minInterval, 'ms');
      
      // 检测异常间隔
      const abnormalIntervals = intervals.filter(interval => interval > 1000);
      if (abnormalIntervals.length > 0) {
        console.warn('检测到异常间隔:', abnormalIntervals);
      }
    }

    // 分析UI更新延迟
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
      console.log('UI更新延迟分析:');
      console.log('  平均延迟:', avgDelay.toFixed(2), 'ms');
      console.log('  最大延迟:', maxDelay, 'ms');
    }

    return {
      totalEvents: this.events.length,
      sseEvents: sseEvents.length,
      uiEvents: uiEvents.length,
      chatEvents: chatEvents.length,
      events: this.events
    };
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