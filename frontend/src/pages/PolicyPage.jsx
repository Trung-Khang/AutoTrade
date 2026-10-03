import React, { useState } from 'react';
import {
  FaShieldAlt,
  FaMoneyBillWave,
  FaWrench,
  FaFileContract,
  FaLock,
  FaTruck
} from 'react-icons/fa';
import './PolicyPage.css';

const POLICIES = [
  {
    id: 'deposit',
    title: 'Chính Sách Đặt Cọc & Hoàn Tiền',
    icon: FaMoneyBillWave,
    content: (
      <>
        <div className="policy-highlight-box">
          <strong>Cam kết cốt lõi:</strong> Toàn bộ tiền cọc của khách hàng được giữ tại tài khoản ký quỹ bảo chứng độc lập. AutoTrade cam kết hoàn cọc 100% nếu xe không đạt cam kết thẩm định hoặc phát sinh tranh chấp pháp lý.
        </div>

        <h3>1. Quy định mức tiền đặt cọc giữ xe</h3>
        <p>
          Khi quý khách chọn được chiếc xe ưng ý trên sàn giao dịch AutoTrade và muốn tạm giữ xe để chuẩn bị lịch hẹn xem xe/lái thử trực tiếp tại showroom, mức tiền đặt cọc quy chuẩn là <strong>10% giá trị niêm yết</strong> của chiếc xe.
        </p>

        <h3>2. Hiệu lực giữ xe (Trạng thái HOLD)</h3>
        <p>
          Ngay sau khi hệ thống ghi nhận thanh toán đặt cọc thành công, chiếc xe sẽ tự động chuyển sang trạng thái <strong>HOLD</strong> trên toàn bộ 34 chi nhánh showroom trên toàn quốc. Trong thời gian này, chiếc xe không thể được bán hay nhận cọc từ bất kỳ khách hàng nào khác.
        </p>

        <h3>3. Điều kiện và thời gian hoàn tiền cọc</h3>
        <ul>
          <li><strong>Hoàn cọc 100%:</strong> Khi khách hàng đến xem xe thực tế và phát hiện xe có dấu hiệu đâm đụng ảnh hưởng khung gầm, ngập nước thủy kích, hoặc hồ sơ giấy tờ xe bị tranh chấp/phạt nguội chưa giải quyết.</li>
          <li><strong>Thời gian giải ngân hoàn cọc:</strong> Sau khi nhân viên quản trị xác nhận yêu cầu hủy cọc trên hệ thống, số tiền cọc sẽ được chuyển hoàn vào số tài khoản ngân hàng của quý khách trong vòng <strong>24 đến 48 giờ làm việc</strong>.</li>
        </ul>
      </>
    )
  },
  {
    id: 'warranty',
    title: 'Chính Sách Bảo Hành & Cứu Hộ',
    icon: FaWrench,
    content: (
      <>
        <div className="policy-highlight-box">
          Mỗi chiếc xe ô tô đã qua sử dụng xuất xưởng từ hệ thống AutoTrade đều được cấp Sổ bảo hành điện tử chính hãng với thời hạn tối thiểu 12 tháng.
        </div>

        <h3>1. Phạm vi bảo hành tiêu chuẩn</h3>
        <ul>
          <li><strong>Động cơ xe (Engine):</strong> Bảo hành lốc máy, trục khuỷu, piston, nắp quy-lát và hệ thống bơm nhiên liệu.</li>
          <li><strong>Hộp số (Transmission):</strong> Bảo hành hộp số sàn / số tự động, biến mô thủy lực và cụm điều khiển hộp số điện tử.</li>
          <li><strong>Hệ thống làm mát & bôi trơn:</strong> Đảm bảo không rò rỉ két nước làm mát hoặc tắc nghẽn đường dầu máy.</li>
        </ul>

        <h3>2. Thời hạn bảo hành</h3>
        <p>
          Thời gian bảo hành là <strong>12 tháng</strong> hoặc <strong>20.000 km</strong> (tùy điều kiện nào đến trước), tính từ ngày ký biên bản bàn giao xe và hợp đồng mua bán chính thức.
        </p>

        <h3>3. Dịch vụ cứu hộ khẩn cấp 24/7</h3>
        <p>
          Trong suốt thời gian bảo hành, quý khách được hưởng quyền lợi cứu hộ giao thông 24/7 miễn phí trong bán kính 50km từ showroom AutoTrade gần nhất khi xe gặp sự cố kỹ thuật trên đường.
        </p>
      </>
    )
  },
  {
    id: 'inspection',
    title: 'Tiêu Chuẩn Kiểm Định 160 Điểm',
    icon: FaFileContract,
    content: (
      <>
        <h3>Quy trình thẩm định xe nghiêm ngặt</h3>
        <p>
          Trước khi bất kỳ phương tiện nào được niêm yết trên hệ thống AutoTrade, đội ngũ kỹ thuật viên cấp cao phải kiểm tra toàn diện 160 hạng mục theo tiêu chuẩn quốc tế:
        </p>
        <ul>
          <li><strong>Kết cấu khung gầm:</strong> Đảm bảo cột A, B, C, giằng đầu, sắt-xi chưa từng bị nắn chỉnh, hàn cắt do tai nạn.</li>
          <li><strong>Kiểm tra thủy kích:</strong> Đảm bảo khoang động cơ, thảm sàn, giắc điện không bị ngâm nước hay có bùn đất đọng.</li>
          <li><strong>Kiểm tra hệ thống điện & ECU:</strong> Quét lỗi bằng thiết bị chẩn đoán chuyên dụng OBD-II, không có mã lỗi ẩn.</li>
          <li><strong>Thử nghiệm vận hành đường trường:</strong> Kiểm tra độ ồn, độ cân bằng thước lái, hệ thống treo và hiệu quả phanh ABS/ESP.</li>
        </ul>
      </>
    )
  },
  {
    id: 'privacy',
    title: 'Chính Sách Bảo Mật Thông Tin Khách Hàng',
    icon: FaLock,
    content: (
      <>
        <h3>Tuân thủ quy định pháp luật</h3>
        <p>
          AutoTrade cam kết bảo vệ dữ liệu cá nhân của người dùng tuyệt đối tuân thủ theo <strong>Nghị định 13/2023/NĐ-CP</strong> của Chính phủ về bảo vệ dữ liệu cá nhân.
        </p>
        <h3>Mục đích thu thập thông tin</h3>
        <ul>
          <li>Xác thực tài khoản người dùng và gửi mã OTP bảo mật.</li>
          <li>Lập hợp đồng đặt cọc giữ xe và hợp đồng mua bán chuyển nhượng phương tiện.</li>
          <li>Liên hệ xác nhận lịch hẹn lái thử và chăm sóc hậu mãi sau bàn giao.</li>
        </ul>
        <p>
          Chúng tôi cam kết không cung cấp, mua bán hoặc chia sẻ thông tin cá nhân của quý khách cho bất kỳ bên thứ ba nào khi chưa có sự đồng ý bằng văn bản của quý khách.
        </p>
      </>
    )
  },
  {
    id: 'delivery',
    title: 'Chính Sách Vận Chuyển & Bàn Giao Xe',
    icon: FaTruck,
    content: (
      <>
        <h3>1. Bàn giao trực tiếp tại showroom</h3>
        <p>
          Quý khách có thể đến bất kỳ showroom nào trong 34 chi nhánh của AutoTrade để làm thủ tục nhận xe, nhận sổ bảo hành và quà tặng phụ kiện kèm theo xe.
        </p>
        <h3>2. Giao xe tận nhà trên toàn quốc</h3>
        <p>
          Đối với khách hàng ở xa, AutoTrade cung cấp dịch vụ giao xe bằng xe lồng cứu hộ chuyên dụng đến tận cửa nhà quý khách. Xe được mua bảo hiểm vận chuyển 100% trong suốt lộ trình.
        </p>
      </>
    )
  }
];

export default function PolicyPage() {
  const [activePolicyId, setActivePolicyId] = useState('deposit');

  const currentPolicy = POLICIES.find((p) => p.id === activePolicyId) || POLICIES[0];

  return (
    <div className="policy-page">
      <div className="policy-hero">
        <h1>Chính Sách Hoạt Động & Bảo Vệ Khách Hàng</h1>
      </div>

      <div className="policy-layout">
        <aside className="policy-nav-sidebar">
          {POLICIES.map((p) => {
            const IconComponent = p.icon;
            const isActive = p.id === activePolicyId;
            return (
              <button
                key={p.id}
                type="button"
                className={`policy-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActivePolicyId(p.id)}
              >
                <IconComponent />
                <span>{p.title}</span>
              </button>
            );
          })}
        </aside>

        <main className="policy-content-card">
          <div className="policy-article-header">
            <h2>{currentPolicy.title}</h2>
            <span className="policy-article-meta">Cập nhật lần cuối: Tháng 10/2026 • Ban Quản Trị AutoTrade</span>
          </div>
          <div className="policy-body">
            {currentPolicy.content}
          </div>
        </main>
      </div>
    </div>
  );
}
