# TV2.md — Frontend & UI/UX

> **Cập nhật phạm vi ngày 27/09/2026:** Mục 12 ở cuối tài liệu và `scope_change_mission.md` là nhiệm vụ hiện hành. Khi có mâu thuẫn, nội dung mới thay thế phần Recommendation/Comparison cũ.

## 1. Vai trò

**Vai trò:** Frontend Developer & UI/UX

TV2 xây dựng toàn bộ giao diện ReactJS, kết nối Spring Boot REST API và trình bày dữ liệu định giá, Recommendation và Comparison.

### Phạm vi chính

```text
frontend/
docs/UML/Use_Case/
```

TV2 không phụ trách logic truy vấn Database hay code Regression.

---

# 2. Nguyên tắc làm việc

- Không gọi PostgreSQL trực tiếp.
- Chỉ gọi Spring Boot API.
- Không nhúng logic Regression vào React.
- Không hard-code dữ liệu demo khi API đã sẵn sàng.
- Components phải tái sử dụng.
- Tách Page, Component, API service.
- Giao diện phải responsive.

---

# 3. Increment 1 — Foundation

## 3.1. Khởi tạo React

Vị trí:

```text
frontend/
```

Khởi tạo React + Vite.

Kiểm tra:

```bash
npm install
npm run dev
```

## 3.2. Cấu trúc

Duy trì:

```text
src/
├── components/
├── pages/
├── services/
├── hooks/
├── context/
├── utils/
├── assets/
└── styles/
```

## 3.3. Layout

Tạo:

```text
components/common/
├── Navbar.jsx
├── Footer.jsx
├── Loading.jsx
└── ErrorMessage.jsx
```

Tạo:

```text
pages/HomePage.jsx
```

## 3.4. Vehicle UI

Tạo:

```text
components/vehicle/
├── VehicleCard.jsx
├── VehicleGrid.jsx
└── VehicleInfo.jsx
```

Tạo:

```text
pages/
├── VehicleListPage.jsx
└── VehicleDetailPage.jsx
```

## 3.5. Kết nối Backend

Vị trí:

```text
src/services/
├── api.js
└── vehicleApi.js
```

TV2 nhận API contract từ TV1.

---

# 4. Increment 2 — Market Data

## 4.1. Filter UI

Vị trí:

```text
components/filter/
├── FilterPanel.jsx
├── PriceFilter.jsx
├── YearFilter.jsx
└── MileageFilter.jsx
```

Filter mục tiêu:

- Hãng/model.
- Khoảng giá.
- Năm.
- ODO.
- Nhiên liệu.
- Hộp số.
- Kiểu dáng.

## 4.2. Search

Search phải gọi Backend:

```text
GET /api/v1/vehicles
```

Không lấy toàn bộ 5.000 record rồi filter bằng JavaScript nếu API đã hỗ trợ server-side filter.

## 4.3. Pagination

Hiển thị:

```text
Previous
1 2 3 ...
Next
```

## 4.4. Sorting

Cho phép:

```text
Giá thấp → cao
Giá cao → thấp
Xe đời mới
ODO thấp
```

---

# 5. Increment 3 — Automated Pricing

## 5.1. Valuation Page

Vị trí:

```text
pages/ValuationPage.jsx
```

Components:

```text
components/valuation/
├── ValuationForm.jsx
└── ValuationResult.jsx
```

Form lấy chính xác feature contract từ TV4.

Ví dụ:

```text
Brand
Model
Manufacture Year
Mileage
Fuel
Transmission
...
```

## 5.2. Valuation API

Vị trí:

```text
services/valuationApi.js
```

Gọi:

```text
POST /api/v1/valuation
```

Hiển thị:

```text
Giá thị trường ước tính
Model version
```

## 5.3. Smart Tagging

Vehicle Card/Detail phải hiển thị:

```text
Giá rao
Giá dự đoán
Chênh lệch %
Nhãn:
- Giá tốt
- Giá hợp lý
- Giá cao
```

---

# 6. Increment 4 — Decision Support

## 6.1. Recommendation

Tạo:

```text
pages/RecommendationPage.jsx

components/recommendation/
├── RecommendationCard.jsx
└── RecommendationList.jsx
```

API:

```text
services/recommendationApi.js
```

Hiển thị:

```text
Top recommended vehicles
Recommendation Score
Reason
```

## 6.2. Compare

Tạo:

```text
pages/ComparePage.jsx

components/comparison/
├── CompareTable.jsx
└── CompareChart.jsx
```

Cho phép chọn 2–3 xe.

Hiển thị tối thiểu:

```text
Price
Predicted Price
Difference
Year
Mileage
Fuel
Transmission
Recommendation Score
```

## 6.3. Visualization

Dùng Recharts hoặc Plotly.

Biểu đồ tối thiểu:

- Giá rao bán vs giá dự đoán.
- So sánh score.
- Có thể thêm ODO/tuổi xe nếu cần.

---

# 7. UX & Responsive

Kiểm tra:

```text
Desktop
Tablet
Mobile
```

Các trạng thái phải có:

```text
Loading
Empty result
API error
Invalid input
No recommendation
```

---

# 8. Use Case Documentation

Vị trí:

```text
docs/UML/Use_Case/
```

TV2 phụ trách xây dựng/hoàn thiện:

- Actor.
- Search Vehicle.
- View Vehicle Detail.
- Valuation.
- Recommendation.
- Comparison.

TV2 phối hợp TV1 và TV5 để bảo đảm Use Case khớp hệ thống thực tế.

---

# 9. Nhiệm vụ bổ sung — Activity Diagram & Minh chứng giao diện

## 9.1. Activity Diagram

TV2 chịu trách nhiệm chính vẽ Activity Diagram cho các luồng nghiệp vụ có tương tác người dùng.

### Luồng ưu tiên
- Search / Filter Vehicle.
- Vehicle Detail.
- Automated Valuation.
- Recommendation.
- Comparison.

Không bắt buộc vẽ tất cả nếu báo cáo không yêu cầu; ưu tiên các luồng chính dùng trong Demo.

### Checklist
- Xác định điểm bắt đầu của người dùng.
- Thể hiện các bước xử lý chính.
- Thể hiện các decision/condition quan trọng.
- Thể hiện kết quả cuối cùng.
- Đối chiếu với chức năng Frontend thực tế.
- Đối chiếu API flow với TV1.
- Xuất file ảnh/PDF phục vụ báo cáo.

### Input
- Luồng chức năng thực tế trên ReactJS.
- API flow từ TV1.
- Workflow nghiệp vụ chung của nhóm.

### Output
- Activity Diagram khớp với luồng hệ thống thực tế.

### Bàn giao
- **TV5:** nhận diagram và mô tả để tổng hợp Báo cáo cuối kỳ.

## 9.2. Chuẩn bị UI Evidence cho Báo cáo và Slide

Sau khi giao diện ổn định, TV2 chịu trách nhiệm chuẩn bị hình ảnh minh chứng cho phần trình bày.

### Checklist
- Chụp màn hình Home Page.
- Chụp Vehicle List + Filter.
- Chụp Vehicle Detail.
- Chụp Valuation Form.
- Chụp Valuation Result.
- Chụp Recommendation.
- Chụp Comparison.
- Chọn ảnh giao diện rõ ràng, dữ liệu dễ đọc.
- Đặt tên file ảnh thống nhất.

### Input
- Frontend đã tích hợp với Backend.
- Dữ liệu Demo ổn định.

### Output
- Bộ ảnh giao diện phục vụ: Báo cáo, Slide, Demo.

### Bàn giao
- **TV5:** nhận bộ ảnh để tổng hợp Báo cáo và Slide.
- **Cả nhóm:** dùng chung bộ UI Evidence khi chuẩn bị Demo.

---

# 10. Tiêu chí nghiệm thu TV2

- React build/run thành công.
- Home page hoạt động.
- Vehicle list hoạt động.
- Vehicle detail hoạt động.
- Search/filter hoạt động.
- Pagination hoạt động.
- Valuation hoạt động.
- Smart Tagging hiển thị đúng.
- Recommendation hiển thị đúng.
- Compare 2–3 xe hoạt động.
- Chart hoạt động.
- Responsive.
- Không hard-code business result.

---

# 11. Bàn giao

### TV1

Bàn giao:

```text
API endpoints
Request/response
Error contract
```

### TV3

Không cần trực tiếp nhận code, chỉ cần nhận yêu cầu field để hiển thị.

### TV4

Nhận:

```text
Valuation input fields
Prediction output format
```

### TV5

Nhận:

```text
Recommendation response
Comparison data structure
```

### Toàn nhóm

Bàn giao:

```text
frontend/
docs/UML/Use_Case/
```

---

# 12. Nhiệm vụ bổ sung sau thay đổi phạm vi - Luồng nghiệp vụ Frontend

Phần này thay thế nhiệm vụ Recommendation/Comparison chưa triển khai. TV2 tập trung vào luồng đăng nhập, đăng tin, kiểm duyệt và đặt cọc giả lập.

## Việc đầu tiên

1. Đóng Gate I2: kết nối list/detail/filter với API TV1 và loại mock khỏi luồng nghiệm thu.
2. Đọc API/state contract TV5-TV1; liệt kê màn hình, request/response và error state.
3. Dựng UI skeleton theo contract frozen, không tự đặt status hoặc business rule.

## Tuần 1 - Auth và Seller UI

- Login/register và auth context/token handling.
- Route guard cho user/admin, đồng thời xử lý 401/403 từ server.
- My Listings: list, create, edit, submit review và withdraw.
- Hiển thị status và rejection reason rõ ràng.
- Có loading, empty, validation và server error state.

**Phụ thuộc:** Auth/Listing API TV1, API contract TV5.

**Bàn giao:** danh sách request mismatch cho TV1 trong ngày, demo seller flow cho leader.

## Tuần 2 - Moderation và Valuation UI

- Admin moderation queue/detail/approve/reject.
- Hiển thị listing price, predicted price, model version và AI warning.
- Valuation form/result cho người dùng.
- Hiển thị `AI_UNAVAILABLE` để Admin review thủ công; không hiện lỗi thô.
- Không chỉ dùng màu sắc để truyền đạt risk/status.

**Phụ thuộc:** moderation APIs TV1, prediction contract TV4.

**Bàn giao:** UI integration evidence và danh sách API/error chưa xử lý.

## Tuần 3 - Deposit và Admin dashboard

- Deposit confirmation, simulator result và lịch sử deposit của user.
- Admin ledger, lọc status, refund/release action có confirmation.
- Dashboard tối thiểu: listing theo status, deposit amount theo status, giao dịch theo thời gian, top brand/model, price bands và model request/error count.
- Chạy hai golden flows và negative cases với TV5.

**Nghiệm thu:** reload không mất auth hợp lệ; 401/403/404/409/422/503 có UI state; không duplicate submit khi bấm nút nhiều lần.

## Không làm trong scope mới

- Lịch xem xe/lái thử, chat, yêu thích và notification.
- Giỏ hàng và checkout toàn bộ giá xe.
- Recommendation/Comparison mới nếu chưa có sẵn.
- Dashboard realtime; chỉ cần aggregate API và chart cơ bản.
