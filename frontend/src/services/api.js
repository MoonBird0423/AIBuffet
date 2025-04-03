import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true
});

// 添加请求拦截器来处理认证
apiClient.interceptors.request.use((config) => {
  // 保存原有的Content-Type
  const originalContentType = config.headers['Content-Type'];

  // 确保headers对象存在
  config.headers = config.headers || {};

  // 从localStorage获取认证信息
  const authUser = localStorage.getItem('auth_user');
  if (authUser) {
    try {
      const user = JSON.parse(authUser);
      if (user.token) {
        // 设置认证头
        config.headers['Authorization'] = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error('解析认证信息失败:', e);
    }
  }

  // 如果是文件上传，设置正确的Content-Type，但保留其他headers
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  } else if (originalContentType) {
    config.headers['Content-Type'] = originalContentType;
  }

  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// 添加响应拦截器处理认证错误
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      if (error.response.status === 403 ||
          error.response.status === 401 ||
          (error.response.data && error.response.data.message && error.response.data.message.includes('session'))) {
        localStorage.removeItem('auth_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw new Error('认证失败，请重新登录');
      }
    }
    return Promise.reject(error);
  }
);

// 聊天相关API
export const getChatSessions = async () => {
  try {
    const response = await apiClient.get('/chats');
    return response.data;
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    throw error;
  }
};

export const getChatSession = async (sessionId) => {
  try {
    const response = await apiClient.get(`/chats/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat session:', error);
    throw error;
  }
};

export const createChatSession = async (message) => {
  try {
    const response = await apiClient.post('/chats', { message });
    return response.data;
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
};

export const updateChatSession = async (sessionId, messages) => {
  try {
    const response = await apiClient.put(`/chats/${sessionId}`, { messages });
    return response.data;
  } catch (error) {
    console.error('Error updating chat session:', error);
    throw error;
  }
};

export const deleteChatSession = async (sessionId) => {
  try {
    await apiClient.delete(`/chats/${sessionId}`);
  } catch (error) {
    console.error('Error deleting chat session:', error);
    throw error;
  }
};

// 模型调用相关API
export const invokeModel = ({ messages, model, onMessage, onError, onFinish, signal }) => {
  // 获取认证信息
  const authUser = localStorage.getItem('auth_user');
  let token = '';
  if (authUser) {
    try {
      const user = JSON.parse(authUser);
      token = user.token;
    } catch (e) {
      console.error('解析认证信息失败:', e);
    }
  }

  const requestBody = {
    messages,
    model,
    stream: true,
    temperature: 0.7,
  };

  console.log('Sending request to model service:', {
    url: `${API_URL}/chat/completions`,
    model,
    messageCount: messages.length,
    lastMessage: messages[messages.length - 1]
  });

  // 使用fetch API发送请求并处理SSE响应
  fetch(`${API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestBody),
    signal
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log('SSE connection established');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const processText = (text) => {
      buffer += text;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      lines.forEach(line => {
        if (!line.trim()) return;
        
        if (line.trim() === 'data: [DONE]') {
          console.log('Received [DONE] signal');
          onFinish?.();
          return;
        }

        try {
          // 检查并删除"data:"前缀
          const jsonStr = line.startsWith('data:') ? line.slice(5) : line;
          const data = JSON.parse(jsonStr);
          console.debug('Received chunk:', data);
          onMessage?.(data);
        } catch (error) {
          console.warn('Error parsing SSE message:', error, line);
        }
      });
    };

    const pump = () => reader.read()
      .then(({ value, done }) => {
        if (done) {
          console.log('Stream complete');
          onFinish?.();
          return;
        }
        processText(decoder.decode(value, { stream: true }));
        return pump();
      });

    return pump();
  })
  .catch(error => {
    console.error('Error in SSE connection:', error);
    onError?.(error);
  });

  // 返回一个取消函数
  return () => {
    console.log('Cancelling model invocation');
    if (signal) {
      signal.abort();
    }
  };
};

export const queryModels = async (params) => {
  try {
    const response = await apiClient.get('/model/query', { params });
    return response.data;
  } catch (error) {
    console.error('Error querying models:', error);
    throw error;
  }
};

export default apiClient;
