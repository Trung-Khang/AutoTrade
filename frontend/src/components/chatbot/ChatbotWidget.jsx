import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaCar,
  FaMapMarkerAlt,
  FaUsers,
  FaBolt,
  FaCity,
  FaMountain,
  FaMoneyBillWave,
  FaExternalLinkAlt
} from 'react-icons/fa';
import chatbotApi from '../../services/chatbotApi';
import { formatFullPrice } from '../../utils/formatters';
import './ChatbotWidget.css';

const QUICK_SUGGESTIONS = [
  { label: 'Xe gia đình 7 chỗ', query: 'Tư vấn xe gia đình 7 chỗ rộng rãi', icon: FaUsers },
  { label: 'Xe nhỏ gọn đi phố', query: 'Tìm xe nhỏ gọn đi trong phố tiết kiệm xăng', icon: FaCity },
  { label: 'Xe gầm cao đi phượt', query: 'Gợi ý xe gầm cao đi phượt đồi dốc', icon: FaMountain },
  { label: 'Xe điện VinFast', query: 'Có những dòng xe điện VinFast nào đang bán?', icon: FaBolt },
  { label: 'Xe tầm 500 triệu', query: 'Tài chính khoảng 500 triệu có xe nào tốt?', icon: FaMoneyBillWave },
];

const INITIAL_MESSAGE = {
  id: 'welcome',
  sender: 'bot',
  text: 'Dạ chào bạn! Tôi là **Trợ lý AI AutoTrade**. Tôi có thể giúp bạn tìm chiếc xe ưng ý nhất theo đúng mục đích sử dụng (**xe gia đình, xe nhỏ đi phố, xe đi phượt, xe điện**) và khả năng tài chính.\n\nBạn đang quan tâm dòng xe nào?',
  vehicles: [],
  timestamp: new Date()
};

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatbotApi.sendMessage(query);
      const botMsg = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: response.reply || 'Dạ AutoTrade xin gửi bạn thông tin các mẫu xe phù hợp đang có sẵn trong kho:',
        vehicles: response.recommendedVehicles || [],
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chatbot error:', err);
      const fallbackMsg = {
        id: 'bot-err-' + Date.now(),
        sender: 'bot',
        text: 'Rất tiếc, đã có chút trục trặc khi kết nối với máy chủ AI. Bạn hãy thử chọn các câu hỏi gợi ý bên dưới hoặc duyệt kho xe tại trang Danh Sách Xe nhé!',
        vehicles: [],
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper format markdown bold đơn giản (**text**)
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const parts = rawText.split('\n');
    return parts.map((paragraph, pIdx) => {
      const boldRegex = /\*\*(.*?)\*\*/g;
      const elements = [];
      let lastIdx = 0;
      let match;

      while ((match = boldRegex.exec(paragraph)) !== null) {
        if (match.index > lastIdx) {
          elements.push(paragraph.substring(lastIdx, match.index));
        }
        elements.push(<strong key={match.index}>{match[1]}</strong>);
        lastIdx = match.index + match[0].length;
      }
      if (lastIdx < paragraph.length) {
        elements.push(paragraph.substring(lastIdx));
      }

      return (
        <p key={pIdx} style={{ margin: '0 0 6px 0', lineHeight: 1.5 }}>
          {elements}
        </p>
      );
    });
  };

  return (
    <div className="chatbot-widget-container no-print">
      {/* Nút bấm nổi bật (Floating Action Button) */}
      {!isOpen && (
        <button
          type="button"
          className="chatbot-fab-btn"
          onClick={() => setIsOpen(true)}
          title="Tư vấn chọn xe với AI"
          aria-label="Mở Trợ lý AI tư vấn xe"
        >
          <div className="chatbot-fab-pulse"></div>
          <FaRobot className="chatbot-fab-icon" />
          <span className="chatbot-fab-badge">AI Tư Vấn</span>
        </button>
      )}

      {/* Cửa sổ Chatbot */}
      {isOpen && (
        <div className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar-circle">
                <FaRobot />
              </div>
              <div>
                <h4>AutoTrade AI Advisor</h4>
                <span className="chatbot-status-online">● Trực tuyến · Phân tích xe thời gian thực</span>
              </div>
            </div>
            <button
              type="button"
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              title="Đóng cửa sổ"
            >
              <FaTimes />
            </button>
          </div>

          {/* Gợi ý nhanh (Quick suggestion pills) */}
          <div className="chatbot-quick-chips">
            {QUICK_SUGGESTIONS.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  className="quick-chip-btn"
                  onClick={() => handleSendMessage(item.query)}
                  disabled={isLoading}
                >
                  <IconComp className="chip-icon" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Danh sách tin nhắn */}
          <div className="chatbot-messages-area">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                {msg.sender === 'bot' && (
                  <div className="bot-msg-avatar">
                    <FaRobot />
                  </div>
                )}
                <div className={`chat-bubble ${msg.sender}`}>
                  <div className="chat-text-content">{renderFormattedText(msg.text)}</div>

                  {/* Danh sách thẻ xe gợi ý */}
                  {msg.vehicles && msg.vehicles.length > 0 && (
                    <div className="chat-vehicle-cards-list">
                      <div className="chat-cards-header">
                        <FaCar /> Xe có sẵn trong kho đủ điều kiện cọc:
                      </div>
                      {msg.vehicles.map((v) => (
                        <div key={v.id} className="chat-mini-car-card">
                          <img
                            src={v.imageUrl}
                            alt={v.title}
                            className="chat-mini-car-img"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="chat-mini-car-details">
                            <h5 className="mini-car-title">{v.title}</h5>
                            <div className="mini-car-price">
                              {v.price ? formatFullPrice(v.price) : 'Giá liên hệ'}
                            </div>
                            <div className="mini-car-tags">
                              <span><FaUsers /> {v.seatCount} chỗ</span>
                              <span>{v.bodyType}</span>
                              <span><FaMapMarkerAlt /> {v.showroomCity}</span>
                            </div>
                            <Link
                              to={`/vehicles/${v.id}`}
                              className="chat-mini-car-action"
                              onClick={() => setIsOpen(false)}
                            >
                              <span>Xem xe & Đặt cọc</span>
                              <FaExternalLinkAlt />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Đang gõ / Đang tìm xe */}
            {isLoading && (
              <div className="chat-message-row bot">
                <div className="bot-msg-avatar">
                  <FaRobot />
                </div>
                <div className="chat-bubble bot typing-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                    Trợ lý AI đang tìm xe trong kho...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập tin nhắn */}
          <div className="chatbot-input-bar">
            <input
              ref={inputRef}
              type="text"
              placeholder="Hỏi về xe gia đình, đi phố, ngân sách..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              type="button"
              className="chatbot-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              title="Gửi câu hỏi"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
