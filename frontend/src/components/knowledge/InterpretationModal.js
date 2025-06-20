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
  updateQuiz
} from '../../services/api';
import MindmapViewer from './MindmapViewer';
import QuizViewer from './QuizViewer';
import InterpretationViewer from './InterpretationViewer';
import AudioPlayer from '../common/AudioPlayer';
import ProgressBar from '../common/ProgressBar';
import { ToastManager } from '../common/Toast';

function InterpretationModal({ isOpen, onClose, fileName, documentId }) {
  const [currentStep, setCurrentStep] = useState(1);
  
  const steps = [
    { number: 1, text: '生成解读' },
    { number: 2, text: '生成音频' },
    { number: 3, text: '生成脑图' },
    { number: 4, text: '生成测试' }
  ];

  const [progress, setProgress] = useState({
    interpretation: 0,  // 步骤1：解读进度
    audio: 0,          // 步骤2：音频进度
    mindmap: 0,        // 步骤3：脑图进度
    quiz: 0           // 步骤4：测试进度
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
  const [editType, setEditType] = useState(''); // 'interpretation', 'mindmap', 'quiz'

  // 音频删除相关状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 监听弹窗打开状态，重置所有状态
  useEffect(() => {
    if (isOpen) {
      // 重置所有状态
      setCurrentStep(1);
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
        // 自动开始第一步：检查并加载现有解读内容，如果没有则开始生成
        setTimeout(async () => {
          const hasExisting = await loadExistingInterpretation();
          if (!hasExisting) {
            startInterpretation();
          }
        }, 100);
      }
    }
  }, [isOpen, documentId]);

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

  // 删除音频的处理函数
  const handleDeleteAudio = async () => {
    try {
      setIsDeleting(true);
      const response = await deleteAudio(documentId);
      
      if (response.code === 200) {
        ToastManager.success('音频删除成功');
        setShowDeleteConfirm(false);
        // 重置音频相关状态
        setHasAudio(false);
        setAudioUrl('');
        setProgress(prev => ({ ...prev, audio: 0 }));
      } else {
        throw new Error(response.message || '删除失败');
      }
    } catch (error) {
      ToastManager.error('删除音频失败: ' + error.message);
      console.error('删除音频失败:', error);
    } finally {
      setIsDeleting(false);
    }
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
        setInterpretation(response.data);
        setProgress(prev => ({ ...prev, interpretation: 100 }));
        setInterpretationLoading(false);
        return true;
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
        setMindmap(response.data);
        setProgress(prev => ({ ...prev, mindmap: 100 }));
        setMindmapLoading(false);
        return true;
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
        setQuiz(response.data);
        setProgress(prev => ({ ...prev, quiz: 100 }));
        setQuizLoading(false);
        return true;
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
      if (response.code === 200 && response.data.hasAudio) {
        setHasAudio(true);
        setAudioUrl(response.data.audioUrl);
        setProgress(prev => ({ ...prev, audio: 100 }));
        setAudioLoading(false);
        return true;
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
        setInterpretation(response.data);
        setProgress(prev => ({ ...prev, interpretation: 100 }));
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
        setMindmap(response.data);
        setProgress(prev => ({ ...prev, mindmap: 100 }));
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
      if (response.code === 200 && response.data.hasAudio) {
        setHasAudio(true);
        setAudioUrl(response.data.audioUrl);
        setProgress(prev => ({ ...prev, audio: 100 }));
        return true;
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
        setQuiz(response.data);
        setProgress(prev => ({ ...prev, quiz: 100 }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('加载测试题内容失败:', error);
      return false;
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // 第1步：生成解读 -> 第2步：生成音频
      setCurrentStep(currentStep + 1);
      const hasExisting = await loadExistingAudio();
      if (!hasExisting) {
        // 音频是可选的，如果没有解读内容则不自动生成
        if (interpretation) {
          startAudio();
        }
      }
    } else if (currentStep === 2) {
      // 第2步：生成音频 -> 第3步：生成脑图
      setCurrentStep(currentStep + 1);
      const hasExisting = await loadExistingMindmap();
      if (!hasExisting) {
        startMindmap();
      }
    } else if (currentStep === 3) {
      // 第3步：生成脑图 -> 第4步：生成测试
      setCurrentStep(currentStep + 1);
      const hasExisting = await loadExistingQuiz();
      if (!hasExisting) {
        startQuiz();
      }
    } else if (currentStep === 4) {
      // 第4步：生成测试 - 完成并关闭
      ToastManager.success('智能解读完成');
      onClose();
    }
  };

  const renderStepIndicators = () => (
    <div className="p-4 bg-gray-50">
      <div className="grid grid-cols-4 gap-4">
        {steps.map((step) => (
          <div key={step.number} className="flex-1">
            <div 
              className={`h-12 flex items-center rounded-md shadow-sm transition-all duration-200 ease-in-out
                ${currentStep >= step.number ? 'bg-indigo-400' : 'bg-gray-100'}`}
            >
              <div className={`flex items-center px-4 
                ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`}>
                <span className="font-medium mr-3">{step.number}</span>
                <span className="text-sm whitespace-nowrap">{step.text}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {interpretationLoading ? (
              <ProgressBar
                progress={progress.interpretation}
                title="生成解读中"
                description="系统正在生成解读内容，请稍候..."
                icon="M13 10V3L4 14h7v7l9-11h-7z"
              />
            ) : interpretation ? (
              <div className="space-y-4">
                <InterpretationViewer content={interpretation} />
                {/* 操作按钮 */}
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => openEditModal('interpretation', interpretation)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    编辑
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">暂无解读内容</p>
                <button
                  onClick={startInterpretation}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  开始生成
                </button>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            {/* 检查是否有解读内容 */}
            {!interpretation ? (
              <div className="text-center py-8">
                <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                <h3 className="text-xl font-medium text-gray-700 mb-2">图书文字解读还未完成</h3>
                <p className="text-gray-500">暂不能生成解读音频，请先完成第一步的文字解读</p>
              </div>
            ) : audioLoading ? (
              <ProgressBar
                progress={progress.audio}
                title="生成音频中"
                description="系统正在生成音频内容，请稍候..."
                icon="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 10H3a1 1 0 00-1 1v2a1 1 0 001 1h3l3.928 2.321A1 1 0 0011 16V8a1 1 0 00-1.072-.928L6 10z"
              />
            ) : hasAudio && audioUrl ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                  <AudioPlayer audioUrl={audioUrl} bookTitle={fileName} bookId={documentId} />
                </div>
                {/* 操作按钮 */}
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? '删除中...' : '删除音频'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-microphone text-4xl text-blue-500 mb-4"></i>
                <p className="text-gray-500 mb-4">可以为解读内容生成音频</p>
                <button
                  onClick={startAudio}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  开始生成
                </button>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            {mindmapLoading ? (
              <ProgressBar
                progress={progress.mindmap}
                title="生成脑图中"
                description="系统正在生成脑图内容，请稍候..."
                icon="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            ) : mindmap ? (
              <div className="space-y-4">
                <MindmapViewer content={mindmap} height="60vh" />
                {/* 操作按钮 */}
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => openEditModal('mindmap', mindmap)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    编辑
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">暂无脑图内容</p>
                <button
                  onClick={startMindmap}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  开始生成
                </button>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            {quizLoading ? (
              <ProgressBar
                progress={progress.quiz}
                title="生成测试题中"
                description="系统正在生成测试题内容，请稍候..."
                icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            ) : quiz ? (
              <div className="space-y-4">
                <QuizViewer questions={quiz} />
                {/* 操作按钮 */}
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => openEditModal('quiz', quiz)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    编辑
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">暂无测试题内容</p>
                <button
                  onClick={startQuiz}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  开始生成
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  const footer = (
    <div className="flex justify-end gap-2">
      {currentStep > 1 && (
        <button
          onClick={() => setCurrentStep(currentStep - 1)}
          className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          上一步
        </button>
      )}
      <button
        onClick={handleNextStep}
        className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {currentStep === 4 ? '完成' : '下一步'}
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
        {renderStepIndicators()}
        <div className="p-6">
          {renderStepContent()}
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

      {/* 删除音频确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">确认删除音频</h3>
              <p className="text-sm text-gray-500 mb-6">
                删除后将无法恢复，您确定要删除这个音频文件吗？
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteAudio}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? '删除中...' : '确认删除'}
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
