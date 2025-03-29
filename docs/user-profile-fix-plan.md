# UserProfile组件修复计划

## 问题分析

1. 头像显示问题：
- Gravatar服务连接超时
- 需要确保本地默认头像（frontend/public/head.png）正常工作

2. 用户信息字段展示问题：
- account字段未定义（需使用userId）
- 手机号没有进行隐私处理
- 微信号字段未定义（需优化未绑定状态显示）

## 修复方案

### 1. 头像处理优化
```javascript
// 添加图片加载错误处理
const handleImageError = (e) => {
  e.target.src = "/head.png";
};

// 修改头像组件
<img
  src={user?.avatar || "/head.png"}
  onError={handleImageError}
  alt="用户头像"
  className="w-24 h-24 rounded-full mb-2 bg-gray-100"
/>
```

### 2. 用户信息字段修改
```javascript
// 账号显示改用userId
<div className="flex border-b py-2">
  <span className="text-gray-500 w-24">账号：</span>
  <span>{user?.userId || '-'}</span>
</div>

// 微信号优化显示
<div className="flex border-b py-2">
  <span className="text-gray-500 w-24">微信号：</span>
  <span>{user?.wechat || '未绑定'}</span>
</div>
```

### 3. 手机号隐私保护
```javascript
// 添加手机号格式化函数
const formatPhoneNumber = (phone) => {
  if (!phone) return '-';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

// 使用格式化函数展示手机号
<div className="flex border-b py-2">
  <span className="text-gray-500 w-24">手机号：</span>
  <span>{formatPhoneNumber(user?.phone)}</span>
</div>
```

## 实施步骤

1. 在UserProfile.js中添加handleImageError函数和formatPhoneNumber函数
2. 修改头像img标签，添加onError事件处理
3. 更新用户信息展示部分：
   - 修改账号字段为userId
   - 应用手机号格式化函数
   - 优化微信号显示文案为"未绑定"

## 预期结果

修改后的用户信息弹窗将正确显示：
- 头像（支持本地备选方案）
- 账号（显示用户ID）
- 用户名（保持不变）
- 手机号（格式：177****1423）
- 微信（未绑定时显示"未绑定"）