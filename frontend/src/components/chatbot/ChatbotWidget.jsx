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
  FaExternalLinkAlt,
  FaBalanceScale,
  FaCheck,
  FaTimesCircle,
  FaRegSquare
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
  const [selectedCompareIds, setSelectedCompareIds] = useState([]);
  const [lastCarQuery, setLastCarQuery] = useState('');
  const [lastRecommendationQuery, setLastRecommendationQuery] = useState('');
  const [shownListingIds, setShownListingIds] = useState([]);
  const [panelSize, setPanelSize] = useState(() => {
    try { return JSON.parse(localStorage.getItem('autotrade_chatbot_size')) || { width: 380, height: 580 }; }
    catch { return { width: 380, height: 580 }; }
  });
  const resizeRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const listingIdOf = (vehicle) => vehicle.id ?? vehicle.listingId;
  const isMoreRecommendationQuery = (query) => {
    const lower = query.toLowerCase();
    return ['còn option nào', 'con option nao', 'còn mẫu xe nào', 'con mau xe nao',
      'còn mẫu nào khác', 'con mau nao khac', 'còn không', 'con khong',
      'gợi ý thêm', 'goi y them', 'tham khảo thêm', 'tham khao them',
      'còn lựa chọn nào', 'con lua chon nao', 'còn xe nào nữa', 'con xe nao nua',
      'hết rồi à', 'het roi a', 'hết rồi hả', 'het roi ha', 'nhiêu đó thôi hả', 'nhieu do thoi ha',
      'nhiêu đó thôi à', 'nhieu do thoi a', 'trong kho còn mẫu nào khác', 'trong kho con mau nao khac',
      'hệ thống chỉ có nhiêu đó thôi', 'he thong chi co nhieu do thoi', 'thêm nữa đi', 'them nua di', 'thêm đi', 'them di',
      'tiếp tục gợi ý', 'tiep tuc goi y', 'tiếp tục gợi ý thêm', 'tiep tuc goi y them', 'thêm lựa chọn', 'them lua chon', 'thêm',
      'tôi cần thêm', 'toi can them'].some((phrase) => lower.includes(phrase));
  };

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
    const requestingMore = isMoreRecommendationQuery(query) && Boolean(lastRecommendationQuery);
    const previousQuery = requestingMore ? lastRecommendationQuery : null;
    const excludedIds = requestingMore ? shownListingIds : [];

    const userMsg = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLastCarQuery(requestingMore ? lastRecommendationQuery : query);
    setIsLoading(true);

    try {
      const response = await chatbotApi.sendMessage(query, null, previousQuery, excludedIds);
      const responseVehicles = response.recommendedVehicles || [];
      const responseIds = responseVehicles.map(listingIdOf).filter((id) => id !== undefined && id !== null);
      if (responseVehicles.length > 0) {
        if (requestingMore) {
          setShownListingIds((current) => [...new Set([...current, ...responseIds])]);
        } else {
          setLastRecommendationQuery(query);
          setShownListingIds(responseIds);
        }
      }
      const botMsg = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: response.reply || 'Dạ AutoTrade xin gửi bạn thông tin các mẫu xe phù hợp đang có sẵn trong kho:',
        vehicles: responseVehicles,
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

  const toggleCompareVehicle = (listingId) => {
    setSelectedCompareIds((current) => {
      if (current.includes(listingId)) return current.filter((id) => id !== listingId);
      if (current.length >= 2) return current;
      return [...current, listingId];
    });
  };

  const handleCompare = async () => {
    if (selectedCompareIds.length !== 2 || isLoading) return;
    setIsLoading(true);
    try {
      const comparison = await chatbotApi.compare(selectedCompareIds, lastCarQuery || null);
      setMessages((prev) => [...prev, {
        id: 'comparison-' + Date.now(),
        sender: 'bot',
        text: 'Dạ, đây là kết quả so sánh dựa trên dữ liệu thực tế của các tin đăng bạn đã chọn:',
        vehicles: [],
        comparison,
        timestamp: new Date()
      }]);
      setSelectedCompareIds([]);
    } catch (err) {
      console.error('Chatbot comparison error:', err);
      setMessages((prev) => [...prev, {
        id: 'comparison-error-' + Date.now(),
        sender: 'bot',
        text: 'Chưa thể so sánh hai xe lúc này. Thông tin tư vấn xe hiện tại vẫn hoạt động bình thường, bạn hãy thử lại sau.',
        vehicles: [],
        timestamp: new Date()
      }]);
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

  const startResize = (event, edge = 'bottom-right') => {
    event.preventDefault();
    resizeRef.current = { startX: event.clientX, startY: event.clientY, edge, ...panelSize };
    const move = (moveEvent) => {
      const start = resizeRef.current;
      if (!start) return;
      const next = {
        width: Math.min(760, Math.max(380, start.width + (start.edge.includes('left') ? start.startX - moveEvent.clientX : moveEvent.clientX - start.startX))),
        height: Math.min(850, Math.max(500, start.height + (start.edge.includes('top') ? start.startY - moveEvent.clientY : moveEvent.clientY - start.startY)))
      };
      setPanelSize(next);
      localStorage.setItem('autotrade_chatbot_size', JSON.stringify(next));
    };
    const stop = () => {
      resizeRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  const resetPanelSize = () => {
    const defaultSize = { width: 380, height: 580 };
    setPanelSize(defaultSize);
    localStorage.setItem('autotrade_chatbot_size', JSON.stringify(defaultSize));
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

  const displayValue = (value) => value === null || value === undefined || value === '' ? 'Chưa cập nhật' : value;
  const formatComparisonPrice = (value) => value ? formatFullPrice(value) : 'Chưa cập nhật';
  const renderComparison = (comparison) => {
    if (!comparison) return null;
    const comparedVehicles = comparison.vehicles || [];
    const rows = [
      ['Giá', (vehicle) => formatComparisonPrice(vehicle.price)],
      ['Năm sản xuất', (vehicle) => displayValue(vehicle.manufactureYear)],
      ['Số km đã đi', (vehicle) => displayValue(vehicle.mileage)],
      ['Nhiên liệu', (vehicle) => displayValue(vehicle.fuelType)],
      ['Hộp số', (vehicle) => displayValue(vehicle.transmission)],
      ['Số chỗ', (vehicle) => displayValue(vehicle.seatCount)],
      ['Kiểu dáng', (vehicle) => displayValue(vehicle.bodyType)],
      ['Dung tích động cơ', (vehicle) => displayValue(vehicle.engineSize)],
      ['Showroom', (vehicle) => displayValue(vehicle.showroomCity)],
      ['Trạng thái', (vehicle) => displayValue(vehicle.status)]
    ];
    const list = (items) => items && items.length ? items.map((item, index) => <li key={index}>{item}</li>) : <li>Chưa có ưu điểm nổi bật từ dữ liệu hiện có.</li>;
    return (
      <div className="chat-comparison">
        <div className="chat-comparison-score">
          <strong>Điểm phù hợp theo nhu cầu</strong>
          {comparedVehicles.map((item) => (
            <span className="chat-comparison-score-item" key={item.vehicle.listingId}>
              <span>{item.vehicle.title}: <b>{Number(item.score).toFixed(1)}%</b></span>
              <small>{item.scoreExplanation}</small>
            </span>
          ))}
        </div>
        <div className="chat-comparison-table-wrap">
          <table className="chat-comparison-table">
            <thead><tr><th>Thông số</th>{comparedVehicles.map((item) => <th key={item.vehicle.listingId}>{item.vehicle.title}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row[0]}><th>{row[0]}</th>{comparedVehicles.map((item) => <td key={item.vehicle.listingId}>{row[1](item.vehicle)}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <div className="chat-comparison-columns">
          {comparedVehicles.map((item) => <div key={item.vehicle.listingId}><strong>{item.vehicle.title}</strong><ul>{list(item.advantages)}</ul></div>)}
        </div>
      </div>
    );
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
        <div className="chatbot-panel" style={{ width: panelSize.width, height: panelSize.height }}>
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
            <div className="chatbot-header-actions">
              <button type="button" className="chatbot-reset-size-btn" onClick={resetPanelSize} title="Khôi phục kích thước mặc định" aria-label="Khôi phục kích thước mặc định"><FaRegSquare /></button>
              <button type="button" className="chatbot-close-btn" onClick={() => setIsOpen(false)} title="Đóng cửa sổ" aria-label="Đóng cửa sổ">
                <FaTimes />
              </button>
            </div>
          </div>
          <div className="chatbot-resize-handle chatbot-resize-left" onPointerDown={(event) => startResize(event, 'left')} />
          <div className="chatbot-resize-handle chatbot-resize-top" onPointerDown={(event) => startResize(event, 'top')} />
          <div className="chatbot-resize-handle chatbot-resize-top-left" onPointerDown={(event) => startResize(event, 'top-left')} />
          <div className="chatbot-resize-handle chatbot-resize-bottom-right" onPointerDown={(event) => startResize(event, 'bottom-right')} title="Kéo để thay đổi kích thước" />

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

                  {msg.comparison && renderComparison(msg.comparison)}

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
                            <button
                              type="button"
                              className={`chat-compare-select ${selectedCompareIds.includes(listingIdOf(v)) ? 'selected' : ''}`}
                              onClick={() => toggleCompareVehicle(listingIdOf(v))}
                              disabled={!selectedCompareIds.includes(listingIdOf(v)) && selectedCompareIds.length >= 2}
                            >
                              {selectedCompareIds.includes(listingIdOf(v)) ? <FaCheck /> : <FaBalanceScale />}
                              {selectedCompareIds.includes(listingIdOf(v)) ? 'Đã chọn' : 'Chọn so sánh'}
                            </button>
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

          {selectedCompareIds.length > 0 && (
            <div className="chat-compare-bar">
              <span><FaBalanceScale /> Đã chọn {selectedCompareIds.length}/2 xe</span>
              <button type="button" onClick={handleCompare} disabled={selectedCompareIds.length !== 2 || isLoading}>
                So sánh 2 xe
              </button>
              <button type="button" className="chat-compare-clear" onClick={() => setSelectedCompareIds([])} title="Bỏ chọn xe">
                <FaTimesCircle />
              </button>
            </div>
          )}

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
