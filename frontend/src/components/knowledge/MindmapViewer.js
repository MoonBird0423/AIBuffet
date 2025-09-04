import React, { useEffect, useRef, memo } from 'react';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import { Toolbar } from 'markmap-toolbar';
import 'markmap-toolbar/dist/style.css';
import '../../styles/markmap.css';

const parseAndConvertToMarkdown = (data) => {
  try {
    const content = data?.content || data;
    if (typeof content === 'string') {
      return content;
    }
    throw new Error('Invalid content format: content must be a string');
  } catch (error) {
    console.error('解析脑图数据失败:', error);
    return '# 数据格式错误\n请检查数据格式是否正确';
  }
};

const MindmapViewer = memo(({ content, height = '600px' }) => {
  const svgRef = useRef();
  const markmapRef = useRef();
  const containerRef = useRef();

  // 移动端检测函数
  const isMobile = () => {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // 获取响应式高度
  const getResponsiveHeight = () => {
    if (isMobile()) {
      // 移动端使用视口高度的80%，最小500px
      return Math.max(window.innerHeight * 0.8, 500) + 'px';
    }
    return height;
  };

  // 全屏功能
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      // 进入全屏
      container.requestFullscreen?.() ||
      container.webkitRequestFullscreen?.() ||
      container.mozRequestFullScreen?.() ||
      container.msRequestFullscreen?.();
    } else {
      // 退出全屏
      document.exitFullscreen?.() ||
      document.webkitExitFullscreen?.() ||
      document.mozCancelFullScreen?.() ||
      document.msExitFullscreen?.();
    }
  };

  useEffect(() => {
    if (!content || !svgRef.current || !containerRef.current) return;

    try {
      const svg = svgRef.current;
      const container = containerRef.current;
      svg.innerHTML = '';
      
      const transformer = new Transformer();  // 使用默认配置，不传入任何参数

      const { width, height } = container.getBoundingClientRect();
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);

      const markdownContent = parseAndConvertToMarkdown(content);

      let transformedRoot;
      try {
        const result = transformer.transform(markdownContent);
        transformedRoot = result.root;
      } catch (error) {
        console.error('转换脑图数据失败:', error);        throw new Error('脑图数据转换失败');
      }
      
      // 初始化时展开所有节点
      const expandAll = (node) => {
        if (node.children) {
          node.state = { collapsed: false };
          node.children.forEach(expandAll);
        }
      };
      
      expandAll(transformedRoot);
      
      // 根据设备类型配置markmap选项
      const markmapOptions = {
        duration: 500,
        maxWidth: isMobile() ? 200 : 300,
        spacingVertical: isMobile() ? 8 : 10,
        spacingHorizontal: isMobile() ? 60 : 80,
        autoFit: true,
        pan: true,
        zoom: true,
        initialExpandLevel: isMobile() ? 2 : 3,
      };
      
      // 创建Markmap实例
      const mm = Markmap.create(svg, markmapOptions, transformedRoot);
      markmapRef.current = mm;
      
      // 创建工具栏并添加自定义全屏按钮
      const toolbar = Toolbar.create(mm);
      
      // 创建全屏工具栏项
      const fullscreenItem = {
        id: 'fullscreen',
        title: '全屏显示',
        content: '⛶',
        onClick: (e) => {
          e.preventDefault();
          toggleFullscreen();
        }
      };
      
      // 获取默认工具栏项并添加全屏按钮
      const items = [...Toolbar.defaultItems, fullscreenItem];
      toolbar.setItems(items);
      
      const toolbarEl = toolbar.render();
      
      // 设置工具栏样式
      toolbarEl.style.position = 'absolute';
      toolbarEl.style.top = '0.5rem';
      toolbarEl.style.right = '0.5rem';
      toolbarEl.style.zIndex = '1000';
      
      // 添加自定义CSS类来隐藏markmap图标
      toolbarEl.classList.add('custom-toolbar');
      
      // 将工具栏添加到容器
      container.append(toolbarEl);

      // 移动端初始缩放优化
      if (isMobile()) {
        setTimeout(() => {
          try {
            // 确保 markmap 实例和 DOM 已经完全初始化
            if (!mm || !mm.state) {
              console.warn('Markmap实例未完全初始化');
              return;
            }
            
            // 设置初始缩放以确保内容在移动端更好地显示
            mm.fit();
            
            setTimeout(() => {
              try {
                // 安全检查 transform 是否存在
                if (!mm.state || !mm.state.transform) {
                  console.warn('Markmap transform 状态未准备好');
                  return;
                }
                
                const currentTransform = mm.state.transform;
                
                // 确保 transform 对象有必需的属性
                if (typeof currentTransform.k !== 'number' || 
                    typeof currentTransform.x !== 'number' || 
                    typeof currentTransform.y !== 'number') {
                  console.warn('Transform 属性不完整:', currentTransform);
                  return;
                }
                
                const scale = Math.min(currentTransform.k * 1.5, 2); // 增加50%缩放，最大2倍
                mm.setTransform({
                  x: currentTransform.x,
                  y: currentTransform.y,
                  k: scale
                });
              } catch (transformError) {
                console.error('设置移动端缩放失败:', transformError);
              }
            }, 150);
          } catch (error) {
            console.error('移动端初始化失败:', error);
          }
        }, 300);
      }

      const resizeObserver = new ResizeObserver(() => {
        const { width, height } = container.getBoundingClientRect();
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        // 移动端窗口大小变化时重新适配
        if (isMobile() && mm) {
          setTimeout(() => mm.fit(), 100);
        }
      });
      
      resizeObserver.observe(container);
      return () => {
        resizeObserver.disconnect();
        if (toolbarEl && toolbarEl.parentNode) {
          toolbarEl.parentNode.removeChild(toolbarEl);
        }
      };
    } catch (error) {
      console.error('渲染脑图失败:', error);
      // 显示错误信息在SVG中
      if (svgRef.current) {
        const errorText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        errorText.setAttribute('x', '50%');
        errorText.setAttribute('y', '50%');
        errorText.setAttribute('text-anchor', 'middle');
        errorText.setAttribute('fill', '#666');
        errorText.textContent = '脑图渲染失败，请检查数据格式';
        svgRef.current.appendChild(errorText);
      }
    }
  }, [content]);

  return (
    <div 
      ref={containerRef}
      className="markmap-wrapper bg-white rounded-lg p-6 shadow-sm border border-gray-200 relative" 
      style={{ height: getResponsiveHeight(), width: '100%' }}
    >
      <svg 
        ref={svgRef}
        className={`markmap ${isMobile() ? 'markmap-mobile' : 'markmap-desktop'}`}
        style={{ width: '100%', height: '100%' }}
        viewBox={isMobile() ? undefined : "0 0 800 600"}
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
});

export default MindmapViewer;
