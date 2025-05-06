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
  withCredentials: true,
  timeout: 600000, // 10分钟超时
  // 请求重试配置
  retry: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    return axios.isAxiosError(error) && (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      (!error.response && error.code !== 'ERR_CANCELED')
    );
  }
});

// 添加请求重试拦截器
apiClient.interceptors.response.use(null, async (error) => {
  const config = error.config;
  
  // 如果配置了重试，且满足重试条件
  if (config.retry && config.retryCondition(error)) {
    config.retryCount = config.retryCount || 0;
    
    // 如果重试次数小于最大重试次数
    if (config.retryCount < config.retry) {
      config.retryCount += 1;
      
      // 延迟重试
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      console.log(`重试请求 (${config.retryCount}/${config.retry}):`, config.url);
      
      // 重试请求
      return apiClient(config);
    }
  }
  
  return Promise.reject(error);
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
          onFinish?.();
          return;
        }

        try {
          // 检查并删除"data:"前缀
          const jsonStr = line.startsWith('data:') ? line.slice(5) : line;
          const data = JSON.parse(jsonStr);
          onMessage?.(data);
        } catch (error) {
          console.warn('Error parsing SSE message:', error, line);
        }
      });
    };

    const pump = () => reader.read()
      .then(({ value, done }) => {
        if (done) {
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

// 上传聊天图片
export const uploadChatImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/chats/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10分钟超时
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('图片上传失败:', {
      error,
      errorMessage: error.message,
      errorResponse: error.response?.data,
      errorStack: error.stack
    });
    throw error;
  }
};

// 知识库相关API
export const createKnowledgeBase = async (data) => {
  try {
    const response = await apiClient.post('/knowledge-bases', data);
    return response.data;
  } catch (error) {
    console.error('Error creating knowledge base:', {
      error,
      request: data,
      errorMessage: error.message,
      errorResponse: error.response?.data
    });

    if (error.response?.status === 401) {
      throw new Error('请先登录');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (!error.response) {
      throw new Error('网络连接错误，请检查网络后重试');
    } else {
      throw new Error('创建知识库失败，请重试');
    }
  }
};

export const getPublicKnowledgeBases = async (params) => {
  try {
    const response = await apiClient.get('/knowledge-bases/public', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching public knowledge bases:', error);
    throw error;
  }
};

export const getMyKnowledgeBases = async (params) => {
  try {
    const response = await apiClient.get('/knowledge-bases/my', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching my knowledge bases:', error);
    throw error;
  }
};

export const getKnowledgeBase = async (id) => {
  try {
    const response = await apiClient.get(`/knowledge-bases/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    throw error;
  }
};

export const updateKnowledgeBaseColor = async (id, colorMark) => {
  try {
    const response = await apiClient.patch(`/knowledge-bases/${id}/color`, { colorMark });
    return response.data.data;
  } catch (error) {
    console.error('Error updating knowledge base color:', error);
    throw error;
  }
};

export const deleteKnowledgeBase = async (id) => {
  try {
    await apiClient.delete(`/knowledge-bases/${id}`);
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('请先登录');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (!error.response) {
      throw new Error('网络连接错误，请检查网络后重试');
    } else {
      throw new Error('删除知识库失败，请重试');
    }
  }
};

// 文档相关API
export const getDocuments = async (knowledgeBaseId, page = 0, size = 20) => {
  try {
    const response = await apiClient.get('/documents', {
      params: { knowledgeBaseId, page, size }
    });
    return response.data;
  } catch (error) {
    console.error('getDocuments API错误:', {
      error,
      message: error.message,
      response: error.response,
      stack: error.stack
    });
    throw error;
  }
};

// 修改上传文档的功能
export const uploadDocuments = async (files, knowledgeBaseId, onProgress) => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('knowledgeBaseId', knowledgeBaseId);

    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 300000, // 5分钟超时
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const overallProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // 计算每个文件的进度并更新
          const progressMap = {};
          files.forEach(file => {
          const fileProgress = Math.min(overallProgress, 99); // 保留最后1%给处理时间
          progressMap[file.name] = fileProgress;
          });
          // 调用回调更新进度状态
          onProgress?.(progressMap);
        }
      }
    });

    // 返回上传结果
    return {
      results: response.data.results || [],
      errors: response.data.errors || []
    };

  } catch (error) {
    console.error('文档上传失败:', {
      error,
      errorMessage: error.message,
      errorResponse: error.response?.data,
      errorStack: error.stack
    });
    
    return {
      results: [],
      errors: files.map(file => ({
        fileName: file.name,
        error: error.response?.data?.message || error.message
      }))
    };
  }
};

export const deleteDocument = async (documentId, knowledgeBaseId) => {
  try {
    await apiClient.delete(`/documents/${documentId}?knowledgeBaseId=${knowledgeBaseId}`);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// 重试文档处理
export const retryProcessing = async (documentId) => {
  try {
    const response = await apiClient.post(`/documents/${documentId}/retry`);
    return response.data;
  } catch (error) {
    console.error('重试文档处理失败:', error);
    throw error;
  }
};

// 获取文档分块
export const getDocumentChunks = async (documentId) => {
  try {
    const response = await apiClient.get(`/documents/${documentId}/chunks`);
    return response.data;
  } catch (error) {
    console.error('获取文档分块失败:', error);
    throw error;
  }
};

export default apiClient;
