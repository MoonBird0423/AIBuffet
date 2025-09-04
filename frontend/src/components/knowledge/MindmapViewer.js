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

    const initMarkmap = () => {
      try {
        const svg = svgRef.current;
        const container = containerRef.current;
        
        if (!svg || !container) return;
        
        svg.innerHTML = '';
        
        // 1. 容器尺寸验证
        const { width, height } = container.getBoundingClientRect();
        if (width <= 0 || height <= 0) {
          console.warn('容器尺寸无效，等待重新渲染');
          setTimeout(initMarkmap, 100);
          return;
        }
        
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);

        // 2. 数据处理和验证
        const transformer = new Transformer();
        const markdownContent = parseAndConvertToMarkdown(content);

        let transformedRoot;
        try {
          const result = transformer.transform(markdownContent);
          transformedRoot = result.root;
          
          // 验证数据完整性
          if (!transformedRoot || typeof transformedRoot !== 'object') {
            throw new Error('转换后的数据无效');
          }
        } catch (error) {
          console.error('转换脑图数据失败:', error);
          throw new Error('脑图数据转换失败');
        }
        
        // 3. 展开节点
        const expandAll = (node) => {
          if (node && node.children && Array.isArray(node.children)) {
            node.state = { collapsed: false };
            node.children.forEach(expandAll);
          }
        };
        
        expandAll(transformedRoot);
        
        // 4. 简化的 markmap 配置 - 优先稳定性
        let markmapOptions;
        try {
          if (isMobile()) {
            // 移动端使用保守的配置
            markmapOptions = {
              autoFit: true,
              pan: true,
              zoom: true,
              maxWidth: 200,
              spacingVertical: 10,
              spacingHorizontal: 60
            };
          } else {
            // 桌面端使用默认配置
            markmapOptions = undefined;
          }
        } catch (configError) {
          console.warn('配置markmap选项失败，使用默认配置:', configError);
          markmapOptions = undefined;
        }
        
        // 5. 创建 Markmap 实例（带错误回退）
        let mm;
        try {
          mm = Markmap.create(svg, markmapOptions, transformedRoot);
          markmapRef.current = mm;
        } catch (createError) {
          console.error('使用自定义配置创建markmap失败，尝试默认配置:', createError);
          try {
            // 回退到默认配置
            mm = Markmap.create(svg, undefined, transformedRoot);
            markmapRef.current = mm;
          } catch (fallbackError) {
            console.error('创建markmap完全失败:', fallbackError);
            throw new Error('无法创建脑图实例');
          }
        }

        // 6. 创建工具栏
        try {
          const toolbar = Toolbar.create(mm);
          
          const fullscreenItem = {
            id: 'fullscreen',
            title: '全屏显示',
            content: '⛶',
            onClick: (e) => {
              e.preventDefault();
              toggleFullscreen();
            }
          };
          
          const items = [...Toolbar.defaultItems, fullscreenItem];
          toolbar.setItems(items);
          
          const toolbarEl = toolbar.render();
          
          toolbarEl.style.position = 'absolute';
          toolbarEl.style.top = '0.5rem';
          toolbarEl.style.right = '0.5rem';
          toolbarEl.style.zIndex = '1000';
          toolbarEl.classList.add('custom-toolbar');
          
          container.append(toolbarEl);
          
          // 清理函数中需要移除工具栏
          svg.toolbarElement = toolbarEl;
        } catch (toolbarError) {
          console.warn('创建工具栏失败:', toolbarError);
          // 工具栏失败不影响核心功能
        }

        // 7. 移动端优化（简化版）
        if (isMobile() && mm) {
          // 使用更安全的方式进行移动端优化
          requestAnimationFrame(() => {
            try {
              if (mm && mm.fit) {
                mm.fit();
                
                // 简单的缩放优化，不依赖复杂的 transform 状态
                setTimeout(() => {
                  try {
                    if (mm && mm.state && mm.state.transform && mm.setTransform) {
                      const transform = mm.state.transform;
                      if (transform && 
                          typeof transform.k === 'number' && 
                          typeof transform.x === 'number' && 
                          typeof transform.y === 'number' &&
                          !isNaN(transform.k) && 
                          !isNaN(transform.x) && 
                          !isNaN(transform.y)) {
                        
                        // 只做轻微的缩放调整
                        const newScale = Math.min(transform.k * 1.2, 1.8);
                        mm.setTransform({
                          x: transform.x,
                          y: transform.y,
                          k: newScale
                        });
                      }
                    }
                  } catch (scaleError) {
                    console.warn('移动端缩放调整失败:', scaleError);
                    // 失败了也不影响基本功能
                  }
                }, 200);
              }
            } catch (mobileError) {
              console.warn('移动端优化失败:', mobileError);
            }
          });
        }

        // 8. 响应式处理
        const resizeObserver = new ResizeObserver((entries) => {
          try {
            for (const entry of entries) {
              const { width, height } = entry.contentRect;
              if (width > 0 && height > 0) {
                svg.setAttribute('width', width);
                svg.setAttribute('height', height);
                
                if (mm && mm.fit) {
                  setTimeout(() => mm.fit(), 100);
                }
              }
            }
          } catch (resizeError) {
            console.warn('窗口大小调整处理失败:', resizeError);
          }
        });
        
        resizeObserver.observe(container);
        
        // 清理函数
        svg.resizeObserver = resizeObserver;
        
      } catch (error) {
        console.error('初始化脑图失败:', error);
        
        // 显示错误信息
        const svg = svgRef.current;
        if (svg) {
          svg.innerHTML = '';
          try {
            const errorText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            errorText.setAttribute('x', '50%');
            errorText.setAttribute('y', '50%');
            errorText.setAttribute('text-anchor', 'middle');
            errorText.setAttribute('fill', '#666');
            errorText.setAttribute('font-size', '14');
            errorText.textContent = '脑图加载失败，请刷新重试';
            svg.appendChild(errorText);
          } catch (errorDisplayError) {
            console.error('显示错误信息失败:', errorDisplayError);
          }
        }
      }
    };

    // 延迟初始化，确保DOM完全渲染
    const timeoutId = setTimeout(initMarkmap, 50);

    return () => {
      clearTimeout(timeoutId);
      
      // 清理资源
      const svg = svgRef.current;
      if (svg) {
        if (svg.resizeObserver) {
          svg.resizeObserver.disconnect();
        }
        if (svg.toolbarElement && svg.toolbarElement.parentNode) {
          svg.toolbarElement.parentNode.removeChild(svg.toolbarElement);
        }
      }
      
      // 清理 markmap 实例
      if (markmapRef.current) {
        try {
          if (markmapRef.current.destroy) {
            markmapRef.current.destroy();
          }
        } catch (destroyError) {
          console.warn('清理markmap实例失败:', destroyError);
        }
        markmapRef.current = null;
      }
    };
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
