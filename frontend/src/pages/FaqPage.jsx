import React, { useState } from 'react';
import {
  FaQuestionCircle,
  FaChevronDown,
  FaPhoneAlt,
  FaEnvelope,
  FaCar,
  FaShieldAlt,
  FaMoneyCheckAlt
} from 'react-icons/fa';
import './FaqPage.css';

const FAQ_DATA = [
  {
    category: 'deposit',
    categoryName: 'Đặt cọc & Giữ xe',
    items: [
      {
        q: 'Mức tiền đặt cọc giữ xe tại AutoTrade là bao nhiêu?',
        a: 'Số tiền đặt cọc giữ xe tiêu chuẩn được tính tự động bằng 10% giá trị niêm yết của phương tiện. Số tiền này sẽ được giữ an toàn trên tài khoản bảo chứng của hệ thống và trừ trực tiếp vào hợp đồng mua bán cuối cùng khi bạn nhận xe.'
      },
      {
        q: 'Sau khi thanh toán tiền cọc, xe được giữ trong bao lâu?',
        a: 'Phương tiện sẽ lập tức được chuyển sang trạng thái HOLD (Tạm giữ) trên toàn hệ thống 34 showroom. Xe được bảo đảm không bán cho bất kỳ khách hàng nào khác cho đến hết thời gian lịch hẹn xem xe và hoàn tất thủ tục giao nhận.'
      },
      {
        q: 'Tôi có thể hủy lịch và hoàn trả tiền đặt cọc không?',
        a: 'Có. Nếu sau khi đến showroom xem xe/lái thử thực tế mà xe không đúng cam kết thẩm định, hoặc vì lý do khách quan không thể tiếp tục giao dịch, bạn có thể gửi yêu cầu hoàn tiền. Ban quản trị AutoTrade sẽ đối soát và giải ngân hoàn tiền 100% vào tài khoản của bạn.'
      }
    ]
  },
  {
    category: 'testdrive',
    categoryName: 'Lịch hẹn & Lái thử',
    items: [
      {
        q: 'Tôi cần chuẩn bị giấy tờ gì khi đến showroom lái thử xe?',
        a: 'Bạn chỉ cần mang theo Căn cước công dân (CCCD) và Giấy phép lái xe (GPLX) hạng B1/B2 còn hiệu lực tương ứng với loại xe đăng ký lái thử. Nhân viên showroom sẽ hỗ trợ bạn làm thủ tục check-in trong vòng 2 phút.'
      },
      {
        q: 'Tôi có thể dời lịch hẹn xem xe sang ngày khác được không?',
        a: 'Hoàn toàn được. Bạn có thể liên hệ tổng đài 1900 8888 hoặc thông báo với showroom trước giờ hẹn tối thiểu 2 giờ để nhân viên hỗ trợ đổi sang khung giờ phù hợp nhất.'
      },
      {
        q: 'Một buổi lái thử diễn ra trong bao lâu và có mất phí không?',
        a: 'Buổi lái thử hoàn toàn MIỄN PHÍ. Thời gian trải nghiệm kéo dài từ 30 đến 45 phút, bao gồm lái thử trên cung đường thực tế và kiểm tra toàn diện chức năng tiện nghi của xe cùng chuyên viên kỹ thuật.'
      }
    ]
  },
  {
    category: 'quality',
    categoryName: 'Chất lượng & Bảo hành',
    items: [
      {
        q: 'Quy trình kiểm định 160 bước tại AutoTrade bao gồm những gì?',
        a: 'Mỗi chiếc xe trước khi lên sàn showroom đều phải vượt qua bài kiểm tra nghiêm ngặt: không đâm đụng tai nạn ảnh hưởng kết cấu chassis, không ngập nước thủy kích, động cơ & hộp số nguyên bản, hồ sơ pháp lý minh bạch không tranh chấp và số km chuẩn.'
      },
      {
        q: 'Xe ô tô cũ mua tại AutoTrade được bảo hành bao lâu?',
        a: 'Tất cả các dòng xe bán ra tại hệ thống AutoTrade đều được cấp sổ bảo hành: tối thiểu 12 tháng hoặc 20.000 km cho động cơ và hệ dẫn động hộp số, kèm cam kết hoàn tiền 100% nếu phát hiện xe lỗi ngập nước.'
      }
    ]
  },
  {
    category: 'finance',
    categoryName: 'Thanh toán & Trả góp',
    items: [
      {
        q: 'AutoTrade có hỗ trợ mua xe trả góp qua ngân hàng không?',
        a: 'AutoTrade liên kết với hơn 10 ngân hàng lớn (Vietcombank, Techcombank, VPBank, TPBank, Shinhan Bank...), hỗ trợ vay lên đến 70% giá trị định giá xe với lãi suất ưu đãi, thời hạn vay linh hoạt từ 3 đến 7 năm.'
      },
      {
        q: 'Thời gian phê duyệt hồ sơ vay trả góp mất bao lâu?',
        a: 'Hồ sơ duyệt hạn mức trực tuyến chỉ mất từ 2 đến 4 giờ làm việc. Sau khi bạn chọn được xe và đặt cọc, thủ tục giải ngân có thể hoàn tất trong 24 giờ.'
      }
    ]
  }
];

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [openIndex, setOpenIndex] = useState('0-0');

  const toggleAccordion = (id) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const categories = [
    { key: 'ALL', label: 'Tất cả chủ đề' },
    { key: 'deposit', label: 'Đặt cọc & Giữ xe' },
    { key: 'testdrive', label: 'Lịch hẹn & Lái thử' },
    { key: 'quality', label: 'Chất lượng & Bảo hành' },
    { key: 'finance', label: 'Thanh toán & Trả góp' }
  ];

  const displayedGroups = FAQ_DATA.filter(
    (g) => activeCategory === 'ALL' || g.category === activeCategory
  );

  return (
    <div className="faq-page">
      <div className="faq-hero">
        <h1>Câu Hỏi Thường Gặp (FAQ)</h1>
      </div>

      <div className="faq-categories">
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`faq-cat-btn ${activeCategory === c.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="faq-list">
        {displayedGroups.map((group, gIdx) => (
          <div key={group.category} style={{ marginBottom: 20 }}>
            {activeCategory === 'ALL' && (
              <h3 style={{ fontSize: 18, color: '#0f172a', margin: '20px 0 12px', fontWeight: 700 }}>
                {group.categoryName}
              </h3>
            )}
            {group.items.map((item, iIdx) => {
              const itemId = `${gIdx}-${iIdx}`;
              const isOpen = openIndex === itemId;
              return (
                <div key={iIdx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => toggleAccordion(itemId)}
                  >
                    <span>{item.q}</span>
                    <FaChevronDown className="faq-icon-toggle" />
                  </button>
                  {isOpen && <div className="faq-answer">{item.a}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="faq-contact-card">
        <h3>Bạn vẫn cần thêm sự trợ giúp?</h3>
        <p>Đội ngũ chuyên viên tư vấn của AutoTrade sẵn sàng hỗ trợ bạn 24/7 qua tổng đài hoặc email.</p>
        <div className="faq-contact-actions">
          <a href="tel:19008888" className="faq-contact-btn primary">
            <FaPhoneAlt /> Hotline: 1900 8888
          </a>
          <a href="mailto:support@autotrade.vn" className="faq-contact-btn secondary">
            <FaEnvelope /> support@autotrade.vn
          </a>
        </div>
      </div>
    </div>
  );
}
