import React, { useEffect, useRef, memo } from 'react';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import '../../styles/markmap.css';

const parseAndConvertToMarkdown = (data) => {
  try {
    console.log('传入的数据:', data); // 添加日志
    // 提取content字段（包含脑图数据）
    const content = data?.content || data;
    // 确保content是字符串
    if (typeof content === 'string') {
      console.log('处理后的markdown内容:', content);
      return content;
    }
    throw new Error('Invalid content format: content must be a string');
  } catch (error) {
    console.error('解析脑图数据失败:', error);
    return '# 数据格式错误\n请检查数据格式是否正确';
  }
};

const MindmapViewer = memo(({ content }) => {
  const svgRef = useRef();
  const markmapRef = useRef();
  const containerRef = useRef();
  const transformedRootRef = useRef(null);

  useEffect(() => {
    if (!content || !svgRef.current || !containerRef.current) return;

    try {
      const svg = svgRef.current;
      const container = containerRef.current;
      svg.innerHTML = '';
      
      // 设置初始尺寸
      const { width, height } = container.getBoundingClientRect();
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);

      const markdownContent = parseAndConvertToMarkdown(content);
      console.log('准备渲染的markdown内容:', markdownContent);
      
      const transformer = new Transformer();
      const { root: transformedRoot } = transformer.transform(markdownContent);
      
      // 初始化时展开所有节点
      const expandAll = (node) => {
        if (node.children) {
          node.state = { collapsed: false };
          node.children.forEach(expandAll);
        }
      };
      expandAll(transformedRoot);

      // 创建Markmap实例前确保SVG尺寸已设置
      const mm = Markmap.create(svg, {
        duration: 500,
        maxWidth: Math.max(300, width * 0.8), // 根据容器宽度调整
        color: (node) => {
          const colors = [
            '#2196f3',  // 蓝色
            '#4caf50',  // 绿色
            '#ff9800',  // 橙色
            '#e91e63',  // 粉色
            '#9c27b0',  // 紫色
            '#00bcd4',  // 青色
            '#ff5722',  // 深橙色
            '#795548'   // 棕色
          ];
          return colors[node.depth % colors.length];
        },
        paddingX: 16,
        paddingY: 4,
        nodeMinHeight: 16,
        spacingHorizontal: 80,
        spacingVertical: 16,
        autoFit: false, // 禁用自动缩放
        fitRatio: 0.95,
        initialExpandLevel: 3, // 设置为-1表示完全展开
        // 添加节点样式
        nodeStyle: (node) => {
          const colors = [
            '#2196f3',  // 蓝色
            '#4caf50',  // 绿色
            '#ff9800',  // 橙色
            '#e91e63',  // 粉色
            '#9c27b0',  // 紫色
            '#00bcd4',  // 青色
            '#ff5722',  // 深橙色
            '#795548'   // 棕色
          ];
          const color = colors[node.depth % colors.length];
          return {
            stroke: color,
            strokeWidth: '2px',
            fill: node.children ? (node.state?.collapsed ? '#f0f0f0' : '#fff') : '#fff',
            rx: 5,
            ry: 5
          };
        },
        // 添加连接线样式
        linkStyle: {
          stroke: '#666',
          strokeWidth: '2px',
          fill: 'none',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        },
        // 添加文本样式
        textStyle: {
          fill: '#333',
          fontSize: '14px',
          dominantBaseline: 'middle',
          textAnchor: 'start',
          style: {
            fontSize: '14px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }
        },
        // 添加连接线配置
        curveRadius: 5,
        renderOptions: {
          linkMiddleArc: true, // 启用中心弧线连接
          linkVerticalOffset: 8, // 添加一些垂直偏移使连接线更自然
          linkShape: 'diagonal', // 使用对角线形状的连接线
          linkWidth: 2 // 保持连接线宽度一致
        },
        spacingVertical: 24 // 增加垂直间距以适应新的连接线样式
      }, transformedRoot);

      markmapRef.current = mm;

      // 使用ResizeObserver监听容器尺寸变化
      const resizeObserver = new ResizeObserver(() => {
        const { width, height } = container.getBoundingClientRect();
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        // 不再调用 mm.fit() 以避免自动缩放
      });

      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    } catch (error) {
      console.error('渲染脑图失败:', error);
    }
  }, [content]);

  return (
    <div 
      ref={containerRef}
      className="markmap-wrapper bg-white rounded-lg p-6 shadow-sm border border-gray-200" 
      style={{ height: '600px', width: '100%' }}
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
