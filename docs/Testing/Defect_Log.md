# Nhật Ký Khiếm Khuyết & Xử Lý Lỗi (Defect Log) — Hệ Thống AutoTrade
**Dự án:** Hệ thống Quản lý Kinh doanh Ô tô Đã qua Sử dụng (Used-Car Business Management System)  
**Test Lead phụ trách:** TV2 (Frontend Lead & Test Lead)  
**Phối hợp:** TV4 (QA Support), TV1 (Backend Core), TV3 (Auth & DB)  
**Chu kỳ áp dụng:** Kế hoạch 3 Ngày (Increment 1 -> Increment 4)

---

## Bảng Theo Dõi Khiếm Khuyết (Defects Tracking)

| Defect ID | Ngày Tạo | Phân Hệ | Mô Tả Khiếm Khuyết (Defect Summary) | Mức Độ | Người Báo Cáo | Người Xử Lý | Trạng Thái | Giải Pháp Khắc Phục (Resolution) |
|---|---|---|---|---|---|---|---|---|
| **DEF-01** | 2026-09-30 | UI / Scope | Giao diện còn chứa thuật ngữ mô hình định giá hồi quy R Plumber và ML | High | TV2 | TV2 | **Closed** | Đã dọn dẹp sạch toàn bộ các component cũ, chuyển giao diện sang mô hình Kinh doanh Showroom & Đặt cọc AutoTrade. |
| **DEF-02** | 2026-09-30 | Đặt cọc | Form đặt lịch hẹn cho phép người dùng chọn ngày ở quá khứ | High | TV2 | TV2 | **Closed** | Đã bổ sung ràng buộc thuộc tính `min={todayStr}` và kiểm tra điều kiện validation chặn submit nếu ngày hẹn nhỏ hơn ngày hiện tại. |
| **DEF-03** | 2026-09-30 | Xe / Showroom | Xe ở trạng thái `HOLD` hoặc `SOLD` nhưng khách hàng vẫn bấm được nút đặt cọc | Critical | TV2 | TV2 | **Closed** | Bổ sung kiểm tra trạng thái xe trong cả `VehicleCard`, `VehicleInfo` và `DepositPage`. Vô hiệu hoá nút cọc và hiển thị thông báo rõ ràng khi xe không `AVAILABLE`. |
| **DEF-04** | 2026-09-30 | Auth / RBAC | Chưa có cơ chế bảo vệ Route guard theo quyền vai trò người dùng | High | TV2 | TV2 | **Closed** | Tạo component `ProtectedRoute` kết hợp `AuthContext` để kiểm tra quyền và hiển thị màn hình 403 khi truy cập trái phép. |
| **DEF-05** | 2026-09-30 | Tích hợp | Khi Spring Boot Backend chưa khởi động, toàn bộ trang bị lỗi màn hình trắng | High | TV2 | TV2 | **Closed** | Cấu hình cơ chế fallback Mock Data thông minh kết hợp `localStorage` trong `vehicleApi.js`, `depositApi.js`, `AuthContext.jsx` giúp UI hoạt động mượt mà và kiểm thử độc lập ở Local. |

---

## Quy Trình Quản Lý Vòng Đời Khiếm Khuyết
1. **Phát hiện (New):** Người kiểm thử (TV2, TV4) ghi nhận lỗi kèm các bước tái hiện (Steps to Reproduce).
2. **Phân loại (Triaged):** Xác định mức độ nghiêm trọng (Critical / High / Medium / Low).
3. **Phân công (Assigned):** Giao cho thành viên phụ trách module tương ứng (TV1, TV2, hoặc TV3).
4. **Khắc phục (Resolved):** Lập trình viên sửa lỗi và gửi thông báo xác nhận.
5. **Kiểm thử lại & Đóng (Closed):** Test Lead xác minh lỗi đã được giải quyết triệt để và đóng ticket.
