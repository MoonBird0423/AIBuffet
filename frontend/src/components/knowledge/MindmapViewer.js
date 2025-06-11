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
      
      // 创建Markmap实例，使用默认配置以确保线条正确显示
      const mm = Markmap.create(svg, undefined, transformedRoot);
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
      container.append(toolbarEl);      const resizeObserver = new ResizeObserver(() => {
        const { width, height } = container.getBoundingClientRect();
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
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
      style={{ height: height, width: '100%' }}
    >
      <svg 
        ref={svgRef}
        className="markmap"
        style={{ width: '100%', height: '100%' }}
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
});

export default MindmapViewer;
