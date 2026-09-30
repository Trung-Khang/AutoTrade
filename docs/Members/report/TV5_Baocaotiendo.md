# BÁO CÁO TIẾN ĐỘ — TV5

**Dự án:** Xây dựng hệ thống quản lý kinh doanh ô tô đã qua sử dụng
**Vai trò:** TV5 — UML, SRS và tài liệu thiết kế
**Ngày cập nhật:** 30/09/2026

---

## 1. Phạm vi trách nhiệm hiện tại

TV5 chịu trách nhiệm:

* SRS.
* Use Case.
* Đặc tả Use Case.
* Sequence Diagram.
* Collaboration Diagram.
* Class Diagram.
* ERD review.
* Traceability Matrix.
* Rà soát tính nhất quán giữa FR → UC → API → Test.
* Rà soát tài liệu với code và test evidence trước Final Gate.

TV5 không chịu trách nhiệm implementation Backend, Frontend, Auth, Database migration hoặc business logic.

---

## 2. Scope hiện tại

### P0

* Authentication và Authorization.
* Showroom/list vehicle.
* Search/filter/detail.
* Admin CRUD vehicle.
* Deposit giả lập.
* Appointment.
* Vehicle locking.
* Duplicate deposit prevention.
* Test và UML cho golden flow.

### P1

* Register.
* OTP/password recovery.
* Favorites.
* Customer deposit history.
* Staff appointment update.
* Admin ledger/account/statistics cơ bản.

### P2

* QR UI nâng cao.
* Receipt/contract download.
* Contact links.
* Advanced gallery/chart.

### Removed

* Machine Learning.
* Regression.
* R Plumber.
* Automated valuation.
* Recommendation.
* Comparison.
* Real payment.
* Shopping cart.
* Standalone test-drive workflow.

---

## 3. Những gì đã xác minh từ source code hiện tại

### 3.1. Database

Schema hiện tại sử dụng:

```text
sources
vehicles
listings
```

Các tài liệu database đã có:

```text
database/schema/schema.sql
database/migrations/V2_0_1__schema_patch.sql
database/tests/schema_v2_0_1_smoke_test.sql
docs/Database/ERD/ERD.md
docs/Database/Data_Dictionary.md
docs/Database/Mapping_Matrix.md
```

### 3.2. Backend

Backend hiện đã có:

```text
Vehicle
Listing
Source

VehicleController
ListingController

VehicleService
ListingService

VehicleRepository
ListingRepository
SourceRepository

ListingSpecification

ListingFilterRequest
ListingResponseDto
PageResponse
```

### 3.3. API hiện có

```text
GET    /api/v1/listings
GET    /api/v1/listings/{id}
POST   /api/v1/listings
DELETE /api/v1/listings/{id}

GET    /api/v1/vehicles
GET    /api/v1/vehicles/{id}
POST   /api/v1/vehicles
PUT    /api/v1/vehicles/{id}
DELETE /api/v1/vehicles/{id}
```

### 3.4. Search/filter

Backend hiện hỗ trợ:

```text
keyword
vehicleId
brand
model
variant
minPrice
maxPrice
minYear
maxYear
minMileage
maxMileage
fuelType
transmission
bodyType
origin
location
page
size
sort
```

### 3.5. Frontend

Frontend hiện đã có:

```text
VehicleListPage
VehicleDetailPage
VehicleCard
VehicleGrid
VehicleInfo
FilterPanel
vehicleApi
```

Frontend sử dụng API:

```text
GET /api/v1/listings
GET /api/v1/listings/{id}
```

---

## 4. Tình trạng tài liệu TV5

| Deliverable              | Status                |
| ------------------------ | --------------------- |
| ERD                      | DONE / REVIEW         |
| Data Dictionary          | DONE / REVIEW         |
| Mapping Matrix           | DONE / REVIEW         |
| Use Case                 | NEED UPDATE           |
| Class Diagram            | NEED UPDATE           |
| Sequence Diagram         | TODO                  |
| Collaboration Diagram    | TODO                  |
| Traceability Matrix      | TODO                  |
| SRS                      | TODO / CREATE         |
| API documentation review | IN PROGRESS           |
| Test traceability review | PENDING TEST EVIDENCE |

---

## 5. Các mismatch đã phát hiện

### Mismatch 1 — Scope cũ

Tài liệu UML cũ còn:

```text
Comparison
Recommendation
Valuation
R / ML
```

Các nội dung này không còn thuộc phạm vi nộp.

### Mismatch 2 — Stack cũ

Một số tài liệu SRS vẫn ghi:

```text
Servlet/JSP
SQL Server/MySQL
JDBC
```

Trong repository hiện tại stack là:

```text
Spring Boot
React
PostgreSQL
JPA
```

### Mismatch 3 — API cũ

Tài liệu cũ ghi:

```text
GET /api/vehicles
GET /api/vehicles/search
POST /api/comparisons
POST /api/valuation
```

Trong code hiện tại API chính sử dụng:

```text
/api/v1/listings
/api/v1/vehicles
```

### Mismatch 4 — Class cũ

UML cũ chứa:

```text
VehicleComparison
ComparisonVehicle
RecommendationResult
```

Các class này không tồn tại trong Backend hiện tại.

### Mismatch 5 — Deposit/Auth/Appointment

Workflow đã yêu cầu P0 nhưng snapshot code hiện tại chưa có class implementation tương ứng.

TV5 không tự suy đoán tên class.

Phải lấy tên class thực tế từ TV1/TV4.

---

## 6. Công việc TV5 ngày 30/09

### Ưu tiên 1

Đồng bộ SRS:

```text
Stack
Scope
FR
NFR
Actor
Business rules
Status
```

### Ưu tiên 2

Hoàn thiện:

```text
Use Case
Class Diagram
Sequence Diagram
Collaboration Diagram
```

### Ưu tiên 3

Tạo:

```text
Traceability Matrix
FR → UC → API → Test
```

### Ưu tiên 4

Review chéo:

```text
TV1:
API + business state + actual class names

TV4:
Auth + role + security flow

TV3:
ERD + schema + FK + status

TV2:
UI + test cases + test evidence
```

---

## 7. Quy tắc ghi trạng thái

TV5 chỉ sử dụng:

```text
IMPLEMENTED
VERIFIED
PARTIAL
PENDING
BLOCKED
REMOVED
```

Không ghi `PASS` nếu chưa có test evidence.

Không ghi `IMPLEMENTED` nếu chỉ có kế hoạch/documentation.

---

## 8. Final Gate checklist

### SRS

* [ ] Spring Boot đúng
* [ ] React đúng
* [ ] PostgreSQL đúng
* [ ] Không còn Servlet/JSP/SQL Server/MySQL
* [ ] Scope P0/P1/P2 chính xác
* [ ] Removed scope được ghi rõ

### UML

* [ ] Use Case đúng actor
* [ ] Không còn ML/Recommendation/Comparison
* [ ] Sequence đúng code
* [ ] Collaboration đúng code
* [ ] Class Diagram đúng class
* [ ] ERD đúng schema

### Traceability

* [ ] FR → UC
* [ ] UC → API
* [ ] API → Test
* [ ] Test → evidence

### Final review

* [ ] Không có class giả
* [ ] Không có endpoint giả
* [ ] Không có bảng giả
* [ ] Không có trạng thái giả
* [ ] Không tuyên bố PASS khi thiếu evidence

---

## 9. Kết luận

TV5 đã có nền tảng Database Design từ giai đoạn trước, nhưng phần tài liệu hiện tại chưa đồng bộ với scope mới.

Trọng tâm hiện tại không còn là Database implementation hay Recommendation.

Trọng tâm TV5 từ 30/09/2026 là:

```text
SRS
 ↓
Use Case
 ↓
Sequence
 ↓
Collaboration
 ↓
Class / ERD
 ↓
Traceability
 ↓
Cross-check API / code / test
 ↓
Final Gate
```
