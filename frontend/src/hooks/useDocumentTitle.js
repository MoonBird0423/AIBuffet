import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    // 如果当前标题以 '| 书意' 结尾，则不重复添加
    if (title.endsWith('| 书意')) {
      document.title = title;
      return;
    }
    
    // 如果标题就是 '书意'，直接使用
    if (title === '书意') {
      document.title = title;
      return;
    }
    
    // 其他情况，加上品牌名称
    document.title = `${title} | 书意`;
  }, [title]);
};

export default useDocumentTitle;
