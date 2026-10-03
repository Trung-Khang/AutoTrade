import React from 'react';
import { FaTimes, FaPrint, FaCheckCircle } from 'react-icons/fa';
import { formatFullPrice } from '../../utils/formatters';
import './OfficialReceiptModal.css';

export const formatReceiptDate = (dateVal) => {
  if (!dateVal) return 'Đã xác nhận';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} lúc ${hours}:${minutes}:${seconds}`;
};

export const formatAppointmentTime = (dateVal) => {
  if (!dateVal) return 'Theo lịch hẹn';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} lúc ${hours}:${minutes}`;
};

export const OfficialReceiptContent = ({ receiptData }) => {
  if (!receiptData) return null;

  const vehicleName = receiptData.vehicleTitle || 'Phương tiện AutoTrade';
  const price = receiptData.vehiclePrice || receiptData.price;
  const depositAmt = receiptData.depositAmount || receiptData.amount;
  const customerName = receiptData.customerName || 'Khách hàng';
  const customerPhone = receiptData.customerPhone || 'Đang cập nhật';
  const customerEmail = receiptData.customerEmail || 'Chưa cung cấp';
  const showroomName = receiptData.showroomName || 'Showroom AutoTrade';
  const showroomAddress = receiptData.showroomAddress || 'Địa chỉ showroom';
  const staffName = receiptData.assignedStaffName || 'Chuyên viên AutoTrade';
  const staffPhone = receiptData.assignedStaffPhone || '1900 8888';
  const appointmentFormatted = receiptData.appointmentDateFormatted || formatAppointmentTime(receiptData.appointmentDate);
  const confirmedAtFormatted = formatReceiptDate(receiptData.confirmedAt || receiptData.createdAt);

  return (
    <div className="official-receipt-box">
      <div className="receipt-formal-header">
        <div className="receipt-national-motto">
          <h4>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
          <p>Độc lập - Tự do - Hạnh phúc</p>
          <div className="motto-divider">-----------------o0o-----------------</div>
        </div>
        <div className="receipt-brand-title">
          <h3>AUTOTRADE USED CAR MARKETPLACE</h3>
          <h2>BIÊN LAI ĐẶT CỌC GIỮ XE ĐỘC BẢN</h2>
        </div>
      </div>

      <div className="receipt-meta-grid">
        <div><strong>Mã đơn cọc:</strong> <span className="ref-code-badge">{receiptData.depositCode}</span></div>
        <div><strong>Mã biên lai:</strong> <span>{receiptData.receiptCode || `REC-${receiptData.depositId || '01'}`}</span></div>
        <div><strong>Số hợp đồng:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{receiptData.contractNumber || `HD-COC-${receiptData.depositId || '01'}`}</span></div>
        <div><strong>Ngày xác nhận:</strong> <span>{confirmedAtFormatted}</span></div>
      </div>

      <div className="receipt-divider-line"></div>

      <div className="receipt-section-block">
        <div className="receipt-section-title">THÔNG TIN GIAO DỊCH & XE:</div>
        <div className="receipt-line">
          <span>- Xe đặt cọc:</span> <strong>{vehicleName}</strong>
        </div>
        {price && (
          <div className="receipt-line">
            <span>- Giá niêm yết:</span> <strong>{formatFullPrice(price)}</strong>
          </div>
        )}
        <div className="receipt-line">
          <span>- Số tiền cọc (10%):</span> <strong style={{ color: '#b45309', fontSize: '15px' }}>{formatFullPrice(depositAmt)}</strong>
        </div>
        <div className="receipt-line">
          <span>- Khách hàng:</span> <strong>{customerName} ({customerPhone})</strong>
        </div>
        <div className="receipt-line">
          <span>- Email liên hệ:</span> <span>{customerEmail}</span>
        </div>
      </div>

      <div className="receipt-divider-line"></div>

      <div className="receipt-section-block">
        <div className="receipt-section-title">ĐỊA ĐIỂM TIẾP ĐÓN & BÀN GIAO:</div>
        <div className="receipt-line">
          <span>- Showroom:</span> <strong>{showroomName}</strong>
        </div>
        <div className="receipt-line">
          <span>- Địa chỉ:</span> <span>{showroomAddress}</span>
        </div>
        <div className="receipt-line">
          <span>- Thời gian hẹn:</span>{' '}
          <strong>
            {appointmentFormatted} {receiptData.hasTestDrive && '(Có đăng ký lái thử xe)'}
          </strong>
        </div>
        <div className="receipt-line">
          <span>- Chuyên viên tư vấn đón tiếp:</span>{' '}
          <strong style={{ color: '#0369a1' }}>
            {staffName} (Hotline: {staffPhone})
          </strong>
        </div>
        <div className="receipt-line">
          <span>- Tài khoản nhận tiền:</span> <span>Vietcombank - 1050242933 (NGUYEN TRUNG KHANG)</span>
        </div>
      </div>

      <div className="receipt-signatures-block">
        <div className="receipt-sig-item">
          <span className="sig-role">KHÁCH HÀNG / NGƯỜI NỘP TIỀN</span>
          <span className="sig-note">(Xác nhận điện tử qua AutoTrade ID)</span>
          <div className="customer-sig-container">
            <span className="customer-handwritten-signature">{customerName}</span>
            <div className="customer-sig-verified-tag">✓ ĐÃ XÁC THỰC THANH TOÁN</div>
          </div>
          <strong className="sig-name">{customerName}</strong>
        </div>

        <div className="receipt-sig-item">
          <span className="sig-role">ĐẠI DIỆN HỆ THỐNG / TỔNG GIÁM ĐỐC</span>
          <span className="sig-note">(Ký số & Đóng dấu điện tử)</span>
          <div className="ceo-stamp-badge">
            <div className="ceo-stamp-inner">
              <div className="ceo-stamp-header">
                <FaCheckCircle className="ceo-stamp-icon" />
                <span>CERTIFIED DIGITAL SIGNATURE</span>
              </div>
              <div className="ceo-stamp-title">AUTOTRADE VIETNAM</div>
              <div className="ceo-stamp-person">NGUYỄN TRUNG KHANG</div>
              <div className="ceo-stamp-role">CHỦ TỊCH & TỔNG GIÁM ĐỐC</div>
              <div className="ceo-stamp-date">Ký ngày: {confirmedAtFormatted}</div>
            </div>
          </div>
          <strong className="sig-name">Nguyễn Trung Khang</strong>
        </div>
      </div>
    </div>
  );
};

const OfficialReceiptModal = ({ isOpen, onClose, receiptData }) => {
  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="receipt-modal-backdrop" onClick={onClose} role="presentation">
      <div className="receipt-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-modal-topbar no-print">
          <h3>Chi Tiết Biên Lai Đặt Cọc & Hợp Đồng</h3>
          <div className="receipt-modal-top-actions">
            <button type="button" className="receipt-btn-print" onClick={handlePrint}>
              <FaPrint /> In Biên Lai
            </button>
            <button type="button" className="receipt-btn-close" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="receipt-modal-printable-body">
          <OfficialReceiptContent receiptData={receiptData} />
        </div>

        <div className="receipt-modal-footer no-print">
          <button type="button" className="receipt-btn-print" onClick={handlePrint}>
            <FaPrint /> In Biên Lai / Lưu PDF
          </button>
          <button type="button" className="receipt-btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfficialReceiptModal;
