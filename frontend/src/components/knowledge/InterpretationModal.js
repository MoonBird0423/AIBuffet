import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { 
  getDocument, 
  generateInterpretation, 
  getInterpretation,
  synthesizeMultiRoleAudio,
  getAudioStatus,
  deleteAudio,
  generateMindmap,
  getMindmap,
  generateQuiz,
  getQuiz,
  updateInterpretation,
  updateMindmap,
  updateQuiz,
  deleteInterpretation,
  deleteMindmap,
  deleteQuiz
} from '../../services/api';
import MindmapViewer from './MindmapViewer';
import QuizViewer from './QuizViewer';
import InterpretationViewer from './InterpretationViewer';
import AudioPlayer from '../common/AudioPlayer';
import ProgressBar from '../common/ProgressBar';
import { ToastManager } from '../common/Toast';

function InterpretationModal({ isOpen, onClose, fileName, documentId }) {
  const [activeTab, setActiveTab] = useState('interpretation');
  
  const tabs = [
    { key: 'interpretation', label: '生成解读', icon: '📖' },
    { key: 'audio', label: '生成音频', icon: '🎵' },
    { key: 'mindmap', label: '生成脑图', icon: '🧠' },
    { key: 'quiz', label: '生成测试', icon: '📝' }
  ];

  const [progress, setProgress] = useState({
    interpretation: 0,
    audio: 0,
    mindmap: 0,
    quiz: 0
  });

  const [interpretation, setInterpretation] = useState('');
  const [interpretationLoading, setInterpretationLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioLoading, setAudioLoading] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [mindmap, setMindmap] = useState('');
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [quiz, setQuiz] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);

  // 编辑弹窗状态
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState('');

  // 删除确认弹窗状态
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: '', // 'interpretation', 'mindmap', 'quiz', 'audio'
    loading: false
  });

  // 监听弹窗打开状态，重置所有状态
  useEffect(() => {
    if (isOpen) {
      // 重置所有状态
      setActiveTab('interpretation');
      setProgress({
        interpretation: 0,
        audio: 0,
        mindmap: 0,
        quiz: 0
      });
      setInterpretation('');
      setInterpretationLoading(false);
      setAudioUrl('');
      setAudioLoading(false);
      setHasAudio(false);
      setMindmap('');
      setMindmapLoading(false);
      setQuiz('');
      setQuizLoading(false);
      
      if (documentId) {
        // 初始加载解读内容
        loadExistingInterpretation();
      }
    }
  }, [isOpen, documentId]);

  // 切换选项卡时加载对应内容
  useEffect(() => {
    if (!isOpen || !documentId) return;

    const loadTabContent = async () => {
      switch (activeTab) {
        case 'interpretation':
          await loadExistingInterpretation();
          break;
        case 'audio':
          await loadExistingAudio();
          break;
        case 'mindmap':
          await loadExistingMindmap();
          break;
        case 'quiz':
          await loadExistingQuiz();
          break;
      }
    };

    loadTabContent();
  }, [activeTab, isOpen, documentId]);

  // 重新生成解读内容
  const regenerateInterpretation = async () => {
    setInterpretation('');
    setInterpretationLoading(false);
    setProgress(prev => ({ ...prev, interpretation: 0 }));
    await startInterpretation();
  };

  // 重新生成脑图内容
  const regenerateMindmap = async () => {
    setMindmap('');
    setMindmapLoading(false);
    setProgress(prev => ({ ...prev, mindmap: 0 }));
    await startMindmap();
  };

  // 重新生成测试题内容
  const regenerateQuiz = async () => {
    setQuiz('');
    setQuizLoading(false);
    setProgress(prev => ({ ...prev, quiz: 0 }));
    await startQuiz();
  };

  // 打开编辑弹窗
  const openEditModal = (type, content) => {
    setEditType(type);
    setEditContent(content);
    setEditModalOpen(true);
  };

  // 保存编辑内容
  const saveEditContent = async () => {
    try {
      // 根据编辑类型调用相应的更新API
      if (editType === 'interpretation') {
        await updateInterpretation(documentId, editContent);
        setInterpretation(editContent);
      } else if (editType === 'mindmap') {
        await updateMindmap(documentId, editContent);
        setMindmap(editContent);
      } else if (editType === 'quiz') {
        await updateQuiz(documentId, editContent);
        setQuiz(editContent);
      }
      
      setEditModalOpen(false);
      ToastManager.success('内容已保存');
    } catch (error) {
      ToastManager.error('保存失败：' + (error.response?.data?.message || error.message));
    }
  };

  // 统一的删除处理函数
  const handleDelete = async () => {
    try {
      setDeleteConfirm(prev => ({ ...prev, loading: true }));
      
      const { type } = deleteConfirm;
      let response;
      
      if (type === 'interpretation') {
        response = await deleteInterpretation(documentId);
        setInterpretation('');
        setProgress(prev => ({ ...prev, interpretation: 0 }));
        ToastManager.success('解读内容删除成功');
      } else if (type === 'mindmap') {
        response = await deleteMindmap(documentId);
        setMindmap('');
        setProgress(prev => ({ ...prev, mindmap: 0 }));
        ToastManager.success('脑图内容删除成功');
      } else if (type === 'quiz') {
        response = await deleteQuiz(documentId);
        setQuiz('');
        setProgress(prev => ({ ...prev, quiz: 0 }));
        ToastManager.success('测试题内容删除成功');
      } else if (type === 'audio') {
        response = await deleteAudio(documentId);
        if (response.code === 200) {
          setHasAudio(false);
          setAudioUrl('');
          setProgress(prev => ({ ...prev, audio: 0 }));
          ToastManager.success('音频删除成功');
        } else {
          throw new Error(response.message || '删除失败');
        }
      }
      
      setDeleteConfirm({ open: false, type: '', loading: false });
    } catch (error) {
      ToastManager.error('删除失败：' + (error.response?.data?.message || error.message));
      console.error('删除失败:', error);
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  // 打开删除确认弹窗
  const openDeleteConfirm = (type) => {
    setDeleteConfirm({ open: true, type, loading: false });
  };

  // 生成解读内容
  const startInterpretation = async () => {
    if (interpretationLoading) return;
    
    setInterpretationLoading(true);
    setProgress(prev => ({ ...prev, interpretation: 0 }));

    try {
      // 启动生成
      await generateInterpretation(documentId);

      // 开始轮询进度
      const pollInterval = setInterval(async () => {
        const hasContent = await pollInterpretation();
        if (hasContent) {
          clearInterval(pollInterval);
        } else {
          // 更新进度条
          setProgress(prev => ({
            ...prev,
            interpretation: Math.min(prev.interpretation + 5, 95)
          }));
        }
      }, 2000);
    } catch (error) {
      console.error('生成解读失败:', error);
      setInterpretationLoading(false);
      ToastManager.error('生成解读失败，请重试');
    }
  };

  // 轮询解读内容
  const pollInterpretation = async () => {
    try {
      const response = await getInterpretation(documentId);
      if (response.data) {
        // 处理新的响应结构
        if (response.data.content !== undefined) {
          // 新的API响应格式
          if (response.data.interpretationStatus === '结束') {
            setInterpretation(response.data.content || '');
            setProgress(prev => ({ ...prev, interpretation: 100 }));
            setInterpretationLoading(false);
            return true;
          }
        } else {
          // 兼容旧的API响应格式
          setInterpretation(response.data);
          setProgress(prev => ({ ...prev, interpretation: 100 }));
          setInterpretationLoading(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('获取解读失败:', error);
      return false;
    }
  };

  // 轮询脑图内容
  const pollMindmap = async () => {
    try {
      const response = await getMindmap(documentId);
      if (response.data) {
        // 处理新的响应结构
        if (response.data.content !== undefined) {
          // 新的API响应格式
          if (response.data.generationStatus === '结束') {
            setMindmap(response.data.content || '');
            setProgress(prev => ({ ...prev, mindmap: 100 }));
            setMindmapLoading(false);
            return true;
          }
        } else {
          // 兼容旧的API响应格式
          setMindmap(response.data);
          setProgress(prev => ({ ...prev, mindmap: 100 }));
          setMindmapLoading(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('获取脑图失败:', error);
      return false;
    }
  };

  // 轮询测试题内容
  const pollQuiz = async () => {
    try {
      const response = await getQuiz(documentId);
      if (response.data) {
        // 处理新的响应结构
        if (response.data.questions !== undefined) {
          // 新的API响应格式
          if (response.data.generationStatus === '结束') {
            setQuiz(response.data.questions || '');
            setProgress(prev => ({ ...prev, quiz: 100 }));
            setQuizLoading(false);
            return true;
          }
        } else {
          // 兼容旧的API响应格式
          setQuiz(response.data);
          setProgress(prev => ({ ...prev, quiz: 100 }));
          setQuizLoading(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('获取测试题失败:', error);
      return false;
    }
  };

  // 生成脑图内容
  const startMindmap = async () => {
    if (mindmapLoading) return;
    
    setMindmapLoading(true);
    setProgress(prev => ({ ...prev, mindmap: 0 }));

    try {
      await generateMindmap(documentId);

      const pollInterval = setInterval(async () => {
        const hasContent = await pollMindmap();
        if (hasContent) {
          clearInterval(pollInterval);
        } else {
          setProgress(prev => ({
            ...prev,
            mindmap: Math.min(prev.mindmap + 5, 95)
          }));
        }
      }, 2000);
    } catch (error) {
      console.error('生成脑图失败:', error);
      setMindmapLoading(false);
      ToastManager.error('生成脑图失败，请重试');
    }
  };

  // 生成音频内容
  const startAudio = async () => {
    if (audioLoading) return;
    
    setAudioLoading(true);
    setProgress(prev => ({ ...prev, audio: 0 }));

    try {
      await synthesizeMultiRoleAudio(documentId);

      const pollInterval = setInterval(async () => {
        const hasContent = await pollAudio();
        if (hasContent) {
          clearInterval(pollInterval);
        } else {
          setProgress(prev => ({
            ...prev,
            audio: Math.min(prev.audio + 5, 95)
          }));
        }
      }, 2000);
    } catch (error) {
      console.error('生成多角色音频失败:', error);
      setAudioLoading(false);
      ToastManager.error('生成多角色音频失败，请重试');
    }
  };

  // 轮询音频内容
  const pollAudio = async () => {
    try {
      const response = await getAudioStatus(documentId);
      if (response.code === 200) {
        // 检查音频状态
        if (response.data.audioStatus === '结束' && response.data.hasAudio) {
          setHasAudio(true);
          setAudioUrl(response.data.audioUrl);
          setProgress(prev => ({ ...prev, audio: 100 }));
          setAudioLoading(false);
          return true;
        } else if (response.data.audioStatus === '结束' && !response.data.hasAudio) {
          // 生成结束但没有音频，可能是错误
          setAudioLoading(false);
          setProgress(prev => ({ ...prev, audio: 0 }));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('获取音频失败:', error);
      return false;
    }
  };

  // 生成测试题内容
  const startQuiz = async () => {
    if (quizLoading) return;
    
    setQuizLoading(true);
    setProgress(prev => ({ ...prev, quiz: 0 }));

    try {
      await generateQuiz(documentId);

      const pollInterval = setInterval(async () => {
        const hasContent = await pollQuiz();
        if (hasContent) {
          clearInterval(pollInterval);
        } else {
          setProgress(prev => ({
            ...prev,
            quiz: Math.min(prev.quiz + 5, 95)
          }));
        }
      }, 2000);
    } catch (error) {
      console.error('生成测试题失败:', error);
      setQuizLoading(false);
      ToastManager.error('生成测试题失败，请重试');
    }
  };

  // 检查并加载现有内容的辅助函数
  const loadExistingInterpretation = async () => {
    try {
      const response = await getInterpretation(documentId);
      if (response.data) {
        // 处理新的响应结构（包含状态信息）
        if (response.data.content !== undefined) {
          // 新的API响应格式
          setInterpretation(response.data.content || '');
          
          // 检查解读生成状态
          if (response.data.interpretationStatus === '生成中') {
            setInterpretationLoading(true);
            // 开始轮询
            const pollInterval = setInterval(async () => {
              const hasContent = await pollInterpretation();
              if (hasContent) {
                clearInterval(pollInterval);
              } else {
                setProgress(prev => ({
                  ...prev,
                  interpretation: Math.min(prev.interpretation + 5, 95)
                }));
              }
            }, 2000);
          } else if (response.data.interpretationStatus === '结束') {
            setProgress(prev => ({ ...prev, interpretation: 100 }));
          }
        } else {
          // 兼容旧的API响应格式
          setInterpretation(response.data);
          setProgress(prev => ({ ...prev, interpretation: 100 }));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('加载解读内容失败:', error);
      return false;
    }
  };

  const loadExistingMindmap = async () => {
    try {
      const response = await getMindmap(documentId);
      if (response.data) {
        // 处理新的响应结构（包含状态信息）
        if (response.data.content !== undefined) {
          // 新的API响应格式
          setMindmap(response.data.content || '');
          
          // 检查脑图生成状态
          if (response.data.generationStatus === '生成中') {
            setMindmapLoading(true);
            // 开始轮询
            const pollInterval = setInterval(async () => {
              const hasContent = await pollMindmap();
              if (hasContent) {
                clearInterval(pollInterval);
              } else {
                setProgress(prev => ({
                  ...prev,
                  mindmap: Math.min(prev.mindmap + 5, 95)
                }));
              }
            }, 2000);
          } else if (response.data.generationStatus === '结束') {
            setProgress(prev => ({ ...prev, mindmap: 100 }));
          }
        } else {
          // 兼容旧的API响应格式
          setMindmap(response.data);
          setProgress(prev => ({ ...prev, mindmap: 100 }));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('加载脑图内容失败:', error);
      return false;
    }
  };

  const loadExistingAudio = async () => {
    try {
      const response = await getAudioStatus(documentId);
      if (response.code === 200) {
        // 检查音频状态
        if (response.data.audioStatus === '生成中') {
          setAudioLoading(true);
          // 开始轮询
          const pollInterval = setInterval(async () => {
            const hasContent = await pollAudio();
            if (hasContent) {
              clearInterval(pollInterval);
            } else {
              setProgress(prev => ({
                ...prev,
                audio: Math.min(prev.audio + 5, 95)
              }));
            }
          }, 2000);
        } else if (response.data.hasAudio) {
          setHasAudio(true);
          setAudioUrl(response.data.audioUrl);
          setProgress(prev => ({ ...prev, audio: 100 }));
        }
        return response.data.hasAudio || response.data.audioStatus === '生成中';
      }
      return false;
    } catch (error) {
      console.error('加载音频内容失败:', error);
      return false;
    }
  };

  const loadExistingQuiz = async () => {
    try {
      const response = await getQuiz(documentId);
      if (response.data) {
        // 处理新的响应结构（包含状态信息）
        if (response.data.questions !== undefined) {
          // 新的API响应格式
          setQuiz(response.data.questions || '');
          
          // 检查测试题生成状态
          if (response.data.generationStatus === '生成中') {
            setQuizLoading(true);
            // 开始轮询
            const pollInterval = setInterval(async () => {
              const hasContent = await pollQuiz();
              if (hasContent) {
                clearInterval(pollInterval);
              } else {
                setProgress(prev => ({
                  ...prev,
                  quiz: Math.min(prev.quiz + 5, 95)
                }));
              }
            }, 2000);
          } else if (response.data.generationStatus === '结束') {
            setProgress(prev => ({ ...prev, quiz: 100 }));
          }
        } else {
          // 兼容旧的API响应格式
          setQuiz(response.data);
          setProgress(prev => ({ ...prev, quiz: 100 }));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('加载测试题内容失败:', error);
      return false;
    }
  };

  // 示例图片组件
  const ExampleImageWithButton = ({ imageSrc, onGenerate, title, loading }) => (
    <div className="relative w-full h-96 rounded-xl overflow-hidden group">
      <img 
        src={imageSrc} 
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
        <button
          onClick={onGenerate}
          disabled={loading}
          className="px-8 py-4 bg-white bg-opacity-90 text-gray-800 font-medium rounded-lg 
                   hover:bg-opacity-100 transition-all duration-200 transform hover:scale-105
                   disabled:opacity-50 disabled:transform-none shadow-lg"
        >
          {loading ? '生成中...' : '立即生成'}
        </button>
      </div>
    </div>
  );

  // 渲染选项卡
  const renderTabs = () => (
    <div className="border-b border-gray-200 bg-gray-50">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200
              ${activeTab === tab.key
                ? 'border-b-2 border-indigo-500 text-indigo-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );

  // 渲染选项卡内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'interpretation':
        return (
          <div className="space-y-6">
            {interpretationLoading ? (
              <ProgressBar
                progress={progress.interpretation}
                title="生成解读中"
                description="生成过程可能较长，你可以关闭窗口稍后查看结果"
                icon="M13 10V3L4 14h7v7l9-11h-7z"
              />
            ) : interpretation ? (
              <div className="space-y-4">
                <InterpretationViewer content={interpretation} />
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => openEditModal('interpretation', interpretation)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => openDeleteConfirm('interpretation')}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ) : (
              <ExampleImageWithButton
                imageSrc="/语音解读.png"
                onGenerate={startInterpretation}
                title="生成解读"
                loading={interpretationLoading}
              />
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-6">
            {!interpretation ? (
              <div className="text-center py-12">
                <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">图书文字解读还未完成</h3>
                <p className="text-gray-500 mb-4">暂不能生成解读音频，请先完成解读内容</p>
                <button
                  onClick={() => setActiveTab('interpretation')}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  去生成解读
                </button>
              </div>
            ) : audioLoading ? (
              <ProgressBar
                progress={progress.audio}
                title="生成音频中"
                description="生成过程可能较长，你可以关闭窗口稍后查看结果"
                icon="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 10H3a1 1 0 00-1 1v2a1 1 0 001 1h3l3.928 2.321A1 1 0 0011 16V8a1 1 0 00-1.072-.928L6 10z"
              />
            ) : hasAudio && audioUrl ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                  <AudioPlayer audioUrl={audioUrl} bookTitle={fileName} bookId={documentId} />
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => openDeleteConfirm('audio')}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    删除音频
                  </button>
                </div>
              </div>
            ) : (
              <ExampleImageWithButton
                imageSrc="/语音解读.png"
                onGenerate={startAudio}
                title="生成音频"
                loading={audioLoading}
              />
            )}
          </div>
        );

      case 'mindmap':
        return (
          <div className="space-y-6">
            {mindmapLoading ? (
              <ProgressBar
                progress={progress.mindmap}
                title="生成脑图中"
                description="生成过程可能较长，你可以关闭窗口稍后查看结果"
                icon="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            ) : mindmap ? (
              <div className="space-y-4">
                <MindmapViewer content={mindmap} height="60vh" />
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => openEditModal('mindmap', mindmap)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => openDeleteConfirm('mindmap')}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ) : (
              <ExampleImageWithButton
                imageSrc="/知识脑图.png"
                onGenerate={startMindmap}
                title="生成脑图"
                loading={mindmapLoading}
              />
            )}
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-6">
            {quizLoading ? (
              <ProgressBar
                progress={progress.quiz}
                title="生成测试题中"
                description="生成过程可能较长，你可以关闭窗口稍后查看结果"
                icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            ) : quiz ? (
              <div className="space-y-4">
                <QuizViewer questions={quiz} />
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => openEditModal('quiz', quiz)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => openDeleteConfirm('quiz')}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ) : (
              <ExampleImageWithButton
                imageSrc="/知识测试.png"
                onGenerate={startQuiz}
                title="生成测试"
                loading={quizLoading}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const footer = (
    <div className="flex justify-end">
      <button
        onClick={onClose}
        className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        关闭
      </button>
    </div>
  );

  const editModalFooter = (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => setEditModalOpen(false)}
        className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        取消
      </button>
      <button
        onClick={saveEditContent}
        className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        保存
      </button>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="智能解读"
        footer={footer}
        width="5xl"
      >
        {renderTabs()}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </Modal>

      {/* 编辑内容弹窗 */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`编辑${editType === 'interpretation' ? '解读内容' : editType === 'mindmap' ? '脑图内容' : '测试题内容'}`}
        footer={editModalFooter}
        width="4xl"
      >
        <div className="space-y-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={20}
            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="请输入内容..."
          />
        </div>
      </Modal>

      {/* 统一删除确认弹窗 */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                确认删除{deleteConfirm.type === 'interpretation' ? '解读内容' : 
                         deleteConfirm.type === 'mindmap' ? '脑图内容' : 
                         deleteConfirm.type === 'quiz' ? '测试题内容' : '音频'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                删除后将无法恢复，您确定要删除这个{deleteConfirm.type === 'interpretation' ? '解读内容' : 
                                                 deleteConfirm.type === 'mindmap' ? '脑图内容' : 
                                                 deleteConfirm.type === 'quiz' ? '测试题内容' : '音频文件'}吗？
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setDeleteConfirm({ open: false, type: '', loading: false })}
                  disabled={deleteConfirm.loading}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirm.loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteConfirm.loading ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InterpretationModal;
