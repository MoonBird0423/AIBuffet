// frontend/src/utils/chatWindowManager.js
import { ToastManager } from '../components/common/Toast';

const CHAT_WINDOW_NAME = 'chat-window';

export const openChatWindow = (questionTarget) => {
  const { type, id, name } = questionTarget;
  
  // 构建Chat URL
  const chatUrl = `/chat?${type}Id=${id}&${type}Name=${encodeURIComponent(name)}`;
  
  // 使用命名窗口，如果已存在则复用
  const chatWindow = window.open(chatUrl, CHAT_WINDOW_NAME);
  
  if (chatWindow) {
    // 等待窗口加载完成后发送消息
    setTimeout(() => {
      try {
        chatWindow.postMessage({
          type: 'UPDATE_QUESTION_TARGET',
          questionTarget: {
            type,
            id,
            name
          }
        }, window.location.origin);
        
        // 显示切换提示（仅在窗口已存在时显示）
        if (chatWindow.document && chatWindow.document.readyState === 'complete') {
          ToastManager.success(`已切换到${type === 'book' ? '图书' : '知识库'}：${name}`);
        }
      } catch (error) {
        console.log('无法发送消息到Chat窗口，可能是跨域问题');
      }
    }, 100);
    
    // 聚焦到Chat窗口
    chatWindow.focus();
  }
};
