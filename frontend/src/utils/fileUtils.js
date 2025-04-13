// 文件类型和大小验证工具

export const FILE_TYPES = {
  IMAGE: {
    name: '图片',
    accept: '.jpg,.jpeg,.png,.gif,.webp',
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    icon: 'image',
    tooltip: '支持jpg/jpeg/png/gif/webp格式，最大10MB'
  },
  VIDEO: {
    name: '视频',
    accept: '.mp4,.webm,.avi',
    mimeTypes: ['video/mp4', 'video/webm', 'video/avi'],
    maxSize: 100 * 1024 * 1024, // 100MB
    icon: 'video',
    tooltip: '最多10个，最大100MB'
  },
  AUDIO: {
    name: '音频',
    accept: '.mp3,.wav,.ogg',
    mimeTypes: ['audio/mp3', 'audio/wav', 'audio/ogg'],
    maxSize: 100 * 1024 * 1024, // 100MB
    icon: 'microphone',
    tooltip: '最多10个，最大100MB'
  },
  FILE: {
    name: '文件',
    accept: '.pdf,.doc,.docx,.txt,.zip,.rar',
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    icon: 'file',
    tooltip: '最多10个，最大100MB'
  }
};

export const FILE_CONSTRAINTS = {
  maxCount: 10  // 所有类型通用的最大文件数
};

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {string} type - 文件类型（IMAGE/VIDEO/AUDIO/FILE）
 * @returns {boolean} 是否为有效类型
 */
export const validateFileType = (file, type) => {
  const fileType = FILE_TYPES[type];
  if (!fileType) return false;
  return fileType.mimeTypes.includes(file.type);
};

/**
 * 验证文件大小
 * @param {File} file - 文件对象
 * @param {string} type - 文件类型（IMAGE/VIDEO/AUDIO/FILE）
 * @returns {boolean} 是否在允许的大小范围内
 */
export const validateFileSize = (file, type) => {
  const fileType = FILE_TYPES[type];
  if (!fileType) return false;
  return file.size <= fileType.maxSize;
};

/**
 * 获取文件类型对应的图标
 * @param {string} type - 文件类型（IMAGE/VIDEO/AUDIO/FILE）
 * @returns {string} Font Awesome图标名称
 */
export const getIconByType = (type) => {
  const fileType = FILE_TYPES[type];
  return fileType ? fileType.icon : 'file';
};

/**
 * 获取文件类型对应的接受类型字符串
 * @param {string} type - 文件类型（IMAGE/VIDEO/AUDIO/FILE）
 * @returns {string} accept属性值
 */
export const getAcceptByType = (type) => {
  const fileType = FILE_TYPES[type];
  return fileType ? fileType.accept : '';
};

/**
 * 获取文件类型的工具提示文本
 * @param {string} type - 文件类型（IMAGE/VIDEO/AUDIO/FILE）
 * @returns {string} 工具提示文本
 */
export const getTooltipByType = (type) => {
  const fileType = FILE_TYPES[type];
  return fileType ? fileType.tooltip : '';
};

/**
 * 格式化文件大小
 * @param {number} size - 文件大小（字节）
 * @returns {string} 格式化后的大小
 */
export const formatFileSize = (size) => {
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * 获取文件图标
 * @param {string} mimeType - 文件MIME类型
 * @returns {string} Font Awesome图标名称
 */
export const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'microphone';
  if (mimeType === 'application/pdf') return 'file-pdf';
  if (mimeType === 'application/msword' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'file-word';
  if (mimeType === 'application/zip' || mimeType === 'application/x-rar-compressed') return 'file-archive';
  return 'file';
};
