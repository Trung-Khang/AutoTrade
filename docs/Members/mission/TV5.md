# TV5.md — Database, Decision Support & Testing

> **Cập nhật phạm vi ngày 27/09/2026:** Mục 15 ở cuối tài liệu và `scope_change_mission.md` là nhiệm vụ hiện hành. Khi có mâu thuẫn, nhiệm vụ Database, UML và kiểm thử mới thay thế Recommendation/Comparison cũ.

## 1. Vai trò

**Vai trò:** Database Developer + Decision Support + Testing Lead

TV5 chịu trách nhiệm thiết kế Database, phối hợp ERD/Data Dictionary, xây dựng logic Smart Tagging/Recommendation ở tầng nghiệp vụ và điều phối kiểm thử tích hợp.

### Phạm vi chính

```text
database/
tests/
backend/ phần Recommendation/Comparison/Prediction liên quan
docs/Database/
docs/Testing/
```

TV5 không sở hữu toàn bộ Backend; TV1 là người chịu trách nhiệm tích hợp Backend.

---

# 2. Increment 1 — Database Foundation

## 2.1. ERD

Xác định các thực thể chính:

```text
sources
crawl_batches
vehicles
listings
predictions
recommendations
```

Quan hệ khái quát:

```text
Source
  ↓
CrawlBatch

Vehicle
  ↓
Listing
  ↓
Prediction
  ↓
Recommendation
```

Không nhất thiết mỗi bảng phải được chốt 100% ngay ngày đầu; schema có thể tiến hóa theo Increment.

## 2.2. SQL Schema

Vị trí:

```text
database/schema/
```

Các file:

```text
01_extensions.sql
02_sources.sql
03_vehicles.sql
04_listings.sql
05_predictions.sql
06_recommendations.sql
```

## 2.3. Seed

Vị trí:

```text
database/seed/
```

Bao gồm các SQL/import cần thiết để khởi tạo môi trường.

---

# 3. Data Dictionary

Vị trí:

```text
docs/Database/
├── ERD/
└── Data_Dictionary.xlsx
```

Mỗi field cần ghi:

```text
Table
Column
Data Type
Nullable
Description
Example
Unit
Constraint
```

Đặc biệt:

```text
price → VND
mileage → km
manufacture_year → year
listed_at → datetime
crawled_at → datetime
```

---

# 4. Increment 2 — Database for Market Data

## 4.1. Nhận dữ liệu từ TV3

Kiểm tra:

- Schema matching.
- Null.
- Duplicate.
- Constraint.
- Data type.
- Source traceability.

## 4.2. Index

Xác định index cho các trường thường filter:

```text
brand
manufacture_year
price
mileage
fuel_type
transmission
body_type
```

Không tạo index bừa bãi. Chỉ giữ các index phục vụ truy vấn thực tế.

## 4.3. Query Performance

Hỗ trợ TV1 kiểm tra:

```text
filter
sort
pagination
```

trên khoảng 5.000 records.

---

# 5. Increment 3 — Prediction & Smart Tagging

## 5.1. Prediction Entity

Phối hợp TV1 tạo:

```text
backend/entity/Prediction.java
backend/repository/PredictionRepository.java
```

Database lưu tối thiểu:

```text
listing_id
predicted_price
model_version
predicted_at
difference_percent
price_label
```

## 5.2. Smart Tagging

Business rule:

```text
difference_percent =
(actual_price - predicted_price)
/
predicted_price × 100
```

```text
< -5%       → GOOD_DEAL
-5% ~ +5%   → FAIR_PRICE
> +5%       → OVERPRICED
```

TV5 phải viết/đề xuất unit test cho rule này.

---

# 6. Increment 4 — Recommendation

## 6.1. Mục tiêu

Recommendation trả lời:

> Trong các xe đang có, xe nào phù hợp với nhu cầu và đáng cân nhắc nhất?

Không phải:

> Xe này có giá bao nhiêu?

Giá dự đoán do Regression của TV4 cung cấp.

## 6.2. Weighted Scoring

Công thức có thể gồm:

```text
Recommendation Score =
Price Score
+ Market Fairness Score
+ Age Score
+ Mileage Score
+ Preference Score
```

Trọng số phải được thống nhất và ghi rõ trong tài liệu.

Ví dụ:

```text
Price        35%
Fairness     20%
Age          20%
Mileage      15%
Preference   10%
```

Không bắt buộc giữ đúng các con số này nếu nhóm có lý do khác; phải ghi công thức/version cuối cùng.

## 6.3. Recommendation Entity

Vị trí:

```text
backend/entity/Recommendation.java
backend/repository/RecommendationRepository.java
backend/service/RecommendationService.java
backend/controller/RecommendationController.java
```

## 6.4. Recommendation Reason

Kết quả nên có thể giải thích:

```text
Trong ngân sách
Giá thấp hơn dự đoán
ODO thấp
Đời xe phù hợp
```

Không trả về score không có lý do nếu giao diện yêu cầu explainability.

---

# 7. Comparison

Phối hợp TV1 xác định:

```text
backend/service/ComparisonService.java
backend/controller/ComparisonController.java
```

So sánh 2–3 xe.

Dữ liệu:

```text
price
predicted_price
difference_percent
year
mileage
fuel
transmission
score
```

TV5 chịu trách nhiệm xác định các chỉ tiêu nghiệp vụ cần so sánh.

---

# 8. Testing

## 8.1. API Tests

Vị trí:

```text
tests/api/
├── vehicle/
├── valuation/
├── recommendation/
└── comparison/
```

## 8.2. Integration Tests

```text
tests/integration/
├── backend-database/
└── backend-rmodel/
```

Kiểm tra:

```text
Spring ↔ PostgreSQL
Spring ↔ R Plumber
```

## 8.3. Performance

```text
tests/performance/
├── search/
└── valuation/
```

Mục tiêu:

```text
Search p95 < 200ms
Valuation p95 < 500ms
```

Các số đo phải ghi rõ môi trường test; không tuyên bố đạt nếu chưa đo.

---

# 9. Testing Documentation

Vị trí:

```text
docs/Testing/
├── Test_Plan.md
├── Test_Cases.xlsx
└── Test_Report.md
```

## Test Case tối thiểu

### Vehicle

- Get all.
- Get detail.
- Filter.
- Invalid filter.

### Valuation

- Valid input.
- Missing field.
- Invalid category.
- R Model unavailable.

### Smart Tagging

- Exactly -5%.
- Less than -5%.
- Between -5% and +5%.
- Exactly +5%.
- Greater than +5%.

### Recommendation

- No candidate.
- One candidate.
- Multiple candidates.
- Budget filter.
- Ranking.

### Comparison

- 2 vehicles.
- 3 vehicles.
- Duplicate ID.
- Invalid ID.

---

# 10. Increment 4 — Final System Test

Test end-to-end:

```text
Search
 ↓
Filter
 ↓
View Detail
 ↓
View Prediction
 ↓
Smart Tag
 ↓
Compare
 ↓
Recommendation
```

Use case:

```text
User nhập xe
 ↓
Frontend
 ↓
Spring
 ↓
R Model
 ↓
Predicted Price
 ↓
Frontend
```

---

# 11. Nhiệm vụ bổ sung — Tổng hợp Báo cáo, Biểu đồ & Demo

## 11.1. Tổng hợp Báo cáo cuối kỳ

TV5 chịu trách nhiệm **tổng hợp và chuẩn hóa bản báo cáo cuối cùng**. TV5 không viết thay toàn bộ nhóm; mỗi thành viên phải bàn giao nội dung và minh chứng cho phần mình phụ trách.

### Checklist
- Nhận nội dung kỹ thuật từ TV1.
- Nhận Activity Diagram và UI Evidence từ TV2.
- Nhận Data Pipeline/Data Evidence từ TV3.
- Nhận Model Metrics/Evaluation từ TV4.
- Tổng hợp Database, Testing và System Design.
- Đồng bộ thuật ngữ giữa các phần.
- Kiểm tra các diagram khớp với hệ thống thực tế.
- Chuẩn hóa format theo form của trường.
- Xuất bản Word/PDF cuối cùng.

### Input bắt buộc từ các thành viên

**TV1**
- Backend description.
- Class Diagram.
- Sequence/API documentation.

**TV2**
- Activity Diagram.
- UI screenshots.
- Frontend description.

**TV3**
- Data Pipeline description.
- Dataset/cleaning evidence.

**TV4**
- Model description.
- Metrics.
- Evaluation charts/reports.

**TV5**
- ERD.
- Database documentation.
- Test Plan/Test Cases/Test Report.
- Nội dung tổng hợp hệ thống.

### Output
- Chất liệu đã tổng hợp cho bài báo cáo đồ án.

---

# 12. Bàn giao

### TV1

Bàn giao:

```text
ERD
Database schema
Prediction/Recommendation requirements
Test findings
```

### TV2

Bàn giao:

```text
Recommendation response
Comparison fields
Smart Tag rules
```

### TV3

Bàn giao:

```text
seed data acceptance
data quality issues
import requirements
```

### TV4

Bàn giao:

```text
model output
model_version
prediction schema
```

### Toàn nhóm

Bàn giao:

```text
database/
tests/
docs/Database/
docs/Testing/
```

---

# 13. Tiêu chí nghiệm thu TV5

- ERD hoàn thành.
- Database schema chạy được.
- Seed data import thành công.
- Index/query phù hợp.
- Prediction lưu được.
- Smart Tagging đúng rule.
- Recommendation Score hoạt động.
- Comparison logic rõ ràng.
- API tests có coverage cho chức năng chính.
- Integration tests hoàn thành.
- Performance test có số liệu.
- Test Report hoàn chỉnh.

---

# 14. Không làm ngoài phạm vi

Không xây:

- Crawler engine.
- R Regression training.
- React UI.
- Deep Learning recommendation.
- Payment.
- Chat.
- Kafka/Kubernetes.

---

# 15. Nhiệm vụ bổ sung sau thay đổi phạm vi - Cơ sở dữ liệu, UML và điều phối kiểm thử

Phần này thay thế Recommendation/Comparison làm trọng tâm Increment 4. TV5 chủ trì thiết kế delta, UML và test; không xây Backend thay TV1.

## Việc đầu tiên - Scope Transition Gate

1. Đọc workflow v2 và lập delta giữa schema/API/UML cũ với scope mới.
2. Trong Ngày 1, đề xuất ERD và state diagrams cho User, Listing, Moderation, Prediction Log và Deposit.
3. Trong Ngày 2, chốt migration/API contract với TV1 và review field cùng TV2/TV3/TV4.
4. Đánh dấu `CONTRACT FROZEN FOR IMPLEMENTATION`; thay đổi sau đó phải có migration/version và impact note.

## Tuần 1 - Schema/API/UML foundation

- Tạo migration phiên bản mới, giữ schema v2.0.1 và dữ liệu cũ.
- Thành phần tối thiểu: users; listing owner/origin/status/moderation/version; listing status history; prediction/model request log; deposit và deposit status/audit.
- Unique/check/FK/index cho email, idempotency key, status và truy vấn Admin.
- Thiết kế transaction/constraint để một listing chỉ có một deposit `HELD`.
- API specification và error/status matrix.
- Draft Use Case, ERD, Class, Listing State và Deposit State diagrams.

## Tuần 2 - Database và integration tests

- Chạy migration/smoke test trên PostgreSQL thật.
- Hibernate validate với TV1; import/re-import với TV3.
- Test auth, listing, moderation và ML contract.
- Cập nhật Sequence diagrams cho seller submit/moderation và valuation.
- Lập requirement-test traceability matrix P0/P1.

## Tuần 3 - Deposit tests, UML và báo cáo

- Test callback lặp, đặt cọc đồng thời, rollback, refund/release terminal, self-deposit và ownership.
- Test dashboard aggregate và search/filter regression.
- Điều phối hai golden flows Frontend-Backend-DB-ML.
- Hoàn thiện Activity, Sequence, Component, Deployment diagrams; cập nhật SRS, tên đề tài và scope.
- Tổng hợp Integration/System Test Report với command, expected, actual và evidence.

**Bàn giao:** migration và thứ tự chạy/rollback, ERD/Data Dictionary/API spec, bộ UML, test matrix, test report, known limitations.

**Nghiệm thu:** SQL=JPA=Import; state/constraint đúng; P0 pass; tài liệu và code cùng một scope.

## Không làm trong scope mới

- Recommendation/Comparison mới.
- Production payment gateway hoặc escrow pháp lý.
- Backend service/controller thay TV1, React thay TV2, model training thay TV4.
