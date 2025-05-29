import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineBook, AiOutlineDatabase, AiOutlineArrowRight } from 'react-icons/ai';
import { getRecentQuestionTargets } from '../../services/api';

function ChatGuidance({ onTargetSelect }) {
  const navigate = useNavigate();
  const [recentTargets, setRecentTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecentTargets();
  }, []);

  const loadRecentTargets = async () => {
    try {
      setLoading(true);
      setError(null);
      const targets = await getRecentQuestionTargets(10);
      setRecentTargets(targets);
    } catch (err) {
      console.error('获取最近提问对象失败:', err);
      setError('获取推荐对象失败');
      // 设置一些默认的示例数据
      setRecentTargets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTargetClick = (target) => {
    onTargetSelect(target);
  };

  const handleGoToLibrary = () => {
    window.open('/library', '_blank');
  };

  const getTargetIcon = (type) => {
    return type === 'book' ? (
      <AiOutlineBook className="text-blue-600 mr-2" />
    ) : (
      <AiOutlineDatabase className="text-green-600 mr-2" />
    );
  };

  const getTargetTypeText = (type) => {
    return type === 'book' ? '图书' : '知识库';
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-4xl mx-auto">
        {/* 引导标题 */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            请选择想要提问的对象
          </h3>
          <p className="text-gray-600">
            选择一本图书或知识库开始您的智能对话
          </p>
        </div>

        {/* 最近使用的提问对象 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">加载推荐对象中...</span>
          </div>
        ) : error ? (
          <div className="py-8">
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={loadRecentTargets}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              重试
            </button>
          </div>
        ) : recentTargets.length > 0 ? (
          <div className="mb-8">
            <h4 className="text-lg font-medium text-gray-700 mb-4">
              最近使用的对象
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
              {recentTargets.map((target, index) => (
                <button
                  key={`${target.type}-${target.id}-${index}`}
                  onClick={() => handleTargetClick(target)}
                  className="group flex items-center bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    {getTargetIcon(target.type)}
                    <div className="flex-1 min-w-0 text-left">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2">
                        {getTargetTypeText(target.type)}
                      </span>
                      <span className="text-gray-800 font-medium block truncate">
                        {target.name}
                      </span>
                    </div>
                  </div>
                  <AiOutlineArrowRight className="text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8">
            <p className="text-gray-500 mb-4">
              暂无最近使用的对象，去图书馆发现更多内容吧
            </p>
          </div>
        )}

        {/* 前往图书馆按钮 */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={handleGoToLibrary}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <AiOutlineBook className="mr-2" />
            更多内容前往图书馆
            <AiOutlineArrowRight className="ml-2" />
          </button>
        </div>

        {/* 提示信息 */}
        <div className="mt-8 text-sm text-gray-500">
          <p>💡 选择对象后即可开始对话，AI 将基于您选择的内容进行回答</p>
        </div>
      </div>
    </div>
  );
}

export default ChatGuidance;
