import React from 'react';

function PromptTemplates({ onSelect, onClose }) {
  const templates = [
    {
      title: '详细解释复杂概念',
      content: '请以易于理解的方式解释[概念]，从基础开始，逐步深入到复杂部分。包括类比、例子和实际应用。'
    },
    {
      title: '生成创意故事开头',
      content: '写一个引人入胜的[类型]故事开头，设定在[地点/时代]，主角是[人物描述]。创造一个令人好奇的场景或冲突。'
    },
    {
      title: '代码优化与重构',
      content: '请审查并重构以下[编程语言]代码，提高其可读性、性能和遵循最佳实践。说明您所做的每一处修改。'
    },
    {
      title: '零基础学习计划制定',
      content: '为[学科/技能]的绝对新手设计30天学习路径，包含每日目标、资源推荐和3种不同难度的练习任务。'
    },
    {
      title: '课堂笔记智能整理',
      content: '请将以下关于[学科主题]的杂乱课堂笔记转化为结构化大纲，补充相关案例并标注重点记忆部分。'
    },
    {
      title: '专业术语速查手册',
      content: '创建包含20个[领域名称]核心术语的对照表，每个术语需有：通俗解释+技术定义+常见误区的对比说明。'
    },
    {
      title: '个性化健身方案',
      content: '为[身高/体重/年龄]的新手设计家庭健身计划，包含热身-训练-拉伸全流程，需注明替代动作和风险提示。'
    },
    {
      title: '短视频脚本生成器',
      content: '创作关于[主题]的60秒短视频脚本，包含3个镜头切换、2个悬念点和适合新手的拍摄设备建议。'
    },
    {
      title: '智能菜谱定制',
      content: '根据现有食材：[食材列表]，生成包含替代方案的3道菜品，详细说明火候控制技巧和营养搭配原理。'
    },
    {
      title: '旅行规划全攻略',
      content: '制定[城市]3日深度游计划，包含交通接驳技巧、错峰游览方案和适合新手的摄影机位标注。'
    },
    {
      title: '会议纪要优化模板',
      content: '将原始会议记录转化为标准纪要格式，突出决策事项、待办责任人，并生成3个后续跟进的问题提示。'
    },
    {
      title: '诗歌创作启蒙指导',
      content: '以[自然现象]为题创作入门级诗歌，提供3种押韵方案，分析意象选择并标注情感表达技巧。'
    },
    {
      title: '辩论技巧训练模块',
      content: '针对[辩题]设计新手攻防演练，包含论点树状图、常见逻辑漏洞及应对话术模板。'
    },
    {
      title: '自动化办公脚本',
      content: '为重复性的[办公任务]编写Python自动化脚本，添加详细注释说明并推荐5个调试技巧。'
    },
    {
      title: '科学提问模板库',
      content: '针对[问题类型]设计3种提问模板，包含背景交代格式、关键要素排列方法和常见歧义规避策略。'
    }
  ];

  const handleTemplateClick = (template) => {
    onSelect(template.content);
    onClose();
  };

  return (
    <div className="rounded-lg">
      {/* 提示词模板卡片列表 */}
      <div className="max-h-[70vh] overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template, index) => (
            <div
              key={index}
              onClick={() => handleTemplateClick(template)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer h-full"
            >
              <h4 className="font-medium text-sm text-gray-800 mb-2">
                {template.title}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {template.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="p-3">
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs text-blue-500 hover:text-blue-700 flex items-center"
        >
          <i className="fas fa-arrow-left mr-1"></i> 返回输入
        </button>
      </div>
    </div>
  );
}

export default PromptTemplates;