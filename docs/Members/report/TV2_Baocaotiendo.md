# BÁO CÁO TIẾN ĐỘ THÀNH VIÊN 02 (TV2) — FRONTEND DEVELOPER

---

## INCREMENT 1 — FOUNDATION

### Báo cáo Task 1: Khởi tạo React + Vite Project

- **Việc đã hoàn thành:**
  - Khởi tạo thành công project React + Vite trong thư mục `frontend/`.
  - Cài đặt đầy đủ các dependencies cốt lõi: `axios`, `react-router-dom`, `react-icons`, `@vitejs/plugin-react`.
  - Cấu hình file `vite.config.js` có sẵn proxy chuyển tiếp request `/api` về Backend Spring Boot (`http://localhost:8080`).
  - Tạo template `index.html`, entry point `src/main.jsx`, `src/App.jsx`.
  - Tạo file cấu hình môi trường `.env.example` chứa biến `VITE_API_BASE_URL=http://localhost:8080/api/v1` và tạo `.env` local.
  - Test build production (`npm run build`) thành công 100%.

- **Sinh ra file/module gì:**
  - `frontend/package.json` & `frontend/package-lock.json`
  - `frontend/vite.config.js`
  - `frontend/index.html`
  - `frontend/.env.example`
  - `frontend/src/main.jsx`
  - `frontend/src/App.jsx`

- **Để làm gì:**
  - Làm nền tảng ứng dụng Frontend SPA (Single Page Application) cho toàn bộ hệ thống Used-Car Smart Decision Support System.
  - Sẵn sàng tích hợp Router, Service API và các UI component ở các task tiếp theo.

- **Bàn giao lại cho ai:**
  - TV2 tiếp tục thực hiện Task 2 (Setup cấu trúc thư mục).
  - Toàn team (đặc biệt TV1 Backend) nắm được cấu hình API base URL và proxy dev server.

- **Còn thiếu hay cần bổ sung gì:**
  - Chưa tổ chức đầy đủ cấu trúc thư mục phân lớp bên trong `src/` (Sẽ làm ở Task 2).
  - Chưa có layout dùng chung (Navbar, Footer...) và các trang (Sẽ làm ở Task 3 & 4).

- **Cách thức và thao tác Run/Debug hoặc test thử:**
  - Di chuyển vào thư mục frontend: `cd frontend`
  - Cài dependencies (nếu clone mới): `npm install`
  - Khởi chạy dev server: `npm run dev` (mặc định tại port `http://localhost:5173`)
  - Kiểm tra build: `npm run build`

- **Chú ý/ Ghi chú:**
  - File `.env` chứa cấu hình local đã được đưa vào `.gitignore` để bảo mật, chỉ commit file `.env.example`.

---

### Báo cáo Task 2: Cấu trúc thư mục dự án

- **Việc đã hoàn thành:**
  - Chuẩn hóa toàn bộ kiến trúc thư mục nguồn theo tiêu chuẩn module React bên trong `frontend/src/`.
  - Di chuyển và tổ chức các thư mục phân lớp (`pages`, `services`, `hooks`, `context`, `utils`, `styles`) vào trong `frontend/src/`.
  - Thiết lập đầy đủ các phân khu component chuyên biệt:
    - `components/common/`: components dùng chung cho toàn ứng dụng.
    - `components/vehicle/`: components hiển thị thẻ xe, lưới xe, chi tiết xe (Inc 1).
    - `components/filter/`: bộ lọc tìm kiếm (Inc 2).
    - `components/valuation/`: form và kết quả định giá tự động (Inc 3).
    - `components/recommendation/`: danh sách và thẻ xe đề xuất (Inc 4).
    - `components/comparison/`: bảng và biểu đồ so sánh xe (Inc 4).
  - Loại bỏ các file rác và boilerplate mặc định.

- **Sinh ra file/module gì:**
  - Cấu trúc cây thư mục chuẩn trong `frontend/src/`:
    ```
    frontend/src/
    ├── assets/
    │   ├── icons/
    │   └── images/
    ├── components/
    │   ├── common/
    │   ├── vehicle/
    │   ├── filter/
    │   ├── valuation/
    │   ├── recommendation/
    │   └── comparison/
    ├── context/
    ├── hooks/
    ├── pages/
    ├── services/
    ├── styles/
    ├── utils/
    ├── App.jsx
    └── main.jsx
    ```

- **Để làm gì:**
  - Giúp dự án có cấu trúc rõ ràng, dễ mở rộng và tuân thủ nguyên tắc separation of concerns.
  - Sẵn sàng triển khai các components layout (Navbar, Footer, Loading...) ở Task 3 và Vehicle UI ở Task 4.

- **Bàn giao lại cho ai:**
  - TV2 tiếp tục thực hiện Task 3 (Layout chung: Navbar, Footer, Loading, ErrorMessage, Router).

- **Còn thiếu hay cần bổ sung gì:**
  - Chưa triển khai code các component cụ thể trong `components/common` và routing trong `App.jsx` (Sẽ làm ở Task 3).

- **Cách thức và thao tác Run/Debug hoặc test thử:**
  - Kiểm tra cây thư mục: `Get-ChildItem -Recurse frontend/src`
  - Build thử nghiệm: `cd frontend; npm run build`

- **Chú ý/ Ghi chú:**
  - Các thư mục dành cho Increment 2, 3, 4 đã được tạo sẵn file `.gitkeep` để duy trì track trên Git.

---

### Báo cáo Task 3: Layout chung & Cấu hình Điều hướng (Router)

- **Việc đã hoàn thành:**
  - Xây dựng hệ thống stylesheet toàn cục `src/styles/global.css` chứa CSS variables (bảng màu, spacing, font, shadows), reset CSS và các class tiện ích dùng chung (`.btn`, `.btn-primary`, `.main-content`).
  - Xây dựng component `Navbar` (`src/components/common/Navbar.jsx` & `Navbar.css`): hiển thị logo xe thông minh, tiêu đề hệ thống, các navigation links với hiệu ứng active, badge đánh dấu các chức năng của Increment tương lai (Inc 3, Inc 4), hỗ trợ responsive menu toggle cho mobile/tablet.
  - Xây dựng component `Footer` (`src/components/common/Footer.jsx` & `Footer.css`): hiển thị thông tin đồ án chuyên ngành, HCMUTE, phân công 5 thành viên của nhóm và copyright.
  - Xây dựng component `Loading` (`src/components/common/Loading.jsx` & `Loading.css`): spinner xoay kèm thông báo tùy biến qua props `message`.
  - Xây dựng component `ErrorMessage` (`src/components/common/ErrorMessage.jsx` & `ErrorMessage.css`): thẻ hiển thị lỗi trực quan kèm icon cảnh báo và nút callback `onRetry`.
  - Khởi tạo 3 trang cơ bản `HomePage.jsx`, `VehicleListPage.jsx`, `VehicleDetailPage.jsx` làm placeholder cho các route.
  - Tích hợp React Router trong `src/App.jsx` với các route:
    - `/` → HomePage
    - `/vehicles` → VehicleListPage
    - `/vehicles/:id` → VehicleDetailPage
  - Kiểm tra build thành công 100% không có cảnh báo hay lỗi cú pháp.

- **Sinh ra file/module gì:**
  - `frontend/src/styles/global.css`
  - `frontend/src/components/common/Navbar.jsx` & `Navbar.css`
  - `frontend/src/components/common/Footer.jsx` & `Footer.css`
  - `frontend/src/components/common/Loading.jsx` & `Loading.css`
  - `frontend/src/components/common/ErrorMessage.jsx` & `ErrorMessage.css`
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/pages/VehicleListPage.jsx`
  - `frontend/src/pages/VehicleDetailPage.jsx`
  - `frontend/src/App.jsx` (cập nhật router & layout wrapper)

- **Để làm gì:**
  - Định hình khung giao diện (Shell/Layout) cố định và nhất quán cho toàn bộ ứng dụng.
  - Cung cấp sẵn cơ chế điều hướng trang mượt mà (SPA Routing) và các trạng thái nạp dữ liệu / báo lỗi tiêu chuẩn để sử dụng xuyên suốt các Increment.

- **Bàn giao lại cho ai:**
  - TV2 tiếp tục thực hiện Task 4 (Xây dựng Vehicle UI Components: VehicleCard, VehicleGrid, VehicleInfo, Formatter và các trang hoàn chỉnh).

- **Còn thiếu hay cần bổ sung gì:**
  - Các trang `VehicleListPage` và `VehicleDetailPage` hiện chỉ là placeholder, cần xây dựng bộ components hiển thị thông tin xe chi tiết và gắn mock data (Sẽ làm ở Task 4).

- **Cách thức và thao tác Run/Debug hoặc test thử:**
  - Khởi chạy dev server: `cd frontend; npm run dev`
  - Mở trình duyệt tại `http://localhost:5173/` để kiểm tra Navbar, Footer.
  - Bấm vào menu "Danh sách xe" để chuyển route sang `/vehicles`.
  - Thử nghiệm trên DevTools ở các kích thước màn hình Mobile/Tablet/Desktop.
  - Kiểm tra build: `npm run build`

- **Chú ý/ Ghi chú:**
  - Đã tích hợp các icon vector từ thư viện `react-icons/fa` tối ưu hiệu năng và thẩm mỹ.

---

### Báo cáo Task 4: Vehicle UI Components & Các Trang Chức Năng Hoàn Chỉnh

- **Việc đã hoàn thành:**
  - Xây dựng module tiện ích định dạng dữ liệu `src/utils/formatters.js`:
    - `formatPrice`: chuyển đổi số tiền VND sang dạng rút gọn (triệu / tỷ) dễ đọc trên giao diện thẻ xe.
    - `formatFullPrice`: định dạng giá tiền chuẩn có phân tách hàng nghìn và ký hiệu ₫.
    - `formatMileage`: định dạng số km đã đi kèm hậu tố "km".
    - `formatYear`: hiển thị năm sản xuất xe.
  - Xây dựng tập mock data thực tế `src/utils/mockVehicles.js` gồm 8 mẫu xe phổ biến tại Việt Nam (Toyota Vios, Mazda 3, Honda CR-V, Hyundai Accent, Kia Seltos, Ford Everest, Toyota Corolla Cross, Mitsubishi Xpander) với đầy đủ thông số kỹ thuật chuẩn schema.
  - Xây dựng component `VehicleCard` (`src/components/vehicle/VehicleCard.jsx` & `VehicleCard.css`):
    - Hiển thị hình ảnh xe kèm cơ chế fallback ảnh mặc định khi link lỗi.
    - Badge năm sản xuất, hãng xe, tên dòng xe, phiên bản, giá tiền nổi bật màu đỏ.
    - Lưới thông số tóm tắt: ODO (km), loại nhiên liệu, hộp số, địa điểm đăng bán.
    - Hiệu ứng hover nổi khối (elevation) và liên kết điều hướng trực tiếp sang trang chi tiết `/vehicles/:id`.
  - Xây dựng component `VehicleGrid` (`src/components/vehicle/VehicleGrid.jsx` & `VehicleGrid.css`):
    - Layout CSS Grid responsive tự động thích ứng trên mọi độ phân giải màn hình.
    - Xử lý đồng bộ các trạng thái: nạp dữ liệu (`Loading`), lỗi kết nối (`ErrorMessage`), hoặc không có dữ liệu (thẻ thông báo rỗng kèm icon).
  - Xây dựng component `VehicleInfo` (`src/components/vehicle/VehicleInfo.jsx` & `VehicleInfo.css`):
    - Trình bày chi tiết toàn diện thông số kỹ thuật (Năm sản xuất, ODO, Nhiên liệu, Hộp số, Kiểu dáng, Nơi bán).
    - Khung mô tả chi tiết từ người bán và nút bấm mở tin đăng gốc sàn thương mại điện tử (`source_url`).
  - Hoàn thiện 3 trang chính:
    - `HomePage.jsx`: Hero banner giới thiệu hệ thống, 3 khối tính năng cốt lõi (Dữ liệu thực tế, Định giá tự động AI, Gợi ý & So sánh), và danh sách 4 xe nổi bật (Featured Vehicles).
    - `VehicleListPage.jsx`: Danh sách xe đang có sẵn, badge tổng số lượng xe và lưới hiển thị `VehicleGrid`.
    - `VehicleDetailPage.jsx`: Lấy `id` từ URL param, tìm kiếm xe, thanh breadcrumb điều hướng, nút quay lại và hiển thị `VehicleInfo` (có xử lý báo lỗi nếu mã xe không tồn tại).
  - Kiểm tra build production thành công tuyệt đối (`npm run build`).

- **Sinh ra file/module gì:**
  - `frontend/src/utils/formatters.js`
  - `frontend/src/utils/mockVehicles.js`
  - `frontend/src/components/vehicle/VehicleCard.jsx` & `VehicleCard.css`
  - `frontend/src/components/vehicle/VehicleGrid.jsx` & `VehicleGrid.css`
  - `frontend/src/components/vehicle/VehicleInfo.jsx` & `VehicleInfo.css`
  - `frontend/src/pages/HomePage.jsx` & `HomePage.css`
  - `frontend/src/pages/VehicleListPage.jsx` & `VehicleListPage.css`
  - `frontend/src/pages/VehicleDetailPage.jsx` & `VehicleDetailPage.css`

- **Để làm gì:**
  - Hoàn thành trọn vẹn lớp giao diện người dùng (UI) cho Increment 1 theo đúng nhiệm vụ phân công của TV2.
  - Cung cấp trải nghiệm duyệt xe, xem chi tiết xe mượt mà, trực quan trước khi kết nối dữ liệu thật từ Backend.

- **Bàn giao lại cho ai:**
  - TV2 tiếp tục thực hiện Task 5 (Xây dựng Service Layer: `api.js` và `vehicleApi.js` để tích hợp REST API).
  - TV1 (Backend): đối chiếu các trường dữ liệu xe trên UI (`price`, `mileage`, `manufacture_year`, `fuel_type`, `transmission`, `body_type`, `location`) để đồng bộ DTO.

- **Còn thiếu hay cần bổ sung gì:**
  - Dữ liệu hiện tại đang đọc từ `mockVehicles.js`, cần đóng gói qua service layer `vehicleApi` (Sẽ làm ở Task 5).
  - Bộ lọc chi tiết (FilterPanel, PriceFilter, YearFilter) sẽ được phát triển chuyên sâu ở Increment 2.

- **Cách thức và thao tác Run/Debug hoặc test thử:**
  - Chạy dev server: `cd frontend; npm run dev`
  - Truy cập `http://localhost:5173/` để xem HomePage và các xe nổi bật.
  - Bấm "Xem danh sách xe" hoặc vào menu "Danh sách xe" để xem toàn bộ 8 xe mẫu.
  - Bấm vào bất kỳ thẻ xe nào để kiểm tra trang chi tiết `/vehicles/:id`.
  - Thử nhập URL không tồn tại như `/vehicles/999` để kiểm tra màn hình báo lỗi `ErrorMessage`.
  - Kiểm tra build: `npm run build`

- **Chú ý/ Ghi chú:**
  - Thiết kế tuân thủ tính responsive cao, hỗ trợ mượt mà từ màn hình điện thoại (360px) đến màn hình desktop lớn (1280px+).

---

### Báo cáo Task 5: Xây dựng Service Layer (Axios & Vehicle API)

- **Việc đã hoàn thành:**
  - Xây dựng module cấu hình HTTP Client tập trung `src/services/api.js`:
    - Khởi tạo Axios instance với `baseURL` động từ biến môi trường `import.meta.env.VITE_API_BASE_URL` (fallback `http://localhost:8080/api/v1`).
    - Thiết lập timeout 10.000ms tránh treo request.
    - Cấu hình request và response interceptor: tự động bóc tách `response.data` và chuẩn hóa thông điệp lỗi tiếng Việt thân thiện theo mã HTTP (404, 500, lỗi mất kết nối máy chủ).
  - Xây dựng service chuyên biệt `src/services/vehicleApi.js`:
    - Hàm `getVehicles(params)`: gọi endpoint REST `GET /vehicles` của Spring Boot (hỗ trợ phân trang, bộ lọc). Tự động fallback về mock data khi Backend chưa khởi động để đảm bảo UI hoạt động thông suốt.
    - Hàm `getVehicleById(id)`: gọi endpoint REST `GET /vehicles/{id}` lấy chi tiết một chiếc xe kèm cơ chế fallback an toàn.
  - Cập nhật các trang `VehicleListPage.jsx` và `VehicleDetailPage.jsx`:
    - Chuyển đổi từ dữ liệu tĩnh sang cơ chế tải dữ liệu bất đồng bộ qua `vehicleApi` bên trong React `useEffect` hook.
    - Quản lý đầy đủ các state: `isLoading`, `error`, và dữ liệu xe.
    - Cung cấp nút bấm "Thử lại" (`onRetry`) khi xảy ra lỗi kết nối.
  - Kiểm tra build production thành công 100% không lỗi.

- **Sinh ra file/module gì:**
  - `frontend/src/services/api.js` (Axios HTTP client instance)
  - `frontend/src/services/vehicleApi.js` (Vehicle REST API service layer)
  - Cập nhật `frontend/src/pages/VehicleListPage.jsx`
  - Cập nhật `frontend/src/pages/VehicleDetailPage.jsx`

- **Để làm gì:**
  - Tách biệt hoàn toàn tầng logic gọi API (Service Layer) khỏi tầng giao diện (Presentation Layer) theo nguyên tắc clean architecture.
  - Chuẩn bị sẵn cổng kết nối hoàn chỉnh với Backend Spring Boot của TV1 cho các Increment tiếp theo.

- **Bàn giao lại cho ai:**
  - TV2 tiếp tục thực hiện Task 6 (Kiểm tra tổng thể toàn bộ Increment 1, nghiệm thu và tổng kết báo cáo).
  - TV1 (Backend): sẵn sàng tích hợp ngay khi endpoint `GET /api/v1/vehicles` và `GET /api/v1/vehicles/{id}` được triển khai trên Spring Boot.

- **Còn thiếu hay cần bổ sung gì:**
  - Backend Spring Boot của TV1 hiện chưa triển khai thực tế trên máy, Frontend đang kích hoạt chế độ fallback an toàn. Khi TV1 có API thật, chỉ cần chạy song song backend là frontend tự động ăn dữ liệu từ Database mà không cần sửa code.

- **Cách thức và thao tác Run/Debug hoặc test thử:**
  - Khởi chạy dev server: `cd frontend; npm run dev`
  - Mở console trình duyệt (F12) để quan sát log cảnh báo fallback của service khi Backend chưa bật.
  - Kiểm tra danh sách xe vẫn tải mượt mà kèm hiệu ứng loading.
  - Bấm vào một xe để kiểm tra trang chi tiết tải dữ liệu bất đồng bộ.
  - Kiểm tra build: `npm run build`

- **Chú ý/ Ghi chú:**
  - Các hàm API đều có chú thích JSDoc rõ ràng, dễ bảo trì và mở rộng thêm các tham số filter cho Increment 2.

---

### Báo cáo Task 6: Kiểm tra tổng thể & Nghiệm thu Increment 1 (Foundation)

- **Việc đã hoàn thành:**
  - Thực hiện kiểm thử tích hợp toàn bộ các trang và component của Frontend:
    - [x] Chạy lệnh `npm run build` thành công, không sinh ra bất kỳ warning hay lỗi bundle.
    - [x] Kiểm tra route `/` (HomePage): hiển thị Hero banner, 3 khối tính năng chính, 4 xe nổi bật (Featured Vehicles) có link dẫn sang chi tiết.
    - [x] Kiểm tra route `/vehicles` (VehicleListPage): hiển thị tổng số xe và lưới danh sách xe `VehicleGrid` nạp qua service bất đồng bộ.
    - [x] Kiểm tra route `/vehicles/:id` (VehicleDetailPage): nạp thông tin xe theo ID, breadcrumb điều hướng, bảng thông số kỹ thuật chi tiết, mô tả và liên kết nguồn tin rao.
    - [x] Kiểm tra trường hợp ID không tồn tại (vd: `/vehicles/999`): hiển thị `ErrorMessage` và nút quay lại danh sách thân thiện.
    - [x] Kiểm tra thanh điều hướng `Navbar`: chuyển trang SPA mượt mà không reload, có menu toggle trên màn hình di động.
    - [x] Kiểm tra tính Responsive trên Chrome DevTools ở các mốc: 375px (Mobile), 768px (Tablet), 1024px (Laptop), 1280px+ (Desktop).
    - [x] File `.env.example` và `.env` được cấu hình chuẩn mực, không lộ secret.
  - Hoàn tất 100% mục tiêu của **Increment 1 — Foundation** được giao cho Thành viên 02 (TV2).

- **Sinh ra file/module gì:**
  - Bộ mã nguồn hoàn chỉnh của ứng dụng Frontend trong thư mục `frontend/src/`:
    - 5 Components dùng chung: `Navbar`, `Footer`, `Loading`, `ErrorMessage`, `App.jsx`.
    - 3 Components xe chuyên biệt: `VehicleCard`, `VehicleGrid`, `VehicleInfo`.
    - 3 Trang hoàn chỉnh: `HomePage`, `VehicleListPage`, `VehicleDetailPage`.
    - 2 Service kết nối mạng: `api.js`, `vehicleApi.js`.
    - 2 Utility xử lý dữ liệu: `formatters.js`, `mockVehicles.js`.
    - Cấu hình dự án: `package.json`, `vite.config.js`, `index.html`, `.env.example`.

- **Để làm gì:**
  - Đóng gói trọn vẹn Increment 1 (Foundation) tạo nền tảng vững chắc để chuyển giao và phối hợp với các thành viên khác ở Increment 2.

- **Bàn giao lại cho ai:**
  - **TV5 (Testing Lead):** bàn giao mã nguồn Frontend và quy trình chạy thử để thực hiện kiểm thử nghiệm thu Increment 1.
  - **TV1 (Backend):** bàn giao API contract (`GET /api/v1/vehicles`, `GET /api/v1/vehicles/{id}`) để Backend hoàn tất endpoint tương ứng.
  - **Toàn nhóm:** sẵn sàng bước vào Increment 2 — Market Data (Xây dựng FilterPanel, PriceFilter, YearFilter, Pagination, Sorting).

- **Còn thiếu hay cần bổ sung gì:**
  - Không còn thiếu sót nào thuộc phạm vi Increment 1.
  - Các tính năng nâng cao (Bộ lọc tìm kiếm, Phân trang server-side) thuộc phạm vi của Increment 2 sẽ được thực hiện khi chuyển sang Increment 2.

- **Cách thức và thao tác Run/Debug hoặc test thử:**
  1. `cd frontend`
  2. `npm install` (nếu clone máy mới)
  3. `npm run dev` → Mở `http://localhost:5173` trên trình duyệt.
  4. Trải nghiệm luồng điều hướng: Trang chủ → Xem danh sách xe → Bấm xem chi tiết từng xe.

- **Chú ý/ Ghi chú:**
  - Tất cả mã nguồn tuân thủ tiêu chuẩn code sạch (Clean Code), đặt tên biến/hàm nhất quán và có CSS chuyên biệt theo từng component.

---

### Bổ sung: Tinh chỉnh UX/UI theo phong cách Decision Support System (Hình ảnh mẫu)

- **Việc đã hoàn thành:**
  - Cập nhật toàn bộ hệ thống màu sắc theo phong cách chuyên nghiệp, hiện đại:
    - Nền Navbar / Hero / Footer: Xanh than đậm cao cấp (`#16202c`).
    - Nền các Section nội dung: Màu kem ngà ấm áp (`#f4f2ee`), không gây mỏi mắt.
    - Màu điểm nhấn thương hiệu: Vàng cát / Amber ánh đồng (`#c69242`).
  - Thiết kế lại trang chủ `HomePage.jsx` chuẩn theo layout tham khảo:
    - Hero headline sắc sảo: "Biết giá thật của một chiếc xe cũ, trước khi bạn đặt cọc."
    - Tích hợp khung **ƯỚC TÍNH NHANH** bên phải (Quick Estimator Card): hỗ trợ chọn Hãng, Dòng xe, Năm, Số km và hiển thị khoảng giá ước tính kèm thanh đo độ tin cậy mô hình (92%).
    - Bổ sung thanh **Thống kê Thị trường (Market KPI Bar)** hiển thị các chỉ số cốt lõi: 128.450 tin đăng theo dõi, 15 phút cập nhật, 4,2% sai số MAPE, 3.200+ giao dịch/tháng.
    - Khu vực **Gợi ý xe theo mức độ hời**: các thẻ xe hiển thị nhãn Smart Tag nổi bật (Giá tốt - xanh lá, Đúng giá thị trường - xanh dương, Cao hơn thị trường - cam đỏ).
    - Khối **4 bước quy trình mô hình** (Thu thập dữ liệu, Làm sạch & chuẩn hóa, Mô hình định giá, Gợi ý & độ tin cậy).
  - Tinh chỉnh các trang `VehicleListPage.jsx` và `VehicleDetailPage.jsx` đồng bộ phong cách tối giản, sang trọng.
  - Kiểm tra build thành công 100% không phát sinh lỗi.

---

## INCREMENT 2 — MARKET DATA & FILTERING (19/09/2026)

### Báo cáo: Tích hợp API Market Data, Bộ Lọc Đa Tiêu Chí & Phân Trang

- **Việc đã hoàn thành:**
  - **Tích hợp API chính thức từ TV1 Backend:**
    - Cập nhật service layer `src/services/vehicleApi.js` kết nối trực tiếp với endpoint `GET /api/v1/listings` (tìm kiếm, lọc, phân trang, sắp xếp) và `GET /api/v1/listings/{id}` (chi tiết tin đăng phẳng `ListingResponseDto`).
    - Xử lý cấu trúc bọc phân trang của Spring Data `PageResponse`: `{ content, page, size, totalElements, totalPages, isFirst, isLast }`.
    - Bảo toàn cơ chế fallback an toàn tự động lọc trên `MOCK_VEHICLES` khi Backend chưa khởi động, đảm bảo trải nghiệm người dùng liên tục.
  - **Xây dựng Component Bộ lọc Tìm kiếm `FilterPanel` (`src/components/filter/FilterPanel.jsx` & `FilterPanel.css`):**
    - Ô tìm kiếm từ khóa đa năng (`keyword`): tìm kiếm theo tên xe, dòng xe, phiên bản hoặc địa điểm.
    - Bộ chọn Hãng xe (`brand`): Toyota, Mazda, Honda, Hyundai, Kia, Ford, Mitsubishi...
    - Bộ chọn Khoảng giá (`minPrice`, `maxPrice`): Dưới 500 triệu, 500 - 700 triệu, 700 triệu - 1 tỷ, Trên 1 tỷ.
    - Bộ chọn Nhiên liệu (`fuelType`): Xăng, Dầu, Hybrid, Điện.
    - Bộ chọn Hộp số (`transmission`): Tự động, Số sàn.
    - Tùy chọn Sắp xếp (`sort`): Mới nhất, Giá tăng dần, Giá giảm dần, Năm sản xuất mới nhất, ODO ít nhất.
    - Nút "Đặt lại" (`onReset`) giúp đưa bộ lọc về trạng thái ban đầu chỉ với 1 click.
  - **Nâng cấp Giao diện Danh sách xe `VehicleListPage.jsx`:**
    - Kết nối `FilterPanel` đồng bộ với query params gọi API bất đồng bộ.
    - Tự động reset về trang 1 khi người dùng thay đổi tiêu chí lọc để tránh lỗi lệch trang.
    - Tích hợp thanh điều khiển phân trang (`pagination-wrapper`) gồm nút "Trang trước", "Trang sau" (tự động disable khi ở đầu/cuối trang) và hiển thị trang hiện tại / tổng số trang.
    - Badge hiển thị số lượng tin đăng tìm thấy theo thời gian thực.
  - **Nâng cấp Hiển thị Dữ liệu Xe `VehicleCard` & `VehicleInfo`:**
    - Bổ sung hiển thị đầy đủ các trường dữ liệu được bổ sung từ Emergency Mission (DDL Schema v2.0.1 và Data Contract 17 trường):
      - `seatCount`: Số chỗ ngồi (vd: 5 chỗ, 7 chỗ).
      - `engineSize`: Dung tích động cơ (vd: 1.5L, 2.0L).
      - `origin`: Xuất xứ (Lắp ráp trong nước / Nhập khẩu).
      - `color`: Màu sắc ngoại thất.
      - `sourceName`: Tên sàn giao dịch nguồn (Chợ Tốt / Bốn Bánh) với badge trực quan trên ảnh card.
      - `sourceUrl`: Nút liên kết chuyển hướng sang tin đăng gốc của sàn.
    - Xử lý linh hoạt cả 2 quy ước đặt tên `camelCase` (JPA DTO) và `snake_case` (JSON Alias).
    - Xử lý an toàn trường hợp các thông số kỹ thuật tùy chọn bị `null`.
  - **Kiểm thử & Build:**
    - Chạy `npm run build` thành công 100%, 0 warning, 0 error.

- **Sinh ra file/module gì:**
  - `frontend/src/components/filter/FilterPanel.jsx` & `FilterPanel.css` (Component bộ lọc tìm kiếm mới)
  - Cập nhật `frontend/src/services/vehicleApi.js` (Kết nối `GET /api/v1/listings`)
  - Cập nhật `frontend/src/utils/mockVehicles.js` (Bổ sung 17 trường dữ liệu chuẩn)
  - Cập nhật `frontend/src/components/vehicle/VehicleCard.jsx` & `VehicleCard.css`
  - Cập nhật `frontend/src/components/vehicle/VehicleInfo.jsx` & `VehicleInfo.css`
  - Cập nhật `frontend/src/pages/VehicleListPage.jsx` & `VehicleListPage.css`
  - Cập nhật `frontend/src/pages/VehicleDetailPage.jsx`

- **Để làm gì:**
  - Hoàn thành đầy đủ mục tiêu của **Increment 2 — Market Data** theo sự điều phối của Emergency Mission và bàn giao từ TV1.
  - Giúp người dùng dễ dàng tìm kiếm, sàng lọc và xem chi tiết các mẫu xe trên thị trường theo nhiều tiêu chí đa dạng.

- **Bàn giao lại cho ai:**
  - **TV1 (Backend):** Frontend đã sẵn sàng tiêu thụ toàn bộ các query params và response DTO của endpoint `GET /api/v1/listings`.
  - **TV5 (Database & Testing):** Bàn giao giao diện và bộ lọc để TV5 thực hiện các Test Case kiểm thử tích hợp (End-to-End Test) giữa UI và Database thật.
  - **TV4 (Machine Learning):** Sẵn sàng bước vào Increment 3 — Tích hợp Form định giá xe tự động.

- **Còn thiếu hay cần bổ sung gì:**
  - Increment 2 cho phần Frontend đã hoàn thiện đầy đủ.
  - Chuẩn bị sẵn sàng cho Increment 3 (Form nhập thông số định giá tự động và hiển thị khoảng giá dự đoán từ mô hình R Plumber).

- **Cách thức và thao tác Run/Debug hoặc test thử:**
  1. Di chuyển vào thư mục frontend: `cd frontend`
  2. Khởi chạy dev server: `npm run dev`
  3. Mở trình duyệt tại `http://localhost:5173/vehicles`
  4. Thử nghiệm các tính năng:
     - Gõ từ khóa vào ô tìm kiếm (vd: "Toyota", "Mazda", "Đà Nẵng").
     - Chọn hãng xe trong dropdown.
     - Chọn khoảng giá và nhiên liệu.
     - Thử bấm nút "Đặt lại" để xem bộ lọc khôi phục.
     - Bấm vào một tin đăng để xem bảng thông số kỹ thuật chi tiết (có số chỗ, dung tích động cơ, xuất xứ, màu sắc, sàn đăng tin).
  5. Kiểm tra build: `npm run build`

- **Chú ý/ Ghi chú:**
  - Mã nguồn đã được kiểm tra kỹ lưỡng ở local, **chưa commit và chưa push lên remote Git** theo đúng yêu cầu của người dùng để chờ review.

---

### Bổ sung: Tích hợp Logo Nhận Diện Chính Thức & Hoàn Thiện Layout

- **Việc đã hoàn thành:**
  - Khắc phục triệt để tình trạng hiển thị lặp văn bản và logo ở Header (`Navbar.jsx`) và Footer (`Footer.jsx`).
  - Tích hợp bộ nhận diện thương hiệu chính thức từ file thiết kế `logo.svg` của nhóm:
    - Hiển thị logo SVG sắc nét trên thanh điều hướng `Navbar`.
    - Hiển thị logo SVG đồng bộ tại chân trang `Footer`.
    - Cập nhật biểu tượng Favicon tab trình duyệt (`index.html`) trỏ đến `logo.svg`.
  - Di chuyển và lưu trữ tài nguyên logo an toàn tại `frontend/src/assets/icons/logo.svg` và `frontend/public/logo.svg`, dọn dẹp thư mục tạm `logo/`.
  - Kiểm tra build production thành công 100% không phát sinh cảnh báo.
