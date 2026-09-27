# TV1.md — Backend & System Integration

> **Cập nhật phạm vi ngày 27/09/2026:** Mục 14 ở cuối tài liệu và `scope_change_mission.md` là nhiệm vụ hiện hành. Khi có mâu thuẫn, nội dung mới thay thế phần Recommendation/Comparison cũ.

## 1. Vai trò

**Vai trò:** Backend Developer & System Integration Lead

TV1 phụ trách xây dựng Core Backend bằng Java Spring Boot, kết nối PostgreSQL, giao tiếp với R Model API và tích hợp các nghiệp vụ chính của hệ thống.

### Phạm vi chính

```text
backend/
docker-compose.yml
docs/UML/Sequence_Diagram/
docs/UML/Deployment_Diagram/
```

TV1 không chịu trách nhiệm chính về:
- Giao diện React.
- Logic crawl dữ liệu.
- Huấn luyện Regression.
- Thiết kế Recommendation thuật toán chi tiết.

TV1 chịu trách nhiệm biến các module đó thành một hệ thống có thể giao tiếp với nhau.

---

# 2. Nguyên tắc làm việc

- Không truy cập PostgreSQL trực tiếp từ Frontend.
- Frontend chỉ gọi REST API của Spring Boot.
- Spring Boot giao tiếp với PostgreSQL bằng JPA/Repository.
- Spring Boot giao tiếp với R Plumber bằng HTTP qua `RModelClient`.
- Không nhúng code R trực tiếp vào Java.
- Không đưa mật khẩu Database/API thật vào Git.
- API phải có validation và xử lý lỗi cơ bản.

Luồng tổng quát:

```text
React
  ↓ HTTP/JSON
Spring Boot
  ├── PostgreSQL
  └── R Plumber
```

---

# 3. Increment 1 — Foundation

## 3.1. Khởi tạo Spring Boot

Vị trí:

```text
backend/
├── pom.xml
├── mvnw
├── mvnw.cmd
└── src/
```

Cần cấu hình tối thiểu:

- Tích hợp Swagger/OpenAPI vào Spring Boot Backend
- Spring Web.
- Spring Data JPA.
- PostgreSQL Driver.
- Validation.
- Lombok nếu nhóm thống nhất sử dụng.

Kiểm tra:

```bash
./mvnw clean test
```

hoặc trên Windows:

```powershell
.\mvnw.cmd clean test
```

## 3.2. Xây dựng cấu trúc package

Tạo:

```text
backend/src/main/java/com/system/

├── config/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
├── mapper/
├── client/
├── exception/
└── util/
```

## 3.3. Cấu hình Database

Vị trí:

```text
backend/src/main/resources/
├── application.properties
├── application-dev.properties
└── application-prod.properties
```

Cấu hình kết nối PostgreSQL theo environment variable.

Không hard-code password.

## 3.4. Vehicle CRUD

Phối hợp với TV5 để xác định schema.

Tạo:

```text
entity/Vehicle.java
repository/VehicleRepository.java
service/VehicleService.java
controller/VehicleController.java
dto/vehicle/
```

Chức năng:

```text
Create
Read
Update
Delete
Get by ID
Get all
```

API dự kiến:

```text
GET    /api/v1/vehicles
GET    /api/v1/vehicles/{id}
POST   /api/v1/vehicles
PUT    /api/v1/vehicles/{id}
DELETE /api/v1/vehicles/{id}
```

## 3.5. Listing

Tạo các thành phần tương ứng:

```text
Listing.java
ListingRepository.java
ListingService.java
ListingController.java
dto/listing/
```

Thực hiện các API đọc dữ liệu Listing cơ bản.

## 3.6. Exception Handling

Vị trí:

```text
backend/.../exception/
```

Tạo:

```text
GlobalExceptionHandler.java
ResourceNotFoundException.java
```

API cần trả lỗi có cấu trúc thay vì stack trace.

---

# 4. Increment 2 — Market Data

## 4.1. Search API

Phụ trách API tìm kiếm:

```text
GET /api/v1/vehicles
```

Hỗ trợ các điều kiện:

- Brand.
- Model.
- Price min/max.
- Manufacture year min/max.
- Mileage min/max.
- Fuel type.
- Transmission.
- Body type.
- Location nếu cần.

## 4.2. Pagination

Hỗ trợ:

```text
page
size
```

Ví dụ:

```text
?page=0&size=20
```

## 4.3. Sorting

Hỗ trợ các trường phù hợp:

```text
price
manufacture_year
mileage
```

Không để frontend tự xử lý toàn bộ dữ liệu; Backend phải phân trang/lọc ở Database.

## 4.4. Phối hợp với TV3

TV3 chịu trách nhiệm:

```text
Crawler
Cleaning
Seed Data
```

TV1 cần nhận dataset/schema cuối từ TV3 và TV5 để đảm bảo API đọc đúng field.

## 4.5. Phối hợp với TV2

Gửi cho TV2:

- API URL.
- HTTP method.
- Request parameters.
- JSON response.
- Error format.

---

# 5. Increment 3 — Automated Pricing

## 5.1. R Model Client

Vị trí:

```text
backend/src/main/java/com/system/client/
└── RModelClient.java
```

Nhiệm vụ:

- Gửi request HTTP tới Plumber.
- Mapping request/response.
- Timeout.
- Xử lý lỗi khi R Model không hoạt động.

## 5.2. Valuation Service

Vị trí:

```text
backend/.../service/ValuationService.java
```

Luồng:

```text
Frontend
   ↓
ValuationController
   ↓
ValuationService
   ↓
RModelClient
   ↓
R Plumber
   ↓
Prediction
```

## 5.3. Valuation Controller

Vị trí:

```text
controller/ValuationController.java
```

API dự kiến:

```text
POST /api/v1/valuation
```

Input là các feature mà TV4 xác định cho model.

Output tối thiểu:

```json
{
  "predicted_price": 495000000,
  "model_version": "regression_v1"
}
```

Không tự ý thay đổi feature contract. TV1 phải thống nhất với TV4.

## 5.4. Prediction cho Listing

Khi cần tạo prediction cho dữ liệu trong Database:

```text
Listing
   ↓
Valuation Service
   ↓
R Model
   ↓
Prediction
   ↓
Database
```

Không gọi R API lại mỗi lần frontend mở một danh sách nếu prediction đã được tính và lưu.

---

# 6. Increment 4 — Recommendation & Decision Support

## 6.1. Recommendation API

TV5 chịu trách nhiệm chính về thuật toán score.

TV1 phụ trách tích hợp thành Backend service/API.

Vị trí:

```text
controller/RecommendationController.java
service/RecommendationService.java
```

API dự kiến:

```text
GET/POST /api/v1/recommendations
```

## 6.2. Comparison API

Vị trí:

```text
controller/ComparisonController.java
service/ComparisonService.java
```

Cho phép nhận 2–3 vehicle/listing IDs và trả về dữ liệu so sánh.

## 6.3. Smart Tagging

TV5 thống nhất rule:

```text
difference < -5%      → GOOD_DEAL
-5% ≤ difference ≤ 5% → FAIR_PRICE
difference > 5%       → OVERPRICED
```

TV1 triển khai service/DTO/response theo business rule đã chốt.

Công thức:

```text
difference_percent =
(actual_price - predicted_price)
/
predicted_price × 100
```

## 6.4. Model version

Prediction phải lưu/return:

```text
predicted_price
model_version
predicted_at
```

---

# 7. Docker & Deployment

## 7.1. Phạm vi

TV1 phụ trách:

```text
docker-compose.yml
```

Mục tiêu cuối:

```text
PostgreSQL
R Plumber
Spring Boot
```

có thể chạy cùng nhau.

## 7.2. Environment

Không commit:

```text
.env
```

Chỉ commit:

```text
.env.example
```

TV1 cần document:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USERNAME
DB_PASSWORD
R_MODEL_URL
```

## 7.3. Kiểm thử

Tối thiểu:

```bash
docker compose up -d
docker compose ps
docker compose logs
```

Kiểm tra:

```text
Frontend → Backend
Backend → PostgreSQL
Backend → R Plumber
```

---

# 8. Tài liệu UML phải bàn giao

## Sequence Diagram

Vị trí:

```text
docs/UML/Sequence_Diagram/
```

Ít nhất có:

1. Search Vehicle.
2. User Valuation.
3. Recommendation.
4. Compare Vehicle.

## Deployment Diagram

Vị trí:

```text
docs/UML/Deployment_Diagram/
```

Thể hiện:

```text
Browser
 ↓
React
 ↓
Spring Boot
 ├── PostgreSQL
 └── R Plumber
```

---

# 9. Swagger / OpenAPI Documentation

TV1 tích hợp Swagger/OpenAPI vào Spring Boot Backend.

### Checklist
- Cấu hình `springdoc-openapi`.
- Hiển thị toàn bộ REST API trên Swagger UI.
- Mô tả Request/Response DTO.
- Khai báo validation và error response.
- Cập nhật API documentation khi thay đổi endpoint.
- Kiểm tra API test trực tiếp được trên Swagger UI.

### API tối thiểu cần mô tả
- Vehicle API.
- Listing API.
- Valuation API.
- Recommendation API.
- Comparison API.

### Input
- API requirements từ các Increment.
- Database structure từ TV5.
- Prediction contract từ TV4.

### Output
- Swagger/OpenAPI chạy cùng Backend.
- API Specification trực quan cho TV2 và TV5.

### Bàn giao
- **TV2:** dùng Swagger để tích hợp ReactJS.
- **TV5:** dùng Swagger/OpenAPI để xây dựng Test Cases.
- **Cả nhóm:** dùng Swagger làm API contract chung.

---

# 10. Class Diagram

TV1 chịu trách nhiệm chính vẽ Class Diagram dựa trên cấu trúc Backend thực tế.

### Thời điểm thực hiện
- Sau khi cấu trúc Backend và các module chính đã tương đối ổn định.

### Checklist
- Xác định các Entity chính.
- Thể hiện quan hệ giữa Entity.
- Thể hiện các lớp Service chính.
- Thể hiện Repository chính (nếu cần phạm vi báo cáo).
- Thể hiện DTO/Mapper ở mức phù hợp.
- Đối chiếu lại với code trước khi chốt.
- Xuất file ảnh/PDF phục vụ báo cáo.

### Input
- Source code Backend thực tế.
- Database relationships từ TV5.

### Output
- Class Diagram khớp với kiến trúc Spring Boot hiện tại.

### Bàn giao
- **TV5:** nhận file diagram và nội dung mô tả để tổng hợp báo cáo.
- **Cả nhóm:** dùng làm tài liệu UML chính thức.

---

# 11. Tiêu chí nghiệm thu TV1

TV1 hoàn thành khi:

- Spring Boot build thành công.
- Kết nối PostgreSQL thành công.
- Vehicle CRUD hoạt động.
- Listing API hoạt động.
- Search/filter/pagination/sorting hoạt động.
- API Valuation gọi được R Plumber.
- Recommendation API tích hợp được logic của TV5.
- Comparison API hoạt động.
- Exception handling hoạt động.
- Không hard-code secret.
- Docker Compose khởi động được các service phụ trách.
- Sequence và Deployment Diagram hoàn thành.

---

# 12. Bàn giao cho ai?

### Bàn giao cho TV2

```text
API Specification
Endpoint
Request
Response
Error format
```

để TV2 tích hợp Frontend.

### Bàn giao cho TV3

Schema/contract của dữ liệu mà Backend cần nhận từ pipeline.

### Bàn giao cho TV4

Model API contract:

```text
Input features
Output JSON
model_version
```

### Bàn giao cho TV5

Service interface liên quan:

```text
Prediction data
Vehicle data
Listing data
```

để xây Recommendation.

### Bàn giao cho toàn nhóm

```text
backend/
docker-compose.yml
docs/UML/Sequence_Diagram/
docs/UML/Deployment_Diagram/
```

---
# 13. Không làm ngoài phạm vi

TV1 không tự phát triển:

- Crawler.
- Regression training.
- UI React.
- Deep Learning.
- Authentication phức tạp.
- Payment.
- Chat.
- Kafka/Kubernetes.

---

# 14. Nhiệm vụ bổ sung sau thay đổi phạm vi - Nghiệp vụ Backend cốt lõi

Phần này thay thế các chỉ dẫn cũ về Recommendation/Comparison và việc loại bỏ toàn bộ Payment. TV1 không tích hợp cổng thanh toán production, nhưng phải xây **deposit/payment simulator** để kiểm thử quy trình kinh doanh.

## Việc đầu tiên

1. Đọc `docs/Project/Workflow_4_Increment.md` và scope change mission.
2. Đóng Gate I2: `ddl-auto=validate`, smoke test search/filter/detail trên PostgreSQL.
3. Review schema/API delta của TV5 trong tối đa nửa ngày; chốt state, HTTP code và error schema trước khi code.
4. Tạo branch/PR nhỏ theo thứ tự Auth -> Listing workflow -> ML moderation -> Deposit -> Dashboard.

## Tuần 1 - Auth và Listing ownership

- Thêm Spring Security, password hash và JWT cho role `USER`, `ADMIN`.
- API register/login/me; duplicate email và credential sai phải trả 4xx có cấu trúc.
- User listing CRUD; chỉ owner được sửa, rút hoặc gửi duyệt.
- State transition theo workflow v2; không nhận status tùy ý từ request.
- Tin crawl có `seller_id = NULL`, `CRAWLED`, `PUBLISHED`; tin user bắt đầu ở `DRAFT`.
- Unit test role, ownership, transition và validation.

**Phụ thuộc:** migration/API draft của TV5.

**Bàn giao:** API contract đã chốt cho TV2, test result cho TV5.

**Gate:** user A không đọc/sửa dữ liệu riêng của user B; USER không gọi được Admin endpoint.

## Tuần 2 - Moderation và ML integration

- Admin moderation queue/detail/approve/reject; reject bắt buộc có lý do.
- R Model client có connect/read timeout và kiểm tra response.
- Lưu prediction metadata và model request status.
- Backend tính risk flag: `listing_price < predicted_price * 0.5`.
- Nếu R API lỗi, giữ tin `PENDING_REVIEW` và đánh dấu `AI_UNAVAILABLE`.
- Test biên 49,99%, 50%, 50,01% và model timeout/malformed response.

**Phụ thuộc:** prediction contract và Plumber của TV4.

**Bàn giao:** moderation/valuation APIs cho TV2; integration evidence cho TV4/TV5.

## Tuần 3 - Deposit, dashboard và hardening

- Deposit intent và callback simulator có unique idempotency key.
- Transaction/lock để một listing chỉ có một deposit `HELD`.
- Cấm self-deposit; validate amount; chỉ Admin được refund/release.
- Trạng thái kết thúc không được đảo ngược; rollback nếu cập nhật listing/deposit thất bại.
- Admin ledger, dashboard aggregate và AI monitoring count.
- Sửa bug P0/P1 theo test matrix TV5; bảo toàn search/filter cũ.

**Phụ thuộc:** migration deposit TV5, UI contract TV2.

**Bàn giao:** OpenAPI/endpoint list, automated tests, demo evidence.

**Nghiệm thu:** callback lặp không tạo giao dịch thứ hai; hai request đồng thời chỉ một `HELD`; transition sai trả 4xx thay vì 500.

## Không làm trong scope mới

- VNPay/MoMo production, thanh toán toàn bộ giá xe, escrow pháp lý.
- Lịch xem xe/lái thử, chat, notification và complaint workflow.
- Recommendation/Comparison mới.
