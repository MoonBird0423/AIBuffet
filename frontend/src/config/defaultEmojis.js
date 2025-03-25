const defaultModelEmojis = {
  'GPT-4': '🤖',
  'Claude': '🧠',
  'Gemini': '💫',
  'Llama 2': '🦙',
  'default': '🤖'
};

export const getModelEmoji = (modelName, emoji) => {
  // 如果后端提供了emoji，优先使用后端的
  if (emoji) {
    return emoji;
  }
  
  // 否则查找默认emoji配置
  return defaultModelEmojis[modelName] || defaultModelEmojis.default;
};