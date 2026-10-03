import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaClock,
  FaSearch,
  FaCar,
  FaWarehouse,
  FaCheckCircle
} from 'react-icons/fa';
import './ShowroomsPage.css';

export const SHOWROOMS_DATA = [
  // ==================== MIỀN BẮC (21 TỈNH THÀNH) ====================
  {
    id: 1,
    name: 'AutoTrade Hà Nội - Cầu Giấy',
    city: 'Hà Nội',
    region: 'north',
    address: 'Số 68 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội',
    hotline: '024 3833 8888',
    hours: '08:00 - 20:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Thẩm định 160 điểm', 'Hỗ trợ trả góp', 'Khu giao xe VIP']
  },
  {
    id: 2,
    name: 'AutoTrade Hải Phòng',
    city: 'Hải Phòng',
    region: 'north',
    address: 'Số 12 Lê Hồng Phong, Phường Đằng Giang, Quận Ngô Quyền, Hải Phòng',
    hotline: '0225 385 6666',
    hours: '08:00 - 19:30 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Bảo dưỡng nhanh', 'Rút hồ sơ gốc']
  },
  {
    id: 3,
    name: 'AutoTrade Quảng Ninh',
    city: 'Quảng Ninh',
    region: 'north',
    address: 'Số 108 Trần Hưng Đạo, Phường Cao Thắng, TP. Hạ Long, Quảng Ninh',
    hotline: '0203 362 8899',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Giao xe tận nhà', 'Tư vấn bảo hiểm']
  },
  {
    id: 4,
    name: 'AutoTrade Bắc Ninh',
    city: 'Bắc Ninh',
    region: 'north',
    address: 'Số 24 Lý Thái Tổ, Phường Võ Cường, TP. Bắc Ninh, Bắc Ninh',
    hotline: '0222 389 7788',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Đổi xe cũ lấy mới', 'Thủ tục 24h']
  },
  {
    id: 5,
    name: 'AutoTrade Hải Dương',
    city: 'Hải Dương',
    region: 'north',
    address: 'Số 88 Nguyễn Lương Bằng, Phường Bình Hàn, TP. Hải Dương, Hải Dương',
    hotline: '0220 385 1122',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Thẩm định tại nhà']
  },
  {
    id: 6,
    name: 'AutoTrade Thái Nguyên',
    city: 'Thái Nguyên',
    region: 'north',
    address: 'Số 45 Hoàng Văn Thụ, Phường Phan Đình Phùng, TP. Thái Nguyên, Thái Nguyên',
    hotline: '0208 365 3344',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ sang tên']
  },
  {
    id: 7,
    name: 'AutoTrade Vĩnh Phúc',
    city: 'Vĩnh Phúc',
    region: 'north',
    address: 'Số 16 Đường Mê Linh, Phường Khai Quang, TP. Vĩnh Yên, Vĩnh Phúc',
    hotline: '0211 386 5566',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ trả góp 70%']
  },
  {
    id: 8,
    name: 'AutoTrade Phú Thọ',
    city: 'Phú Thọ',
    region: 'north',
    address: 'Số 72 Đại lộ Hùng Vương, Phường Gia Cẩm, TP. Việt Trì, Phú Thọ',
    hotline: '0210 384 7788',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Kiểm tra khung gầm']
  },
  {
    id: 9,
    name: 'AutoTrade Bắc Giang',
    city: 'Bắc Giang',
    region: 'north',
    address: 'Số 91 Hùng Vương, Phường Hoàng Văn Thụ, TP. Bắc Giang, Bắc Giang',
    hotline: '0204 382 9900',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Ký gửi xe']
  },
  {
    id: 10,
    name: 'AutoTrade Nam Định',
    city: 'Nam Định',
    region: 'north',
    address: 'Số 35 Điện Biên, Phường Cửa Bắc, TP. Nam Định, Nam Định',
    hotline: '0228 384 4455',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Rút hồ sơ gốc']
  },
  {
    id: 11,
    name: 'AutoTrade Thái Bình',
    city: 'Thái Bình',
    region: 'north',
    address: 'Số 50 Lý Bôn, Phường Kỳ Bá, TP. Thái Bình, Thái Bình',
    hotline: '0227 383 6677',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Bảo dưỡng cấp tốc']
  },
  {
    id: 12,
    name: 'AutoTrade Hưng Yên',
    city: 'Hưng Yên',
    region: 'north',
    address: 'Số 28 Nguyễn Thiện Thuật, Phường Lê Lợi, TP. Hưng Yên, Hưng Yên',
    hotline: '0221 386 2233',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ vay mua xe']
  },
  {
    id: 13,
    name: 'AutoTrade Ninh Bình',
    city: 'Ninh Bình',
    region: 'north',
    address: 'Số 88 Trần Hưng Đạo, Phường Vân Giang, TP. Ninh Bình, Ninh Bình',
    hotline: '0229 387 1122',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Thẩm định 160 bước']
  },
  {
    id: 14,
    name: 'AutoTrade Hòa Bình',
    city: 'Hòa Bình',
    region: 'north',
    address: 'Số 45 Cù Chính Lan, Phường Đồng Tiến, TP. Hòa Bình, Hòa Bình',
    hotline: '0218 385 2233',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Bảo hành chính hãng']
  },
  {
    id: 15,
    name: 'AutoTrade Hà Giang',
    city: 'Hà Giang',
    region: 'north',
    address: 'Số 12 Nguyễn Trãi, Phường Nguyễn Trãi, TP. Hà Giang, Hà Giang',
    hotline: '0219 386 3344',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Vận chuyển liên tỉnh']
  },
  {
    id: 16,
    name: 'AutoTrade Sơn La',
    city: 'Sơn La',
    region: 'north',
    address: 'Số 68 Giảng Lắc, Phường Quyết Thắng, TP. Sơn La, Sơn La',
    hotline: '0212 385 4455',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ kỹ thuật']
  },
  {
    id: 17,
    name: 'AutoTrade Hà Nam',
    city: 'Hà Nam',
    region: 'north',
    address: 'Số 135 Lê Hoàn, Phường Quang Trung, TP. Phủ Lý, Hà Nam',
    hotline: '0226 384 5566',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Thủ tục sang tên']
  },
  {
    id: 18,
    name: 'AutoTrade Lào Cai',
    city: 'Lào Cai',
    region: 'north',
    address: 'Số 82 Hoàng Liên, Phường Cốc Lếu, TP. Lào Cai, Lào Cai',
    hotline: '0214 382 6677',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ đăng kiểm']
  },
  {
    id: 19,
    name: 'AutoTrade Tuyên Quang',
    city: 'Tuyên Quang',
    region: 'north',
    address: 'Số 36 Bình Thuận, Phường Tân Quang, TP. Tuyên Quang, Tuyên Quang',
    hotline: '0207 381 7788',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Đổi xe cũ lấy mới']
  },
  {
    id: 20,
    name: 'AutoTrade Điện Biên',
    city: 'Điện Biên',
    region: 'north',
    address: 'Số 24 Võ Nguyên Giáp, Phường Mường Thanh, TP. Điện Biên Phủ, Điện Biên',
    hotline: '0215 382 8899',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Giao xe tận nơi']
  },
  {
    id: 21,
    name: 'AutoTrade Bắc Kạn',
    city: 'Bắc Kạn',
    region: 'north',
    address: 'Số 18 Trường Chinh, Phường Phùng Chí Kiên, TP. Bắc Kạn, Bắc Kạn',
    hotline: '0209 387 9900',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Bảo hiểm xe']
  },

  // ==================== MIỀN TRUNG (18 TỈNH THÀNH) ====================
  {
    id: 22,
    name: 'AutoTrade Đà Nẵng - Hải Châu',
    city: 'Đà Nẵng',
    region: 'central',
    address: 'Số 186 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
    hotline: '0236 388 9999',
    hours: '08:00 - 20:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Thẩm định 160 điểm', 'Giao xe tận nơi', 'Phòng chờ hạng sang']
  },
  {
    id: 23,
    name: 'AutoTrade Nghệ An',
    city: 'Nghệ An',
    region: 'central',
    address: 'Số 75 Quang Trung, Phường Quang Trung, TP. Vinh, Nghệ An',
    hotline: '0238 384 1234',
    hours: '08:00 - 19:30 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ trả góp', 'Kiểm tra pháp lý']
  },
  {
    id: 24,
    name: 'AutoTrade Thanh Hóa',
    city: 'Thanh Hóa',
    region: 'central',
    address: 'Số 120 Bà Triệu, Phường Đông Thọ, TP. Thanh Hóa, Thanh Hóa',
    hotline: '0237 385 5678',
    hours: '08:00 - 19:30 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Thẩm định xe cũ']
  },
  {
    id: 25,
    name: 'AutoTrade Thừa Thiên Huế',
    city: 'Thừa Thiên Huế',
    region: 'central',
    address: 'Số 38 Hùng Vương, Phường Phú Nhuận, TP. Huế, Thừa Thiên Huế',
    hotline: '0234 382 3456',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Sang tên đổi chủ']
  },
  {
    id: 26,
    name: 'AutoTrade Khánh Hòa - Nha Trang',
    city: 'Khánh Hòa',
    region: 'central',
    address: 'Số 54 Lê Thánh Tôn, Phường Lộc Thọ, TP. Nha Trang, Khánh Hòa',
    hotline: '0258 381 7890',
    hours: '08:00 - 19:30 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ du lịch nhận xe']
  },
  {
    id: 27,
    name: 'AutoTrade Bình Định',
    city: 'Bình Định',
    region: 'central',
    address: 'Số 62 An Dương Vương, Phường Nguyễn Văn Cừ, TP. Quy Nhơn, Bình Định',
    hotline: '0256 384 6543',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Rút hồ sơ toàn quốc']
  },
  {
    id: 28,
    name: 'AutoTrade Quảng Nam',
    city: 'Quảng Nam',
    region: 'central',
    address: 'Số 89 Phan Châu Trinh, Phường An Mỹ, TP. Tam Kỳ, Quảng Nam',
    hotline: '0235 381 2233',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ ngân hàng']
  },
  {
    id: 29,
    name: 'AutoTrade Quảng Ngãi',
    city: 'Quảng Ngãi',
    region: 'central',
    address: 'Số 42 Quang Trung, Phường Lê Hồng Phong, TP. Quảng Ngãi, Quảng Ngãi',
    hotline: '0255 382 4455',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Định giá xe tại nhà']
  },
  {
    id: 30,
    name: 'AutoTrade Đắk Lắk',
    city: 'Đắk Lắk',
    region: 'central',
    address: 'Số 95 Nguyễn Tất Thành, Phường Tân Lợi, TP. Buôn Ma Thuột, Đắk Lắk',
    hotline: '0262 395 1122',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ xe bán tải & SUV']
  },
  {
    id: 31,
    name: 'AutoTrade Gia Lai',
    city: 'Gia Lai',
    region: 'central',
    address: 'Số 31 Trần Phú, Phường Tây Sơn, TP. Pleiku, Gia Lai',
    hotline: '0269 382 6677',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Vận chuyển liên tỉnh']
  },
  {
    id: 32,
    name: 'AutoTrade Lâm Đồng - Đà Lạt',
    city: 'Lâm Đồng',
    region: 'central',
    address: 'Số 18 Trần Phú, Phường 3, TP. Đà Lạt, Lâm Đồng',
    hotline: '0263 383 8899',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe đèo dốc', 'Bảo dưỡng chuẩn']
  },
  {
    id: 33,
    name: 'AutoTrade Bình Thuận',
    city: 'Bình Thuận',
    region: 'central',
    address: 'Số 78 Trần Hưng Đạo, Phường Phú Thủy, TP. Phan Thiết, Bình Thuận',
    hotline: '0252 382 3344',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ giấy tờ 100%']
  },
  {
    id: 34,
    name: 'AutoTrade Hà Tĩnh',
    city: 'Hà Tĩnh',
    region: 'central',
    address: 'Số 48 Hà Huy Tập, Phường Nam Hà, TP. Hà Tĩnh, Hà Tĩnh',
    hotline: '0239 385 1122',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Thẩm định khung gầm']
  },
  {
    id: 35,
    name: 'AutoTrade Quảng Bình',
    city: 'Quảng Bình',
    region: 'central',
    address: 'Số 96 Hùng Vương, Phường Hải Đình, TP. Đồng Hới, Quảng Bình',
    hotline: '0232 382 2233',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ trả góp']
  },
  {
    id: 36,
    name: 'AutoTrade Quảng Trị',
    city: 'Quảng Trị',
    region: 'central',
    address: 'Số 64 Lê Duẩn, Phường 1, TP. Đông Hà, Quảng Trị',
    hotline: '0233 385 3344',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Rút hồ sơ gốc']
  },
  {
    id: 37,
    name: 'AutoTrade Phú Yên',
    city: 'Phú Yên',
    region: 'central',
    address: 'Số 115 Hùng Vương, Phường 5, TP. Tuy Hòa, Phú Yên',
    hotline: '0257 384 4455',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Đổi xe cũ lấy mới']
  },
  {
    id: 38,
    name: 'AutoTrade Kon Tum',
    city: 'Kon Tum',
    region: 'central',
    address: 'Số 52 Phan Chu Trinh, Phường Thắng Lợi, TP. Kon Tum, Kon Tum',
    hotline: '0260 386 5566',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Chăm sóc xe chuyên sâu']
  },
  {
    id: 39,
    name: 'AutoTrade Đắk Nông',
    city: 'Đắk Nông',
    region: 'central',
    address: 'Số 38 Huỳnh Thúc Kháng, Phường Nghĩa Thành, TP. Gia Nghĩa, Đắk Nông',
    hotline: '0261 354 6677',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Giao xe tận nơi']
  },

  // ==================== MIỀN NAM (18 SHOWROOM / 17 TỈNH THÀNH) ====================
  {
    id: 40,
    name: 'AutoTrade TP.HCM - Võ Thị Sáu',
    city: 'TP. Hồ Chí Minh',
    region: 'south',
    address: 'Số 218 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    hotline: '028 3930 8888',
    hours: '08:00 - 20:30 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Thẩm định 160 điểm', 'Phòng công chứng tại chỗ', 'Giao xe VIP']
  },
  {
    id: 41,
    name: 'AutoTrade TP.HCM - Thủ Đức',
    city: 'TP. Hồ Chí Minh',
    region: 'south',
    address: 'Số 01 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh',
    hotline: '028 3722 9999',
    hours: '08:00 - 20:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Kho xe lướt trên 200 chiếc', 'Xưởng dịch vụ']
  },
  {
    id: 42,
    name: 'AutoTrade Bình Dương',
    city: 'Bình Dương',
    region: 'south',
    address: 'Số 145 Đại lộ Bình Dương, Phường Phú Hòa, TP. Thủ Dầu Một, Bình Dương',
    hotline: '0274 382 5566',
    hours: '08:00 - 20:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Tư vấn vay ngân hàng duyệt trong ngày']
  },
  {
    id: 43,
    name: 'AutoTrade Đồng Nai - Biên Hòa',
    city: 'Đồng Nai',
    region: 'south',
    address: 'Số 58 Đường Đồng Khởi, Phường Tân Hiệp, TP. Biên Hòa, Đồng Nai',
    hotline: '0251 389 7788',
    hours: '08:00 - 19:30 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Khu thẩm định xe tự động']
  },
  {
    id: 44,
    name: 'AutoTrade Bà Rịa - Vũng Tàu',
    city: 'Bà Rịa - Vũng Tàu',
    region: 'south',
    address: 'Số 92 Lê Hồng Phong, Phường 7, TP. Vũng Tàu, Bà Rịa - Vũng Tàu',
    hotline: '0254 385 4433',
    hours: '08:00 - 19:30 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Chăm sóc xe chuyên sâu']
  },
  {
    id: 45,
    name: 'AutoTrade Cần Thơ - Ninh Kiều',
    city: 'Cần Thơ',
    region: 'south',
    address: 'Số 107 Đường 30 Tháng 4, Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ',
    hotline: '0292 383 1122',
    hours: '08:00 - 20:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Trung tâm trung chuyển miền Tây']
  },
  {
    id: 46,
    name: 'AutoTrade Long An',
    city: 'Long An',
    region: 'south',
    address: 'Số 36 Hùng Vương, Phường 2, TP. Tân An, Long An',
    hotline: '0272 382 9988',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ sang tên']
  },
  {
    id: 47,
    name: 'AutoTrade Tiền Giang',
    city: 'Tiền Giang',
    region: 'south',
    address: 'Số 84 Ấp Bắc, Phường 5, TP. Mỹ Tho, Tiền Giang',
    hotline: '0273 387 3344',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Bảo hiểm xe']
  },
  {
    id: 48,
    name: 'AutoTrade An Giang',
    city: 'An Giang',
    region: 'south',
    address: 'Số 59 Trần Hưng Đạo, Phường Mỹ Bình, TP. Long Xuyên, An Giang',
    hotline: '0296 384 5566',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Giao xe tận nơi']
  },
  {
    id: 49,
    name: 'AutoTrade Kiên Giang',
    city: 'Kiên Giang',
    region: 'south',
    address: 'Số 112 Nguyễn Trung Trực, Phường Vĩnh Bảo, TP. Rạch Giá, Kiên Giang',
    hotline: '0297 386 7788',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Đăng kiểm trọn gói']
  },
  {
    id: 50,
    name: 'AutoTrade Tây Ninh',
    city: 'Tây Ninh',
    region: 'south',
    address: 'Số 22 Cách Mạng Tháng 8, Phường 3, TP. Tây Ninh, Tây Ninh',
    hotline: '0276 382 1122',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ trả góp 70%']
  },
  {
    id: 51,
    name: 'AutoTrade Bình Phước',
    city: 'Bình Phước',
    region: 'south',
    address: 'Số 75 Phú Riềng Đỏ, Phường Tân Phú, TP. Đồng Xoài, Bình Phước',
    hotline: '0271 388 1122',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Thẩm định tại nhà']
  },
  {
    id: 52,
    name: 'AutoTrade Hậu Giang',
    city: 'Hậu Giang',
    region: 'south',
    address: 'Số 29 Trần Hưng Đạo, Phường 5, TP. Vị Thanh, Hậu Giang',
    hotline: '0293 387 2233',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Bảo dưỡng nhanh']
  },
  {
    id: 53,
    name: 'AutoTrade Vĩnh Long',
    city: 'Vĩnh Long',
    region: 'south',
    address: 'Số 82 Phạm Thái Bường, Phường 4, TP. Vĩnh Long, Vĩnh Long',
    hotline: '0270 382 3344',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ đăng ký xe']
  },
  {
    id: 54,
    name: 'AutoTrade Trà Vinh',
    city: 'Trà Vinh',
    region: 'south',
    address: 'Số 46 Điện Biên Phủ, Phường 2, TP. Trà Vinh, Trà Vinh',
    hotline: '0294 385 4455',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Đổi xe cũ lấy mới']
  },
  {
    id: 55,
    name: 'AutoTrade Đồng Tháp',
    city: 'Đồng Tháp',
    region: 'south',
    address: 'Số 63 Nguyễn Huệ, Phường 1, TP. Cao Lãnh, Đồng Tháp',
    hotline: '0277 385 5566',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Hỗ trợ vay ngân hàng']
  },
  {
    id: 56,
    name: 'AutoTrade Bến Tre',
    city: 'Bến Tre',
    region: 'south',
    address: 'Số 58 Đồng Văn Cống, Phường 7, TP. Bến Tre, Bến Tre',
    hotline: '0275 382 6677',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Kiểm tra pháp lý']
  },
  {
    id: 57,
    name: 'AutoTrade Sóc Trăng',
    city: 'Sóc Trăng',
    region: 'south',
    address: 'Số 32 Lê Hồng Phong, Phường 3, TP. Sóc Trăng, Sóc Trăng',
    hotline: '0299 382 7788',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Giao xe tận nhà']
  },
  {
    id: 58,
    name: 'AutoTrade Cà Mau',
    city: 'Cà Mau',
    region: 'south',
    address: 'Số 94 Phan Ngọc Hiển, Phường 5, TP. Cà Mau, Cà Mau',
    hotline: '0290 383 8899',
    hours: '08:00 - 19:00 (Hàng ngày)',
    amenities: ['Lái thử xe', 'Rút hồ sơ gốc toàn quốc']
  }
];

export const getLocationFilterValue = (city) => {
  if (!city) return '';
  if (city.includes('Hồ Chí Minh')) return 'Hồ Chí Minh';
  if (city.includes('Huế')) return 'Huế';
  if (city.includes('Vũng Tàu')) return 'Vũng Tàu';
  return city;
};

export default function ShowroomsPage() {
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredShowrooms = useMemo(() => {
    const needle = searchKeyword.trim().toLowerCase();
    return SHOWROOMS_DATA.filter((item) => {
      const matchRegion = selectedRegion === 'ALL' || item.region === selectedRegion;
      const matchSearch =
        !needle ||
        item.name.toLowerCase().includes(needle) ||
        item.city.toLowerCase().includes(needle) ||
        item.address.toLowerCase().includes(needle);
      return matchRegion && matchSearch;
    });
  }, [selectedRegion, searchKeyword]);

  return (
    <div className="showrooms-page">
      <div className="showrooms-hero">
        <h1>Hệ Thống Showroom AutoTrade Toàn Quốc</h1>
      </div>

      <div className="showrooms-controls">
        <div className="region-tabs">
          <button
            type="button"
            className={`region-tab-btn ${selectedRegion === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedRegion('ALL')}
          >
            Tất cả ({SHOWROOMS_DATA.length})
          </button>
          <button
            type="button"
            className={`region-tab-btn ${selectedRegion === 'north' ? 'active' : ''}`}
            onClick={() => setSelectedRegion('north')}
          >
            Miền Bắc ({SHOWROOMS_DATA.filter((s) => s.region === 'north').length})
          </button>
          <button
            type="button"
            className={`region-tab-btn ${selectedRegion === 'central' ? 'active' : ''}`}
            onClick={() => setSelectedRegion('central')}
          >
            Miền Trung ({SHOWROOMS_DATA.filter((s) => s.region === 'central').length})
          </button>
          <button
            type="button"
            className={`region-tab-btn ${selectedRegion === 'south' ? 'active' : ''}`}
            onClick={() => setSelectedRegion('south')}
          >
            Miền Nam ({SHOWROOMS_DATA.filter((s) => s.region === 'south').length})
          </button>
        </div>

        <div className="showrooms-search">
          <FaSearch className="showrooms-search-icon" />
          <input
            type="text"
            className="showrooms-search-input"
            placeholder="Tìm theo tỉnh thành, tên showroom, địa chỉ..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="showrooms-grid">
        {filteredShowrooms.map((showroom) => (
          <div key={showroom.id} className="showroom-card">
            <div>
              <div className="showroom-card-header">
                <span className="showroom-city-tag">{showroom.city}</span>
              </div>
              <h3>{showroom.name}</h3>

              <div className="showroom-info-list">
                <div className="showroom-info-item">
                  <FaMapMarkerAlt />
                  <span>{showroom.address}</span>
                </div>
                <div className="showroom-info-item">
                  <FaPhoneAlt />
                  <a href={`tel:${showroom.hotline.replace(/\s+/g, '')}`} style={{ color: '#0f172a', fontWeight: 600 }}>
                    {showroom.hotline}
                  </a>
                </div>
                <div className="showroom-info-item">
                  <FaClock />
                  <span>{showroom.hours}</span>
                </div>
              </div>

              <div className="showroom-amenities">
                {showroom.amenities.map((item, idx) => (
                  <span key={idx} className="amenity-pill">
                    <FaCheckCircle style={{ color: '#16a34a', marginRight: 4 }} />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="showroom-card-footer">
              <Link
                to={`/vehicles?location=${encodeURIComponent(getLocationFilterValue(showroom.city))}`}
                className="btn-showroom-action primary"
              >
                <FaCar /> Xem xe tại đây
              </Link>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(showroom.address)}`}
                target="_blank"
                rel="noreferrer"
                className="btn-showroom-action secondary"
              >
                Chỉ đường
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
