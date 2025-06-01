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
  console.log('Request Interceptor: URL', config.url);
  console.log('Request Interceptor: Method', config.method);
  
  // 保存原有的Content-Type
  const originalContentType = config.headers['Content-Type'];

  // 确保headers对象存在
  config.headers = config.headers || {};

  // 从localStorage获取认证信息
  console.log('Request Interceptor: Getting auth from localStorage');
  const authUser = localStorage.getItem('auth_user');
  if (authUser) {
    try {
      console.log('Request Interceptor: Auth data found in localStorage');
      const user = JSON.parse(authUser);
      console.log('Request Interceptor: Parsed user data:', { 
        ...user, 
        token: user.token ? '***' : undefined 
      });
      
      if (user.token) {
        // 设置认证头
        console.log('Request Interceptor: Setting Authorization header');
        config.headers['Authorization'] = `Bearer ${user.token}`;
      } else {
        console.log('Request Interceptor: No token found in user data');
      }
    } catch (e) {
      console.error('Request Interceptor: Failed to parse auth data:', e);
    }
  } else {
    console.log('Request Interceptor: No auth data in localStorage');
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

// 认证错误检测函数
const isAuthenticationError = (error) => {
  if (!error.response) return false;
  
  const { status, data } = error.response;
  
  // 明确的认证失败状态码
  if (status === 401 || status === 403) {
    // 如果没有响应数据，默认视为认证错误
    if (!data || !data.message) {
      return true;
    }
    
    const message = data.message.toLowerCase();
    
    // 排除业务相关的错误消息（这些不应该触发登录跳转）
    const businessErrorKeywords = [
      'chat session',
      'session not found',
      'session expired',
      'session invalid',
      '会话',
      '对话'
    ];
    
    // 如果包含业务错误关键词，不视为认证错误
    if (businessErrorKeywords.some(keyword => message.includes(keyword))) {
      return false;
    }
    
    // 只有包含特定认证相关关键词才视为认证错误
    const authKeywords = [
      'unauthorized', 
      'authentication failed', 
      'invalid token', 
      'token expired',
      'access denied',
      'login required',
      'not authenticated',
      '认证失败',
      '未授权',
      '登录已过期',
      'token无效',
      '请先登录'
    ];
    
    return authKeywords.some(keyword => message.includes(keyword));
  }
  
  return false;
};

// 响应拦截器处理认证错误，添加重试机制
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (isAuthenticationError(error)) {
      // 记录当前token
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        console.log('检测到认证错误，准备清除用户状态');
        // 确保用户不在登录页面才清除状态和跳转
        if (!window.location.pathname.includes('/login')) {
          console.log('清除用户状态并跳转登录页');
          localStorage.removeItem('auth_user');
          window.location.href = '/login';
        }
      }
      throw new Error('认证失败，请重新登录');
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

export const createChatSession = async (message, questionTarget = null) => {
  try {
    const requestBody = { 
      message: message
    };
    
    // 如果有提问对象，添加到请求中
    if (questionTarget) {
      requestBody.questionTargetType = questionTarget.type;
      requestBody.questionTargetId = questionTarget.id;
      requestBody.questionTargetName = questionTarget.name;
    }
    
    const response = await apiClient.post('/chats', requestBody);
    return response.data;
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
};

export const updateChatSession = async (sessionId, messages, retryCount = 3) => {
  for (let i = 0; i < retryCount; i++) {
    try {
      const response = await apiClient.put(`/chats/${sessionId}`, { messages });
      return response.data;
    } catch (error) {
      // 如果是404错误（会话不存在）或者是最后一次重试，直接抛出错误
      if (error.response?.status === 404 || i === retryCount - 1) {
        console.error('Error updating chat session:', error);
        throw error;
      }
      console.log(`Retrying update chat session (${i + 1}/${retryCount})...`);
      // 等待后重试，每次等待时间递增
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
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

// 更新提问对象
export const updateQuestionTarget = async (sessionId, questionTarget) => {
  try {
    const response = await apiClient.put(`/chats/${sessionId}/question-target`, {
      questionTargetType: questionTarget.type,
      questionTargetId: questionTarget.id,
      questionTargetName: questionTarget.name
    });
    return response.data;
  } catch (error) {
    console.error('Error updating question target:', error);
    throw error;
  }
};

// 清除提问对象
export const clearQuestionTarget = async (sessionId) => {
  try {
    const response = await apiClient.delete(`/chats/${sessionId}/question-target`);
    return response.data;
  } catch (error) {
    console.error('Error clearing question target:', error);
    throw error;
  }
};

// 模型调用相关API
export const invokeModel = ({ messages, onMessage, onError, onFinish, signal }) => {
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

    let isCompleted = false;
    const markAsCompleted = async () => {
      if (!isCompleted) {
        isCompleted = true;
        await new Promise(resolve => setTimeout(resolve, 100));
        onFinish?.();
      }
    };

    const processText = async (text) => {
      try {
        buffer += text;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          
          if (line.trim() === 'data: [DONE]') {
            console.log('[SSE Debug] Stream completion signal received');
            await markAsCompleted();
            return;
          }

          try {
            const jsonStr = line.startsWith('data:') ? line.slice(5) : line;
            const data = JSON.parse(jsonStr);
            if (data.error) {
              throw new Error(data.error);
            }
            onMessage?.(data);
          } catch (error) {
            console.error('解析SSE消息失败:', error, line);
            onError?.(new Error('消息解析失败: ' + error.message));
            return;
          }
        }
      } catch (error) {
        console.error('处理SSE流错误:', error);
        onError?.(error);
      }
    };

    const pump = async () => {
      try {
        const { value, done } = await reader.read();
        if (done) {
          console.log('[SSE Debug] Stream naturally completed');
          await markAsCompleted();
          return;
        }
        await processText(decoder.decode(value, { stream: true }));
        return pump();
      } catch (error) {
        console.error('SSE流读取错误:', error);
        onError?.(error);
      }
    };

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

// 知识库相关API
export const createKnowledgeBase = async (data) => {
  try {
    const response = await apiClient.post('/knowledge-bases', {
      name: data.name
    });
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

export const getKnowledgeBases = async (params) => {
  try {
    const response = await apiClient.get('/knowledge-bases', {
      params: {
        keyword: params.keyword,
        page: params.page
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
    throw error;
  }
};

export const getMyKnowledgeBases = async (params) => {
  try {
    const response = await apiClient.get('/knowledge-bases/my', {
      params: {
        keyword: params.keyword,
        page: params.page
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my knowledge bases:', error);
    throw error;
  }
};

export const updateKnowledgeBase = async (data) => {
  try {
    const response = await apiClient.put(`/knowledge-bases/${data.id}`, {
      name: data.name
    });
    return response.data;
  } catch (error) {
    console.error('Error updating knowledge base:', {
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
      throw new Error('修改知识库失败，请重试');
    }
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
export const getDocuments = async (page = 0, size = 20, params = {}) => {
  try {
    const response = await apiClient.get('/documents', {
      params: { page, size, ...params }
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
    console.log('Upload API response:', response.data);
    
    // 正确提取 API 返回的数据结构
    const responseData = response.data.data || {};
    return {
      results: responseData.results || [],
      errors: responseData.errors || []
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

// 获取单个文档详情
export const getDocument = async (id) => {
  try {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('获取文档详情失败:', {
      error,
      errorMessage: error.message,
      errorResponse: error.response?.data,
      errorStack: error.stack
    });
    throw error;
  }
};

// 文档分类常量
export const DocumentCategory = {
  SCIENCE_TECH: "科学技术",
  EDUCATION: "教育学习",
  LIFE_ENCYCLOPEDIA: "生活百科",
  PERSONAL_GROWTH: "个人成长",
  CHILDREN_EDUCATION: "儿童教育",
  NOVEL: "小说",
  COMPUTER: "计算机",
  BIOGRAPHY: "人物传记",
  FINANCE: "经济理财",
  OTHER: "其他"
};

// 文档发布状态常量
export const PublishStatus = {
  UNPUBLISHED: "未发布",
  PUBLISHED: "已发布"
};

// 更新文档信息
export const updateDocument = async (documentId, data) => {
  try {
    // 如果传入的是FormData对象，直接使用
    if (data instanceof FormData) {
      const response = await apiClient.put(`/documents/${documentId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    }

    // 否则构建FormData
    const formData = new FormData();
    if (data.cover) {
      formData.append('cover', data.cover);
    }
    if (data.category) {
      formData.append('category', data.category);
    }
    if (data.author) {
      formData.append('author', data.author);
    }
    if (data.fileName) {
      formData.append('fileName', data.fileName);
    }
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await apiClient.put(`/documents/${documentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('更新文档信息失败:', {
      error,
      errorMessage: error.message,
      errorResponse: error.response?.data,
      errorStack: error.stack
    });
    throw error;
  }
};

// 更新文档发布状态
export const updateDocumentPublishStatus = async (documentId, status) => {
  try {
    const response = await apiClient.put(`/documents/${documentId}/publish-status`, null, {
      params: { status }
    });
    return response.data;
  } catch (error) {
    console.error('更新文档发布状态失败:', {
      error,
      errorMessage: error.message,
      errorResponse: error.response?.data,
      errorStack: error.stack
    });
    throw error;
  }
};

// 增加文档学习人数
export const incrementDocumentLearnerCount = async (documentId) => {
  try {
    const response = await apiClient.post(`/documents/${documentId}/increment-learner`);
    return response.data;
  } catch (error) {
    console.error('增加文档学习人数失败:', {
      error,
      errorMessage: error.message,
      errorResponse: error.response?.data,
      errorStack: error.stack
    });
    throw error;
  }
};

// 解读相关API
export const generateInterpretation = async (docId) => {
  try {
    const response = await apiClient.post(`/publish/docs/${docId}/interpretation/generate`);
    return response.data;
  } catch (error) {
    console.error('生成解读内容失败:', error);
    throw error;
  }
};

export const getInterpretation = async (docId) => {
  try {
    const response = await apiClient.get(`/publish/docs/${docId}/interpretation`);
    return response.data;
  } catch (error) {
    console.error('获取解读内容失败:', error);
    throw error;
  }
};

// 脑图相关API
export const generateMindmap = async (docId) => {
  try {
    const response = await apiClient.post(`/publish/docs/${docId}/mindmap/generate`);
    return response.data;
  } catch (error) {
    console.error('生成脑图失败:', error);
    throw error;
  }
};

export const getMindmap = async (docId) => {
  try {
    const response = await apiClient.get(`/publish/docs/${docId}/mindmap`);
    return response.data;
  } catch (error) {
    console.error('获取脑图失败:', error);
    throw error;
  }
};

// 测试题相关API
export const generateQuiz = async (docId) => {
  try {
    const response = await apiClient.post(`/publish/docs/${docId}/quiz/generate`);
    return response.data;
  } catch (error) {
    console.error('生成测试题失败:', error);
    throw error;
  }
};

export const getQuiz = async (docId) => {
  try {
    const response = await apiClient.get(`/publish/docs/${docId}/quiz`);
    return response.data;
  } catch (error) {
    console.error('获取测试题失败:', error);
    throw error;
  }
};

// 音频相关API
export const synthesizeAudio = async (docId) => {
  try {
    const response = await apiClient.post(`/documents/${docId}/audio/synthesize`);
    return response.data;
  } catch (error) {
    console.error('音频合成失败:', error);
    throw error;
  }
};

export const getAudioUrl = async (docId) => {
  try {
    const response = await apiClient.get(`/documents/${docId}/audio`);
    return response.data;
  } catch (error) {
    console.error('获取音频URL失败:', error);
    throw error;
  }
};

export const getAudioStatus = async (docId) => {
  try {
    const response = await apiClient.get(`/documents/${docId}/audio/status`);
    return response.data;
  } catch (error) {
    console.error('检查音频状态失败:', error);
    throw error;
  }
};

// 知识库搜索
export const searchKnowledgeBase = async (knowledgeBaseId, query, limit = 10, threshold = 0.7) => {
  try {
    const response = await apiClient.post('/search', {
      query: query,
      knowledgeBaseId: knowledgeBaseId,
      limit: limit,
      similarityThreshold: threshold
    });
    return response.data;
  } catch (error) {
    console.error('知识库搜索失败:', error);
    throw error;
  }
};

// 文档搜索
export const searchDocument = async (documentId, query, limit = 10, threshold = 0.7) => {
  try {
    const response = await apiClient.post('/search', {
      query: query,
      documentId: documentId,
      limit: limit,
      similarityThreshold: threshold
    });
    return response.data;
  } catch (error) {
    console.error('文档搜索失败:', error);
    throw error;
  }
};

// 获取最近使用的提问对象
export const getRecentQuestionTargets = async (limit = 10) => {
  try {
    const response = await apiClient.get(`/chats/recent-targets?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error getting recent question targets:', error);
    throw error;
  }
};

export default apiClient;
