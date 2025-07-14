import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createOrder, getOrderStatus } from '../../services/api';
import QRCode from 'qrcode';

const BENEFITS = {
  vip: [
    '100+精品图书文字解读',
    '100+精品图书语音解读',
    '100+精品图书脑图',
    '100+精品图书测试题',
    '100本/月-图书上传',
    '10次/月-AI文字解读',
    '5次/月-AI语音生成',
    '10次/月-AI脑图生成',
    '10次/月-AI测试题生成',
    '无限次-图书知识问答',
  ],
  svip: [
    '100+精品图书文字解读',
    '100+精品图书语音解读',
    '100+精品图书脑图',
    '100+精品图书测试题',
    '200本/月-图书上传',
    '20次/月-AI文字解读',
    '10次/月-AI语音生成',
    '20次/月-AI脑图生成',
    '20次/月-AI测试题生成',
    '无限次-图书知识问答',
    '无限次-知识库问答',
  ],
};

const PLANS = {
  vip: [
    { label: '12个月', price: 86, desc: '7.2¥/月' },
    { label: '3个月', price: 26, desc: '8.7¥/月' },
    { label: '1个月', price: 9.9, desc: '' },
  ],
  svip: [
    { label: '12个月', price: 168, desc: '14¥/月' },
    { label: '3个月', price: 48, desc: '16¥/月' },
    { label: '1个月', price: 19.9, desc: '' },
  ],
};

function PurchaseModal({ open, onClose, defaultType = 'vip' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [type, setType] = useState(defaultType);
  const [planIdx, setPlanIdx] = useState(0);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [payStatus, setPayStatus] = useState('未支付');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);

  // 创建订单
  const handleCreateOrder = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const plans = PLANS[type];
      const selectedPlan = plans[planIdx];
      const periodMonths = planIdx === 0 ? 12 : planIdx === 1 ? 3 : 1;
      const amount = Math.round(selectedPlan.price * 100); // 转换为分
      const description = `书意平台【${type.toUpperCase()}】订阅-【${periodMonths}】个月`;
      
      const response = await createOrder({
        memberType: type.toUpperCase(),
        periodMonths: periodMonths,
        payType: '微信',
        amount: amount,
        description: description
      });
      
      setOrder(response);
      setQrCodeUrl(response.codeUrl);
      setPayStatus(response.payStatus);
      
      // 生成二维码
      if (response.codeUrl) {
        try {
          const dataUrl = await QRCode.toDataURL(response.codeUrl, {
            width: 192,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrCodeDataUrl(dataUrl);
        } catch (error) {
          console.error('生成二维码失败:', error);
        }
      }
      
      // 开始轮询订单状态
      startPolling(response.outTradeNo);
    } catch (error) {
      console.error('创建订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 轮询订单状态
  const startPolling = (outTradeNo) => {
    const interval = setInterval(async () => {
      try {
              const orderStatus = await getOrderStatus(outTradeNo);
        
        if (orderStatus.payStatus === '已支付') {
          setPayStatus('已支付');
          clearInterval(interval);
          // 支付成功，关闭弹窗
          setTimeout(() => {
            onClose();
            alert('支付成功！');
          }, 1000);
        } else if (orderStatus.payStatus === '支付超时' || orderStatus.payStatus === '已关闭') {
          setPayStatus(orderStatus.payStatus);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('查询订单状态失败:', error);
      }
    }, 3000); // 每3秒查询一次
    
    setPollingInterval(interval);
  };

  // 停止轮询
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  useEffect(() => {
    if (open) {
      setType(defaultType);
      setPlanIdx(0);
      setOrder(null);
      setPayStatus('未支付');
      setQrCodeUrl('');
      setQrCodeDataUrl('');
      stopPolling();
      if (user) {
        handleCreateOrder();
      }
    } else {
      stopPolling();
    }
  }, [open, defaultType, user]);

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // 监听type和planIdx变化，重新获取二维码
  useEffect(() => {
    if (open && user && order) {
      handleCreateOrder();
    }
  }, [type, planIdx]);

  if (!open) return null;

  const plans = PLANS[type];
  const benefits = BENEFITS[type];
  const price = plans[planIdx].price;
  let save = 0;
  if (planIdx === 0) {
    save = Math.round((plans[2].price * 12 - plans[0].price) * 10) / 10;
  } else if (planIdx === 1) {
    save = Math.round((plans[2].price * 3 - plans[1].price) * 10) / 10;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40">
      <div className="bg-gray-100 rounded-3xl shadow-2xl w-full max-w-5xl p-0 relative flex flex-col md:flex-row border border-gray-200 items-stretch">
        {/* 左侧权益介绍卡片 */}
        <div className="w-full md:w-1/3 flex items-center justify-center p-6 md:pr-3">
          <div className="bg-white rounded-2xl w-full h-full flex flex-col items-center p-6">
            <div className="flex flex-col items-center mb-6">
              <img
                src={user?.avatar || "/head.png"}
                onError={e => { if (!e.target.src.includes('/head.png')) e.target.src = '/head.png'; }}
                alt="用户头像"
                className="w-20 h-20 rounded-full mb-2 border-2 border-gray-200 object-cover bg-white"
              />
              <div className="font-bold text-gray-700 text-base">{user?.username || '-'}</div>
            </div>
            <hr className="border-t border-gray-200 mb-6 w-full" />
            <h2 className="text-lg font-semibold mb-4 text-gray-700 text-center">{type === 'vip' ? 'VIP会员权益' : 'SVIP会员权益'}</h2>
            <ul className="space-y-2 text-gray-500 text-sm pl-2">
              {benefits.map((b, i) => (
                <li key={i}><i className="fas fa-check text-green-400 mr-2"></i>{b}</li>
              ))}
            </ul>
            <button 
              onClick={() => {
                onClose();
                navigate('/pricing');
              }}
              className="mt-6 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
            >
              <i className="fas fa-compress-alt mr-2"></i>权益对比
            </button>
          </div>
        </div>
        {/* 右侧支付区卡片 */}
        <div className="w-full md:w-2/3 flex items-center justify-center p-6 md:pl-3">
          <div className="bg-white rounded-2xl w-full h-full flex flex-col items-center p-6">
            {/* 选项卡 */}
            <div className="flex mb-8 justify-center w-full">
              <div className="bg-gray-100 rounded-2xl p-2 w-full">
                <div className="flex gap-2">
                  <button
                    className={`flex-1 py-3 text-2xl font-bold rounded-xl transition-colors ${type === 'vip' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' : 'text-orange-500'}`}
                    onClick={() => { setType('vip'); setPlanIdx(0); }}
                  >
                    VIP
                  </button>
                  <button
                    className={`flex-1 py-3 text-2xl font-bold rounded-xl transition-colors ${type === 'svip' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' : 'text-orange-500'}`}
                    onClick={() => { setType('svip'); setPlanIdx(0); }}
                  >
                    SVIP
                  </button>
                </div>
              </div>
            </div>
            {/* 周期选项 */}
            <div className="flex mb-8 justify-center w-full gap-8 flex-wrap">
              {plans.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setPlanIdx(i)}
                  className={`cursor-pointer flex-1 min-w-[8rem] max-w-[12rem] px-6 py-4 flex flex-col items-center rounded-2xl border-2 transition-all duration-200 ${planIdx === i ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}`}
                  style={{ flexBasis: '0', flexGrow: 1 }}
                >
                  <div className="font-bold text-lg text-gray-700 mb-1">{p.label}</div>
                  <div className="text-3xl text-orange-600 font-extrabold mb-1">¥{p.price}</div>
                  <div className="text-xs text-gray-400">{p.desc}</div>
                </div>
              ))}
            </div>
            {/* 价格展示 */}
            <div className="mb-8 flex items-end justify-center gap-4">
              <div className="text-5xl font-extrabold text-orange-600 text-center leading-none">¥{price}</div>
              <div className="text-lg text-gray-500 mb-1">{save > 0 ? `节省${save}元` : ''}</div>
            </div>
            {/* 微信支付标识 */}
            <div className="flex items-center justify-center mb-4">
              <i className="fab fa-weixin text-green-500 text-2xl mr-2"></i>
              <span className="text-lg font-semibold text-gray-700">微信支付</span>
            </div>
            
            {/* 支付状态和二维码展示 */}
            {!order ? (
              <div className="flex flex-col items-center">
                {user ? (
                  <div className="text-gray-500">正在生成支付二维码...</div>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
                  >
                    立即登录
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {payStatus === '未支付' && (
                  <>
                    <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center text-xl mb-2 border border-gray-200">
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="支付二维码" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-gray-400">二维码加载中...</span>
                      )}
                    </div>
                    <div className="mt-1 text-gray-500 text-base">请使用微信扫码支付</div>
                    <div className="mt-2 text-sm text-gray-400">订单号: {order.outTradeNo}</div>
                  </>
                )}
                {payStatus === '已支付' && (
                  <div className="text-center">
                    <div className="text-green-500 text-2xl mb-2">✓ 支付成功</div>
                    <div className="text-gray-500">正在为您开通会员...</div>
                  </div>
                )}
                {(payStatus === '支付超时' || payStatus === '已关闭') && (
                  <div className="text-center">
                    <div className="text-red-500 text-2xl mb-2">✗ {payStatus}</div>
                    <button
                      onClick={handleCreateOrder}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors mt-2"
                    >
                      重新支付
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 关闭按钮放在弹窗下方，带白色圆形背景 */}
      <div className="w-full flex justify-center mt-6">
        <button
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-lg text-gray-400 hover:text-gray-700 text-2xl border border-gray-200 transition"
          onClick={onClose}
          aria-label="关闭"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}

export default PurchaseModal;
