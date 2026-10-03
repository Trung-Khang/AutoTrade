import React from 'react';
import './TermsPage.css';

export default function TermsPage() {
  return (
    <div className="terms-page">
      <div className="terms-header">
        <h1>Điều Khoản Sử Dụng Dịch Vụ AutoTrade</h1>
      </div>

      <div className="terms-card">
        <div className="terms-intro-box">
          Bằng việc đăng ký tài khoản, tìm kiếm thông tin xe, thực hiện đặt cọc hoặc đặt lịch hẹn lái thử trên nền tảng AutoTrade, bạn xác nhận đã đọc, hiểu rõ và đồng ý bị ràng buộc bởi các điều khoản dưới đây.
        </div>

        <div className="terms-section">
          <h2>
            <span className="terms-section-number">1</span>
            Định Nghĩa & Giải Thích Từ Ngữ
          </h2>
          <p>
            Trong văn bản này, các thuật ngữ sau đây được hiểu theo nghĩa thống nhất:
          </p>
          <ul>
            <li><strong>AutoTrade:</strong> Nền tảng công nghệ quản lý mua bán ô tô cũ và hệ thống mạng lưới 34 showroom trực thuộc.</li>
            <li><strong>Khách hàng (Người mua):</strong> Cá nhân hoặc tổ chức tạo tài khoản hợp lệ trên website để tìm mua xe hoặc đặt lịch hẹn.</li>
            <li><strong>Đơn đặt cọc (Deposit):</strong> Giao dịch ký quỹ tài chính tạm giữ xe với giá trị tương đương 10% giá trị niêm yết của phương tiện.</li>
            <li><strong>Trạng thái HOLD:</strong> Tình trạng xe bị khóa trên toàn hệ thống trong thời gian bảo lưu để chờ khách hàng đến xem xe và làm thủ tục.</li>
          </ul>
        </div>

        <div className="terms-section">
          <h2>
            <span className="terms-section-number">2</span>
            Đăng Ký & Quản Lý Tài Khoản Người Dùng
          </h2>
          <p>
            Người dùng chịu trách nhiệm về tính chính xác của các thông tin cá nhân (Họ tên, Số điện thoại, Email) khi đăng ký tài khoản. Khách hàng có nghĩa vụ bảo mật mật khẩu và mã OTP xác thực. AutoTrade không chịu trách nhiệm trong trường hợp thông tin tài khoản bị tiết lộ do sơ suất từ phía người dùng.
          </p>
        </div>

        <div className="terms-section">
          <h2>
            <span className="terms-section-number">3</span>
            Quy Định Giao Dịch & Đặt Cọc Trực Tuyến
          </h2>
          <ul>
            <li>Mọi khoản thanh toán đặt cọc được chuyển vào tài khoản bảo chứng của AutoTrade và được hệ thống sinh mã hợp đồng, mã biên lai điện tử duy nhất.</li>
            <li>Sau khi đặt cọc thành công, khách hàng có quyền đặt lịch hẹn xem xe và lái thử tại đúng showroom xe đang trưng bày.</li>
            <li>Trường hợp khách hàng không đến xem xe theo lịch hẹn và không thông báo dời lịch trước thời hạn 24 giờ, showroom có quyền mở lại trạng thái xe cho khách hàng khác theo quy trình đối soát.</li>
          </ul>
        </div>

        <div className="terms-section">
          <h2>
            <span className="terms-section-number">4</span>
            Cam Kết Về Chất Lượng Phương Tiện
          </h2>
          <p>
            AutoTrade cam kết tất cả thông tin, hình ảnh, thông số kỹ thuật và báo cáo kiểm định 160 bước hiển thị trên website là đúng sự thật. Nếu khách hàng phát hiện xe có sai lệch nghiêm trọng so với biên bản thẩm định (xe đâm đụng biến dạng khung sườn, ngập nước máy, tua công-tơ-mét), AutoTrade cam kết bồi hoàn 100% tiền cọc và chi phí đi lại của khách hàng.
          </p>
        </div>

        <div className="terms-section">
          <h2>
            <span className="terms-section-number">5</span>
            Giải Quyết Tranh Chấp & Khiếu Nại
          </h2>
          <p>
            Mọi bất đồng hoặc khiếu nại phát sinh trong quá trình giao dịch đều được ưu tiên giải quyết thông qua thương lượng hòa giải thiện chí. Trong trường hợp không đạt được thỏa thuận, vụ việc sẽ được đưa ra giải quyết tại Tòa án nhân dân có thẩm quyền theo quy định của pháp luật Việt Nam.
          </p>
        </div>

        <div className="terms-footer-note">
          Hiệu lực thi hành: Bắt đầu áp dụng từ ngày 01/10/2026 trên toàn bộ hệ sinh thái AutoTrade.
        </div>
      </div>
    </div>
  );
}
