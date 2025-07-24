// QuizJsonRenderer.js
import React, { useState } from 'react';
import Modal from '../common/Modal';

function isCorrect(user, answer) {
  if (!Array.isArray(user) || !Array.isArray(answer)) return false;
  if (user.length !== answer.length) return false;
  return user.every(a => answer.includes(a)) && answer.every(a => user.includes(a));
}

function QuizJsonRenderer({ content }) {
  let questions = [];
  let parseError = false;
  try {
    const parsed = JSON.parse(content);
    questions = Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    parseError = true;
  }

  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  if (parseError) {
    return <div className="text-red-500">题目数据格式错误</div>;
  }

  // 统计
  const stats = questions.reduce(
    (acc, q) => {
      const user = userAnswers[q.id] || [];
      if (!submitted) return acc;
      if (user.length === 0) acc.unanswered += 1;
      else if (isCorrect(user, q.answers)) acc.correct += 1;
      else acc.incorrect += 1;
      return acc;
    },
    { correct: 0, incorrect: 0, unanswered: 0 }
  );

  const handleChange = (qid, key, type) => {
    setUserAnswers(prev => {
      const prevAns = prev[qid] || [];
      if (type === 'single') {
        return { ...prev, [qid]: [key] };
      } else {
        // 多选
        if (prevAns.includes(key)) {
          return { ...prev, [qid]: prevAns.filter(k => k !== key) };
        } else {
          return { ...prev, [qid]: [...prevAns, key] };
        }
      }
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setShowResultModal(true);
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
    setShowAnalysis(false);
    setShowResultModal(false);
  };

  return (
    <div className="space-y-8">
      {questions.map((q, idx) => (
        <div key={q.id} className="bg-white rounded shadow p-6 border border-gray-200">
          <div className="font-semibold mb-4 text-xl">{`${q.id}. ${q.question}`}</div>
          <div className="space-y-3 mb-3">
            {q.options.map(opt => (
              <label key={opt.key} className="flex items-center space-x-3 cursor-pointer text-lg">
                {q.type === 'single' ? (
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={opt.key}
                    disabled={submitted}
                    checked={(userAnswers[q.id] || []).includes(opt.key)}
                    onChange={() => handleChange(q.id, opt.key, 'single')}
                  />
                ) : (
                  <input
                    type="checkbox"
                    name={`q_${q.id}_${opt.key}`}
                    value={opt.key}
                    disabled={submitted}
                    checked={(userAnswers[q.id] || []).includes(opt.key)}
                    onChange={() => handleChange(q.id, opt.key, 'multiple')}
                  />
                )}
                <span className="">{opt.key}. {opt.content}</span>
                {showAnalysis && (
                  <span className={
                    "ml-3 text-base " +
                    (q.analysis.find(a => a.key === opt.key)?.correct
                      ? "text-green-600"
                      : "text-red-500")
                  }>
                    {q.analysis.find(a => a.key === opt.key)?.correct ? "正确" : "错误"}
                  </span>
                )}
              </label>
            ))}
          </div>
          {showAnalysis && (
            <div className="mt-3 text-lg text-gray-700">
              <div className="font-medium mb-2">解析：</div>
              <ul className="list-disc pl-6">
                {q.analysis.map(a => (
                  <li key={a.key} className={a.correct ? "text-green-700" : "text-gray-700"}>
                    <span className="font-semibold">{a.key}：</span>
                    <span>{a.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-3">
        {!submitted && (
          <button
            className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            onClick={handleSubmit}
          >
            提交
          </button>
        )}
        {(submitted || showAnalysis) && (
          <button
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={handleReset}
          >
            重置
          </button>
        )}
      </div>
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="答题结果"
        width="lg"
        footer={
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              onClick={() => {
                setShowResultModal(false);
                setShowAnalysis(true);
              }}
            >
              查看解析
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              onClick={() => setShowResultModal(false)}
            >
              继续答题
            </button>
          </div>
        }
      >
        <div className="text-lg font-semibold mb-2">太棒啦！你完成了测试😀</div>
        <div className="mb-2">
          正确 <span className="text-green-600 font-bold">{stats.correct}</span> 题，
          错误 <span className="text-red-500 font-bold">{stats.incorrect}</span> 题，
          未答 <span className="text-gray-700 font-bold">{stats.unanswered}</span> 题
        </div>
      </Modal>
    </div>
  );
}

export default QuizJsonRenderer;
