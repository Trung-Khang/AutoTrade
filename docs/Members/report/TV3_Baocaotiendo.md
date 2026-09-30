# TV3 — DATA ENGINEERING & DATA PIPELINE REPORT

**Project:** `Used-Car-Smart-System`
**Role:** TV3 — Data Engineering / Data Pipeline Developer
**Scope:** Data Crawling → Data Merge → Data Cleaning → Data Validation → Seed Generation
**Final Dataset:** **10,813 real marketplace records**
**Final Data Quality:** **98.41 / 100 — Grade A**
**Final Status:** **COMPLETE — READY FOR DATABASE HANDOFF**

---

# 1. Executive Summary

TV3 chịu trách nhiệm xây dựng và hoàn thiện toàn bộ quy trình Data Engineering cho hệ thống `Used-Car-Smart-System`.

Phạm vi công việc bao gồm:

```text
Chợ Tốt ───────┐
               │
               ▼
          Raw Crawling
               │
Bonbanh ───────┘
               │
               ▼
        Raw Dataset
               │
               ▼
            MERGE
               │
               ▼
      Unified Raw Dataset
               │
               ▼
           CLEANING
               │
               ▼
       Cleaned Dataset
               │
               ▼
          VALIDATION
               │
               ▼
       Validated Dataset
               │
               ▼
       SEED GENERATION
               │
               ▼
       Database-ready Data
               │
               ▼
       DATABASE HANDOFF
               │
               ▼
     TV5 / Database Owner
```

Sau toàn bộ pipeline, TV3 đã tạo được:

* **10,813 records thực tế**
* **3,116 records từ Chợ Tốt**
* **7,697 records từ Bonbanh**
* 14-field canonical data contract
* 100% source URL hợp lệ và unique
* 0 exact duplicate records
* 100% critical-field completeness
* Quality Score **98.41/100 — Grade A**
* Seed JSON, CSV và SQL
* Import pipeline có khả năng tái sử dụng
* Báo cáo machine-readable
* Documentation đầy đủ
* Raw và cleaned dataset được kiểm chứng checksum

Physical database import **không nằm trong phạm vi hoàn thành của TV3**, do database schema/migration thuộc thành viên phụ trách Database. TV3 đã dừng đúng tại điểm bàn giao để không tự ý thiết kế hoặc thay đổi database architecture.

---

# 2. Responsibility & Scope

## 2.1. TV3 chịu trách nhiệm

TV3 chịu trách nhiệm:

* Web crawling
* Raw data collection
* Checkpoint/resume
* Retry và rate limiting
* Parser
* Dataset merge
* Data cleaning
* Data normalization
* Data validation
* Data quality assessment
* Seed generation
* Import preparation
* Data lineage
* Documentation

## 2.2. TV3 không chịu trách nhiệm

Các nội dung sau nằm ngoài phạm vi TV3:

* Thiết kế database architecture
* Database migration
* Thay đổi backend entity
* Spring Boot API
* Frontend
* Regression model
* Recommendation system
* Real-time data synchronization

Đặc biệt, pipeline của TV3 là **batch pipeline**, không phải real-time pipeline.

---

# 3. Data Contract

Toàn bộ pipeline sử dụng canonical schema gồm 14 trường:

|  # | Field              | Ý nghĩa         |
| -: | ------------------ | --------------- |
|  1 | `brand`            | Thương hiệu     |
|  2 | `model`            | Dòng xe         |
|  3 | `variant`          | Phiên bản       |
|  4 | `manufacture_year` | Năm sản xuất    |
|  5 | `price`            | Giá bán, VND    |
|  6 | `mileage`          | Số km đã đi     |
|  7 | `fuel_type`        | Loại nhiên liệu |
|  8 | `transmission`     | Hộp số          |
|  9 | `body_type`        | Kiểu thân xe    |
| 10 | `location`         | Địa điểm        |
| 11 | `source_url`       | URL nguồn       |
| 12 | `image_url`        | URL hình ảnh    |
| 13 | `listed_at`        | Thời điểm đăng  |
| 14 | `crawled_at`       | Thời điểm crawl |

Các trường được duy trì nhất quán xuyên suốt Raw → Merge → Clean → Validation → Seed.

---

# 4. Data Sources

TV3 thu thập dữ liệu từ hai marketplace thực tế:

| Source     |    Records |    Tỷ lệ |
| ---------- | ---------: | -------: |
| Chợ Tốt Xe |      3,116 |   28.82% |
| Bonbanh    |      7,697 |   71.18% |
| **Total**  | **10,813** | **100%** |

Dữ liệu được crawl từ các listing thực tế tại thời điểm crawl.

`crawled_at` chỉ biểu thị thời điểm dữ liệu được thu thập.

Hệ thống **không triển khai real-time synchronization**.

---

# 5. Crawling & Data Acquisition

## 5.1. Chợ Tốt

Crawler sử dụng browser automation để xử lý nội dung động.

Các cơ chế chính:

* Playwright
* Browser channel fallback
* Pagination
* Scrolling/lazy-loading
* URL discovery
* Detail-page parsing
* Retry
* Rate limiting
* Checkpoint
* Batch output
* Logging

Checkpoint cuối:

```text
Page: 181
Records: 3,116
```

Kết quả production:

```text
Previous records: 976
Additional records: 2,140
Final records: 3,116
Duplicate URLs skipped: 218
Parse failures: 0
Network failures: 0
```

---

## 5.2. Bonbanh

Crawler sử dụng HTTP session với:

* Persistent cookies
* Browser-like headers
* Retry
* Backoff
* Rate limiting
* Pagination
* Detail-page parsing
* Checkpoint
* Batch output

Checkpoint cuối:

```text
Page: 512
Records: 7,697
```

Kết quả production:

```text
Previous records: 913
Additional records: 6,784
Final records: 7,697
Duplicate URLs skipped: 1,268
Parse failures: 0
Network failures: 0
```

---

# 6. Production Dataset

Sau khi hoàn thành production crawl:

```text
Chợ Tốt:       3,116
Bonbanh:       7,697
----------------------
Total:        10,813
```

Smoke-test records được loại khỏi production dataset và không được sử dụng để làm tăng giả số lượng dữ liệu.

TV3 không sử dụng dữ liệu giả hoặc duplicate nhân tạo để đạt target.

---

# 7. Phase 3 — Data Merge

Tất cả production raw batches được hợp nhất thành:

```text
crawler/data/merged/vehicles_raw_merged.json
```

Kết quả:

```text
Input records:       10,813
Output records:      10,813
Discarded:                 0
Duplicate URLs:            0
Schema violations:         0
```

Dataset giữ nguyên:

* source
* source_url
* raw values
* crawled_at
* listed_at

Không thực hiện cross-source vehicle deduplication.

Điều này có nghĩa là nếu cùng một mẫu xe xuất hiện trên Chợ Tốt và Bonbanh, hai listing vẫn được giữ riêng.

---

# 8. Phase 4 — Data Cleaning

## 8.1. Cleaning Architecture

Pipeline cleaning được tổ chức theo module:

```text
crawler/src/cleaning/
├── __init__.py
├── clean_price.py
├── clean_mileage.py
├── clean_vehicle.py
└── validator.py

crawler/src/pipeline/
└── clean_pipeline.py
```

Mục tiêu là biến đổi dữ liệu về dạng thống nhất nhưng vẫn giữ nguyên thông tin thực tế.

---

## 8.2. Cleaning Rules

### Price

Chuyển giá về integer VND.

Ví dụ:

```text
590 triệu
→
590000000
```

### Mileage

Chuyển mileage về integer km.

Giá trị không parse được được giữ là:

```text
NULL
```

Không tự động thay thế bằng 0.

### Manufacture Year

Chuẩn hóa về:

```text
INT
```

### Transmission

Chuẩn hóa về vocabulary:

```text
Automatic
Manual
Semi-Automatic
Other
```

### Fuel Type

Chuẩn hóa về:

```text
Gasoline
Diesel
Electric
Hybrid
Other
```

### Brand / Model

Chuẩn hóa casing và một số tên thương hiệu:

```text
Mercedes Benz → Mercedes-Benz
LandRover → Land Rover
Rolls Royce → Rolls-Royce
```

### Location

Chuẩn hóa một số cách viết địa phương:

```text
TP HCM → Hồ Chí Minh
Đăk Lăk → Đắk Lắk
```

### Null Values

Null-like values được chuyển thành:

```text
NULL
```

Không thực hiện synthetic imputation.

---

# 9. Cleaning Result

Input:

```text
10,813
```

Output:

```text
10,813
```

Không record nào bị xóa trong cleaning.

| Field           |  Null |
| --------------- | ----: |
| `mileage`       | 2,307 |
| `variant`       | 1,473 |
| `body_type`     | 1,061 |
| `listed_at`     |     1 |
| Critical fields |     0 |

Raw dataset vẫn giữ nguyên.

SHA-256 của raw merged dataset:

```text
6353550dc7f7f8ce20797ddfab9ac9f8b7b4d2452f14f28363aa8ef377db1fcd
```

---

# 10. Phase 5 — Data Validation

Validation được thực hiện trên toàn bộ:

```text
10,813 / 10,813 records
```

Coverage:

```text
100%
```

---

# 11. Schema Validation

14-field contract:

```text
Missing fields:       0
Extra fields:         0
Malformed records:    0
```

Kết quả:

```text
PASS
```

---

# 12. Type Validation

Các trường:

```text
price
mileage
manufacture_year
```

được kiểm tra theo:

```text
int | null
```

Timestamp được kiểm tra theo ISO-8601.

Kết quả:

```text
Type errors: 0
Timestamp errors: 0
```

---

# 13. Critical Field Completeness

Các critical fields:

```text
brand
model
manufacture_year
price
location
source_url
crawled_at
```

đạt:

```text
100% completeness
```

Không có critical field bị NULL.

---

# 14. Source Traceability

Toàn bộ 10,813 records có:

* HTTPS `source_url`
* source lineage
* `crawled_at`

Kiểm tra:

```text
Valid URLs:       10,813
Unique URLs:      10,813
Duplicate URLs:        0
```

Kết quả:

```text
PASS
```

---

# 15. Statistical Validation & Anomalies

## 15.1. Price

Distribution:

```text
Min:       5,000,000 VND
Q1:      390,000,000 VND
Median:  590,000,000 VND
Mean:    993,567,814 VND
Q3:      960,000,000 VND
P95:   2,980,000,000 VND
P99:   7,199,000,000 VND
Max:  33,000,000,000 VND
```

Có 6 listing giá dưới 10 triệu VND.

Kiểm tra cho thấy các listing này có đặc điểm liên quan đến:

* trả trước
* trả góp
* phí thuê/thanh toán định kỳ

Do đó các record được giữ nguyên.

---

## 15.2. Mileage

```text
Populated: 8,506
NULL:      2,307
Median:   54,000 km
P99:     300,000 km
```

Có 8 giá trị cực đoan trên 1 triệu km.

Ví dụ:

```text
3,380,000,000 km
150,000,000 km
```

Các giá trị này được giữ lại vì có thể là seller typo và việc tự động xóa dữ liệu nằm ngoài phạm vi validation.

---

## 15.3. Manufacture Year

```text
Range: 1980–2026
Future years: 0
Vintage (<1990): 11
Vehicles >=2020: 7,991
```

Không phát hiện manufacture year vượt quá 2026.

---

# 16. Categorical Validation

## Transmission

| Category       | Count |
| -------------- | ----: |
| Automatic      | 9,577 |
| Manual         | 1,214 |
| Semi-Automatic |    21 |
| Other          |     1 |

Record `Other` xuất phát từ raw value:

```text
"5"
```

Record được giữ nguyên và ghi nhận là parser anomaly.

---

## Fuel Type

| Category | Count |
| -------- | ----: |
| Gasoline | 7,543 |
| Diesel   | 1,565 |
| Electric | 1,204 |
| Hybrid   |   500 |
| Other    |     1 |

Record `Other` xuất phát từ:

```text
"Loại khác 2.5 L"
```

Có khả năng đây là thông tin động cơ được parser lấy nhầm vào fuel type.

Record vẫn được giữ lại.

---

# 17. Cross-Source Similarity

Validation phát hiện:

```text
986 potential overlapping listings
```

Tỷ lệ:

```text
9.12%
```

Điều kiện matching bảo thủ:

```text
brand
model
manufacture_year
price ±5%
mileage ±10%
```

Đây chỉ là **potential similarity**, không phải bằng chứng cùng một chiếc xe.

Do đó:

```text
Cross-source deduplication = NOT PERFORMED
```

Tất cả records vẫn được giữ.

---

# 18. Data Quality Score

Quality score sử dụng mô hình 100 điểm:

| Component                 |     Max |     Score |
| ------------------------- | ------: | --------: |
| Schema Integrity          |      20 |     20.00 |
| Type Integrity            |      20 |     20.00 |
| Source Traceability       |      20 |     20.00 |
| Critical Completeness     |      20 |     20.00 |
| Non-Critical Completeness |      10 |      8.51 |
| Semantic Validity         |      10 |      9.90 |
| **Total**                 | **100** | **98.41** |

Final:

```text
98.41 / 100
Grade A
PASS WITH WARNINGS
```

Các warnings phản ánh dữ liệu marketplace thực tế thay vì lỗi hệ thống nghiêm trọng.

---

# 19. Downstream Recommendations

Một số anomaly không bị xóa khỏi dataset nhưng cần được lưu ý khi TV4/TV5 sử dụng dữ liệu cho ML.

### Price

Có thể cân nhắc:

```text
price >= 30,000,000 VND
```

khi xây dựng model dự đoán giá để giảm ảnh hưởng của các listing trả trước/trả góp.

### Mileage

Có thể cân nhắc:

```text
mileage <= 500,000 km
```

ở bước feature engineering.

### Null Mileage

Không nên coi mọi NULL mileage là lỗi.

Một phần lớn NULL mileage đến từ xe mới/xe chưa đăng ký.

ML pipeline có thể xử lý NULL như một feature/category riêng tùy model.

**Lưu ý:** các rule trên là downstream recommendations, không phải thay đổi đối với dataset chính thức của TV3.

---

# 20. Phase 6 — Seed Generation

Sau validation, TV3 chuyển dataset sang dạng database-ready seed.

Input:

```text
crawler/data/cleaned/vehicles_cleaned.json
```

Records:

```text
10,813
```

Output:

```text
crawler/data/seed/
├── vehicles_seed.json
├── vehicles_seed.csv
├── vehicles_seed_dev.json
└── vehicles_seed.sql
```

---

# 21. Seed Transformation

Seed pipeline thực hiện:

* deterministic ID generation
* source derivation
* field mapping
* NULL preservation
* SQL escaping
* batch generation
* JSON export
* CSV export
* SQL generation

Kết quả:

```text
Input:        10,813
Transformed:  10,813
Skipped:           0
Failed:            0
```

---

# 22. Seed Deliverables

| File                        | Records | Purpose                       |
| --------------------------- | ------: | ----------------------------- |
| `vehicles_seed.json`        |  10,813 | Full database-ready dataset   |
| `vehicles_seed.csv`         |  10,813 | Analytical/export format      |
| `vehicles_seed_dev.json`    |   1,000 | Development subset            |
| `vehicles_seed.sql`         |  10,813 | PostgreSQL import preparation |
| `phase6_import_report.json` |       — | Machine-readable report       |

Seed pipeline:

```text
crawler/src/pipeline/import_pipeline.py
```

CLI wrapper:

```text
crawler/scripts/seed_database.py
```

---

# 23. Database Handoff Boundary

Tại thời điểm hoàn thành Phase 6, repository chưa có database schema thực tế để TV3 import trực tiếp.

TV3 đã kiểm tra:

```text
database/schema/
database/migrations/
database/seed/
backend/
```

Các thư mục database/migration hiện chưa chứa schema triển khai thực tế.

Vì database thuộc trách nhiệm của thành viên phụ trách Database, TV3 **không tự ý tạo competing database architecture**.

Do đó:

```text
TV3 responsibility
        │
        ▼
Validated Dataset
        │
        ▼
Seed Generation
        │
        ▼
Database-ready Data
        │
        ▼
HANDOFF
        │
        ▼
Database Owner / TV5
```

Physical database import được thực hiện sau khi database owner cung cấp schema/migration và môi trường PostgreSQL tương ứng.

---

# 24. Database Import Readiness

TV3 đã chuẩn bị:

```text
import_pipeline.py
seed_database.py
vehicles_seed.sql
vehicles_seed.json
vehicles_seed.csv
```

Pipeline hỗ trợ:

* batch insert
* transaction handling
* NULL preservation
* source lineage
* source_url uniqueness
* idempotent loading strategy
* PostgreSQL-compatible SQL generation

Tuy nhiên:

```text
Physical INSERT:
PENDING DATABASE SCHEMA DEPLOYMENT
```

TV3 không báo cáo số dòng database đã insert khi chưa có database thực tế.

---

# 25. Immutability Verification

Raw merged dataset:

```text
SHA-256:
6353550dc7f7f8ce20797ddfab9ac9f8b7b4d2452f14f28363aa8ef377db1fcd
```

Cleaned dataset:

```text
SHA-256:
87be41066ff5331e7aae954e4424144dcc3675f809fd435cb9779e950c1fb2aa
```

Cả hai checksum được xác nhận không thay đổi trong quá trình Phase 6.

Kết quả:

```text
Raw dataset:      IMMUTABLE
Clean dataset:    IMMUTABLE
```

---

# 26. Git Safety

TV3 chỉ thay đổi các thành phần thuộc Data Engineering.

Không thay đổi:

```text
backend/
frontend/
```

Database architecture cũng không bị tự ý thay đổi.

`.gitignore` được bổ sung để tránh commit generated runtime datasets:

```text
crawler/data/cleaned/
crawler/data/quality_report/
crawler/data/seed/
```

Các dataset production dung lượng lớn không nên được commit trực tiếp vào Git history nếu repository policy không yêu cầu.

---

# 27. Main Deliverables

Các thành phần chính của TV3:

```text
crawler/
├── src/
│   ├── crawlers/
│   │   ├── chotot/
│   │   └── bonbanh/
│   │
│   ├── cleaning/
│   │   ├── clean_price.py
│   │   ├── clean_mileage.py
│   │   ├── clean_vehicle.py
│   │   └── validator.py
│   │
│   └── pipeline/
│       ├── clean_pipeline.py
│       ├── merge_pipeline.py
│       └── import_pipeline.py
│
├── scripts/
│   └── seed_database.py
│
└── requirements.txt
```

Documentation:

```text
docs/Members/report/
└── TV3_Data_Engineering_Report.md
```

Runtime/generated artifacts:

```text
crawler/data/raw/
crawler/data/merged/
crawler/data/cleaned/
crawler/data/quality_report/
crawler/data/seed/
```

---

# 28. Overall Pipeline Result

| Stage                       | Result           |
| --------------------------- | ---------------- |
| Workflow Audit              | ✅ COMPLETE       |
| Chợ Tốt Crawler             | ✅ COMPLETE       |
| Bonbanh Crawler             | ✅ COMPLETE       |
| Production Crawl            | ✅ COMPLETE       |
| Dataset Expansion           | ✅ COMPLETE       |
| Merge                       | ✅ COMPLETE       |
| Cleaning                    | ✅ COMPLETE       |
| Validation                  | ✅ COMPLETE       |
| Seed Generation             | ✅ COMPLETE       |
| Database Import Preparation | ✅ COMPLETE       |
| Physical Database Import    | ⏳ Database Owner |
| Real-time Pipeline          | ❌ Not in scope   |

Final dataset:

```text
10,813 real records
```

Data quality:

```text
98.41 / 100
Grade A
PASS WITH WARNINGS
```

---

# 29. Final TV3 Status

```text
================================================================
                 TV3 DATA ENGINEERING STATUS
================================================================

Data Crawling                 COMPLETE
Raw Data Collection           COMPLETE
Production Dataset            COMPLETE
Dataset Merge                 COMPLETE
Data Cleaning                 COMPLETE
Data Validation               COMPLETE
Quality Assessment            COMPLETE
Seed Generation               COMPLETE
Import Preparation            COMPLETE

Final Records                 10,813
Data Quality                  98.41 / 100
Grade                         A
Validation Status             PASS WITH WARNINGS

Database Schema               OWNED BY DATABASE MEMBER
Physical DB Import            PENDING DATABASE DEPLOYMENT

Raw Dataset                   IMMUTABLE
Clean Dataset                 IMMUTABLE

Backend Modified              NO
Frontend Modified             NO
Database Architecture         NOT MODIFIED

TV3 FINAL STATUS:
COMPLETE — READY FOR DATABASE HANDOFF
================================================================
```

# 30. Conclusion

TV3 đã hoàn thành toàn bộ phần Data Engineering được phân công.

Pipeline đã đi qua đầy đủ các bước:

```text
Crawl
  ↓
Raw
  ↓
Merge
  ↓
Clean
  ↓
Validate
  ↓
Seed
  ↓
Database Handoff
```

Dataset cuối cùng gồm **10,813 records thực tế** từ Chợ Tốt và Bonbanh.

Dữ liệu đạt:

* 100% schema compliance
* 100% critical-field completeness
* 100% source traceability
* 0 exact duplicate records
* 0 type errors
* 98.41/100 overall quality score

Các anomaly còn tồn tại được ghi nhận minh bạch và không bị xóa hoặc sửa giả tạo.

TV3 dừng tại **Database Handoff** vì database schema và physical database provisioning thuộc thành viên phụ trách Database. Đây là boundary của trách nhiệm TV3 và giúp tránh việc tự ý thay đổi kiến trúc database của nhóm.

**Final conclusion:**

> **TV3 — Data Engineering & Data Pipeline: COMPLETE.**
> **Dataset: 10,813 real records.**
> **Quality: 98.41/100 — Grade A.**
> **Seed: READY.**
> **Next owner: Database member / TV5 for schema deployment and physical import.**

---

# 31. TV4 Compatibility & Dataset Enrichment

## 31.1. TV4 Feedback
TV4 đề xuất bổ sung các đặc trưng phục vụ mô hình Regression: `origin`, `engine_size`, `seat_count` và `listed_year`. Hai bên thống nhất:
* `listed_year = int(crawled_at[:4])` suy diễn được trực tiếp từ `crawled_at`, không thêm cột dư thừa vào schema chuẩn.
* `origin`, `engine_size`, `seat_count` được làm giàu trực tiếp từ detail page của nguồn gốc.

## 31.2. TV3 Action
* Xây dựng pipeline `crawler/src/pipeline/enrich_pipeline.py` với multi-threading, checkpointing và retry.
* Bổ sung chuẩn hóa transmission (`Automatic`, `Manual`, `CVT`; 21 `Semi-Automatic` và 1 `Other` chuyển về `null`).
* Chuẩn hóa fuel_type (`Gasoline`, `Diesel`, `Electric`, `Hybrid`; giá trị dị biệt `Loại khác  2.5 L` chuyển về `null`).
* Xuất CSV bằng chuẩn `utf-8-sig` (UTF-8 có BOM) để khắc phục triệt để lỗi font tiếng Việt trong R và PowerShell.

## 31.3. Bảng khả dụng thuộc tính (17 fields)

| Thuộc tính | Nguồn | Kiểu dữ liệu | Quy tắc missing | Độ đầy đủ | Tình trạng TV4 |
|---|---|---|---|---|---|
| `brand` | Listing | String | Bắt buộc | 10,813 (100.0%) | Khả dụng |
| `model` | Listing | String | Bắt buộc | 10,813 (100.0%) | Khả dụng |
| `variant` | Listing/Specs | String | null nếu thiếu | 9,340 (86.38%) | Khả dụng |
| `manufacture_year` | Listing/Specs | Integer | Bắt buộc | 10,813 (100.0%) | Khả dụng |
| `price` | Listing | Integer | Bắt buộc | 10,813 (100.0%) | Khả dụng |
| `mileage` | Listing/Specs | Integer | null nếu thiếu | 8,506 (78.66%) | Khả dụng |
| `fuel_type` | Listing/Specs | Categorical | null nếu thiếu | 10,812 (99.99%) | Khả dụng |
| `transmission` | Listing/Specs | Categorical | null nếu thiếu | 10,791 (99.80%) | Khả dụng |
| `body_type` | Listing/Specs | Categorical | null nếu thiếu | 9,752 (90.19%) | Khả dụng |
| `location` | Listing | String | Bắt buộc | 10,813 (100.0%) | Khả dụng |
| `origin` | Detail specs | Categorical | null nếu thiếu | 1,588 (14.69%) | **Khả dụng** |
| `engine_size` | Detail specs / Variant | Float (L) | null nếu thiếu | 5,959 (55.11%) | **Khả dụng** |
| `seat_count` | Detail specs / Variant | Integer | null nếu thiếu | 1,338 (12.37%) | **Khả dụng** |
| `source_url` | Source | String | Bắt buộc (Unique) | 10,813 (100.0%) | Khả dụng |
| `image_url` | CDN | String | null nếu thiếu | 10,813 (100.0%) | Khả dụng |
| `listed_at` | Listing | String | null nếu thiếu | 10,812 (99.99%) | Khả dụng |
| `crawled_at` | Pipeline | ISO 8601 | Bắt buộc | 10,813 (100.0%) | Khả dụng |
| *`listed_year`* | Derived | Integer | Suy diễn từ `crawled_at` | 10,813 (100.0%) | **Khả dụng downstream** |

## 31.4. Chất lượng dữ liệu & Anomaly
* **Giá thấp (< 50M VND):** 68 records (tiền cọc/trả trước do người bán nhập). Giữ nguyên tính trung thực dữ liệu gốc.
* **Giá cao (> 15B VND):** 5 records (siêu xe Rolls-Royce, Bentley, Maybach). Dữ liệu thật.
* **Odo bất thường (> 1,000,000 km):** 8 records, trong đó có 1 record 3,380,000,000 km (lỗi gõ phím từ người bán trên Bonbanh). Lưu nguyên vẹn số nguyên, bàn giao cho TV4 lọc outlier.
* **Năm sản xuất cổ (< 1990):** 11 records (1980 - 1989). Xe cổ thực tế.

## 31.5. Bảng chỉ số vận hành chuẩn (Operational Metrics)

| STT | Chỉ số vận hành | Số lượng đo đạc | Ngữ cảnh & Mẫu số |
|---|---|---|---|
| 1 | **Tổng số records** | **10,813** | 100% records dataset chuẩn |
| 2 | **Số records đã đủ cả 3 trường (bỏ qua)** | **817** | origin, engine_size, seat_count đều non-null |
| 3 | **Số records cần làm giàu** | **9,996** | Có ít nhất 1 trường NULL ($817 + 9,996 = 10,813$) |
| 4 | **Số URL chi tiết mục tiêu** | **10,813** | 100% URL unique toàn bộ dataset |
| 5 | **Số lượt HTTP request thực tế** | **10,813** | Requests phát ra trong lượt crawl detail |
| 6 | **Số phản hồi HTTP thành công (200 OK)** | **1,588** | Chợ Tốt: 1,101; Bonbanh: 487 |
| 7 | **Số phản hồi HTTP 404/410 (tin hết hạn)** | **2,015** | Tin đã xóa/hết hạn trên Chợ Tốt ($1,101 + 2,015 = 3,116$) |
| 8 | **Số phản hồi HTTP 403 (rate-limit)** | **7,210** | Nginx rate limit trên Bonbanh ($487 + 7,210 = 7,697$) |
| 9 | **Số lượt retry** | Giới hạn (max 1) | Retry khi gặp timeout mạng tạm thời |
| 10 | **Số records làm giàu thành công (incremental)** | **5,406** | Records nhận giá trị mới từ variant (5,406 engine_size, 6 seat_count, trùng 6) |
| 11 | **Số records không có giá trị mới** | **4,590** | Records cần làm giàu nhưng variant không có thông số ($9,996 - 5,406 = 4,590$) |
| 12 | **Lỗi phân tích cú pháp (parse failures)** | **0** | 0 lỗi parse |
| 13 | **Giá trị trích xuất không hợp lệ** | **0** | 0 giá trị sai kiểu dữ liệu hoặc ngoài biên |

> **Fields unresolved after local extraction and incremental source enrichment:**
> - `origin`: **9,225** records chưa xác định (14.69% đầy đủ)
> - `engine_size`: **4,854** records chưa xác định (55.11% đầy đủ)
> - `seat_count`: **9,475** records chưa xác định (12.37% đầy đủ)

## 31.6. Phân định trách nhiệm
> **TV3:** Thu thập, làm sạch, chuẩn hóa danh mục, kiểm định dữ liệu và bảo đảm tính trung thực của nguồn gốc. Dữ liệu là source-derived data: các giá trị được trích xuất từ thông tin niêm yết rõ ràng của nguồn hoặc dữ liệu variant nội bộ; các giá trị không thể xác minh được giữ nguyên là null. TV3 không tự ý xóa bỏ các giá trị dị biệt hợp lệ và không tự suy đoán dữ liệu thiếu.  
> **TV4:** Chịu trách nhiệm toàn bộ giai đoạn ML Preprocessing cho Regression (xử lý outlier, imputation giá trị missing, encoding, feature scaling và train/test split).

## 31.7. Kết luận tương thích TV4
```text
================================================================
TV4 HANDOFF STATUS: PASS WITH WARNINGS
================================================================
Lý do:
1. Đầy đủ 17 trường chuẩn theo đúng thứ tự schema trong JSON và CSV.
2. Dữ liệu source-derived: trích xuất có căn cứ từ marketplace/variant,
   không tạo dữ liệu giả.
3. Giá trị null tự nhiên được giữ nguyên (origin: 9,225; engine: 4,854; seats: 9,475).
4. listed_year suy diễn 100% downstream từ crawled_at.
5. Toàn bộ anomaly được ghi nhận minh bạch kèm chứng cứ nguồn.
6. CSV encoding đạt chuẩn UTF-8-SIG (có BOM).
7. Raw data giữ nguyên vẹn 100% (SHA256 verified).
================================================================
```




## 33. Bổ sung kiểm toán import và showroom ngày 30/09/2026

Phần lịch sử ở trên phản ánh các mốc cũ; nó không chứng minh đã import PostgreSQL. Kiểm toán độc lập lần này đọc đủ 10.813 dòng JSON và CSV sạch, 17 trường, 10.813 URL duy nhất, seed JSON/CSV 18 trường. So sánh từng dòng cho thấy 0 sai khác JSON/CSV sạch và 0 sai khác ở seed, kể cả `image_url` và `listed_at` → `listed_at_raw`. Các tập raw/merged/cleaned/seed có 24 file; SHA-256 trước và sau giống nhau từng file tại `audit/import_2026_09_30/original_hashes_before.txt` và `original_hashes_after.txt` (Compare-Object rỗng). Dữ liệu gốc không bị viết lại.

### Lỗi, chính sách và số lượng

Hàng 3161, URL `https://bonbanh.com/xe-mazda-bt50-2.2l-4x4-mt-2016-6914854`, có `mileage=3380000000`, vượt PostgreSQL INT 2147483647. Giá trị raw cũng là `3,380,000,000 Km`; không đoán giá trị thay thế. Strict mode từ chối toàn batch trước transaction và báo URL/giá trị. Quarantine mode lưu nguyên hàng cùng lý do vào `audit/import_2026_09_30/generated/quarantine.json`: **source 10.813, accepted 10.812, rejected 1**. Chỉ 10.812 hàng hợp lệ được import. Parser giờ từ chối số âm, boolean/NaN/infinity, phân biệt dấu thập phân và dấu ngăn nghìn, xử lý `k`, `vạn`, `nghìn`, `tỷ`, `triệu` và hỗn hợp được hỗ trợ. Dạng mơ hồ/không nhận biết trả NULL, không suy đoán. Validator import kiểm tra kiểu, enum, độ dài VARCHAR, URL tuyệt đối, timestamp có múi giờ và giới hạn DB.

Identity archive là mười thuộc tính `brand, model, variant, manufacture_year, fuel_type, transmission, engine_size, origin, seat_count, body_type`, so sánh NULL an toàn, chỉ tái dùng xe có `showroom_id IS NULL` và `vin IS NULL`. Cùng cấu hình không có nghĩa cùng xe vật lý. `source_url` vẫn là khóa idempotency listing. Giá, mileage, ảnh quảng cáo ở `listings`; `VehicleResponse` showroom đọc các cột vật lý trên `vehicles`. Migration V3_0_1 đổi cấu hình không showroom sang `ARCHIVED`; catalog public chỉ trả xe AVAILABLE có showroom, luồng cọc còn kiểm tra showroom và giá. Không tự gán quảng cáo vào showroom. Seed dev dùng 10 `demo_key` ổn định, 7 AVAILABLE, 1 HOLD, 1 RESERVED, 1 SOLD; các xe được gắn nhãn DEMO, không có VIN thật.

### Cờ cần rà soát

`audit/import_2026_09_30/audit.json` ghi URL và lý do: 12 giá ≤20 triệu, 11 mileage ≥1 triệu, 189 nhóm cấu hình bảy trường có `origin`/`seat_count`/`body_type` không-null mâu thuẫn. Thiếu thuộc tính: variant 1.473, mileage 2.307, fuel 1, transmission 22, body 1.090, origin 9.225, engine 4.854, seat 9.475, image 0, listed_at 1. Alias: Mazda CX5 161, Honda CRV 134, Hyundai SantaFe 175. `derived_model_aliases.csv` chỉ ghi ánh xạ rõ ràng theo URL, không sửa nguồn. Các cờ không tự chứng minh listing sai. Chưa có chứng cứ đáng tin để sửa giá/km/thuộc tính thiếu. Repository chưa có schema users/roles hay cơ chế seed auth được hỗ trợ, nên tài khoản CUSTOMER/STAFF/ADMIN vẫn là phần phụ thuộc TV4, không giả tạo tài khoản ngoài auth.

### Tệp và kiểm thử

Đã đổi `crawler/src/cleaning/{clean_mileage,clean_price,validator}.py`, `crawler/src/pipeline/import_pipeline.py`, `crawler/scripts/audit_import_data.py`, `crawler/tests/{test_phase1_data_contract,test_import_fixes}.py`, migration `database/migrations/V3_0_1__archive_inventory_boundary.sql`, `database/seed/demo_showroom_vehicles.sql`, Backend `VehicleRepository`, `VehicleService`, `DepositService`, cùng Mapping Matrix, Data Dictionary và schema README. Báo cáo cũ được giữ nguyên phía trên.

Python unittest: 9/9 PASS. Strict CLI: từ chối 1/10.813 trước ghi DB. PostgreSQL 18 local: tạo DB thử riêng `autotrade_tv3_audit_20260930`, chạy schema + V3_0_0 + V3_0_1 + seed demo hai lần: 10 xe demo, không lặp. SQL sinh import hai lần: 10.812 listings/10.812 URL; Python importer hai lần: cùng kết quả, 10.812 ảnh không NULL, 1 `listed_at_raw` NULL đúng nguồn. Không có cấu hình archive nào mang trạng thái AVAILABLE; rollback test `BEGIN/INSERT/ROLLBACK` còn 0 hàng. Backend `mvn test -q` trên DB thử sạch `autotrade_tv3_backend_test_20260930`: PASS. Hai lần thử Backend ban đầu thất bại do DB mặc định chưa có và do dùng chung DB đã nạp 10.812 quảng cáo; lần chạy trên DB thử sạch đã qua. Không reset database chia sẻ. DB thử biệt lập được giữ lại để tra kết quả.

### Lệnh chạy lại tại repo root (PowerShell)

```powershell
$py='C:\Users\DELL\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $py crawler/scripts/audit_import_data.py
& $py -m unittest discover -s crawler/tests -v
& $py crawler/src/pipeline/import_pipeline.py --policy strict
& $py crawler/src/pipeline/import_pipeline.py --policy quarantine
# Chỉ trên DB thử biệt lập đã có schema + migrations V3_0_0, V3_0_1:
# DB mới/disposable: psql -d <test_db> -f database/schema/schema.sql
psql -d <test_db> -f database/migrations/V3_0_0__showroom_deposit_appointment.sql
psql -d <test_db> -f database/migrations/V3_0_1__archive_inventory_boundary.sql
$env:DB_NAME='autotrade_tv3_audit_20260930'
& $py crawler/src/pipeline/import_pipeline.py --policy quarantine --import-db
psql -d autotrade_tv3_audit_20260930 -f database/seed/demo_showroom_vehicles.sql
psql -d autotrade_tv3_audit_20260930 -tAc 'SELECT count(*),count(DISTINCT source_url) FROM listings'
Compare-Object (Get-Content audit/import_2026_09_30/original_hashes_before.txt) (Get-Content audit/import_2026_09_30/original_hashes_after.txt)
```

`--import-db` cần `psycopg2-binary` và biến DB_HOST/DB_PORT/DB_NAME/DB_USERNAME/DB_PASSWORD phù hợp. Không chạy `database/schema/schema.sql` trên DB có dữ liệu: file này DROP bảng. Dữ liệu archive không được coi là tồn kho đặt cọc; 10 xe demo và tài khoản thật của TV4 vẫn phải được kiểm tra end-to-end sau khi auth hoàn thành.

## 34. Kiểm toán integrity appointments và transaction_ledger ngày 30/09/2026

Đã đọc kế hoạch DOCX, Workflow 4 Increment, mission TV3/TV4, schema/migrations/seed/tests và tài liệu DB; Backend chỉ đọc để xác lập contract. Bổ sung migration additive **V3_0_3__appointment_ledger_integrity.sql**: CHECK ledger type `DEPOSIT_RECEIVED/REFUND/FORFEIT`, status `CONFIRMED/PROCESSED/REVERSED`; khi CONFIRMED, nhận cọc phải dương (khác NaN), REFUND phải âm theo DepositService/AdminLedgerService. Chưa ép dấu tiền cho FORFEIT/PROCESSED/REVERSED. Thêm ba index không unique cho appointment deposit_id, vehicle_id và (user_id, appointment_date DESC), dựa trên FK và AppointmentRepository. Giữ nguyên CHECK PENDING/COMPLETED/CANCELLED, FK SET NULL/RESTRICT và V3_0_2; không đoán cardinality/cross-table/lifecycle.

PostgreSQL 18.6: DB mới `autotrade_tv3_integrity_20260930_230336_851` chạy bootstrap, smoke v2 trước seed, V3_0_0..V3_0_3, seed hai lần, deposit regression, appointment/ledger CHECK/NULL/FK/delete/rollback và index definitions: **PASS**. Test âm kiểm tra đúng constraint name và SQLSTATE; RESTRICT trên PG18 trả 23001. Probe riêng `_preflight` chứa một ledger UNKNOWN: migration từ chối, không thêm constraint/index dở dang và không sửa/xóa hàng vi phạm. DB thử được giữ; các lần thử ban đầu thất bại và cách sửa được ghi trong guide/evidence, không che kết quả thất bại.

Audit preflight: 0 vi phạm ledger, 0 orphan appointment/ledger, users/roles không tồn tại. Chỉ sau test thành công mới apply V3_0_3 vào `autotrade_tv3_audit_20260930`, ON_ERROR_STOP=1: **PASS**. Snapshot toàn hàng theo id ở 7 bảng trước/sau khớp hoàn toàn: **10.812 listings, 10.812 distinct URL, 10.812 ảnh không NULL; 5.243 ARCHIVED không showroom; 10 demo = 7 AVAILABLE + 1 HOLD + 1 RESERVED + 1 SOLD**. Không chạy mutation/seed/schema.sql trên audit; không kết nối hoặc thay đổi `autotrade_tv3_backend_test_20260930`.

Tệp của lần này: migration V3_0_3; `database/tests/appointment_ledger_{preflight,integrity_test,snapshot,preflight_fixture,preflight_rejection_test,catalog_test}.sql`; runner `run_appointment_ledger_audit.ps1`; `database/guides/Appointment_Ledger_Integrity.md`; schema README; phần bổ sung Data Dictionary; evidence tại `database/evidence/appointment_ledger_20260930/`. Credential dùng biến môi trường có sẵn, không in/lưu mật khẩu; các SQL mới UTF-8 không BOM. V3_0_2 và deposit_integrity_test.sql giữ nguyên SHA-256 lần lượt `8766be713a25c1b68a4cfb6206e9753285f02fed2a00f35a0f6c0fb757351b07` và `3b9d8d0dfa8bfdec0e84a1846e7977602e3c4167d940b7eb71f1f9a213c15261`.

Dependency còn mở: TV4/TV1 cần chốt user/role schema, identity/password hash/lock/current-user và delete policy trước migration/seed account/FK user_id. Không tạo fake users. Workflow dùng SCHEDULED nhưng schema/entity dùng PENDING, cần TV1/TV5 chốt; ngày quá khứ cần TV1 validate khi tạo/đổi lịch, không dùng CHECK thời gian thay đổi; callback/reference idempotency và sign/lifecycle chưa có contract đầy đủ. Kiểm tra này **không chứng minh hoàn thành toàn bộ TV3**, auth hay Gate integration.

Kiểm tra SHA-256 toàn bộ tệp ngoài phạm vi so với snapshot đầu phiên: **0 thay đổi**, bao gồm toàn bộ crawler/ và Backend; các thay đổi đã có trước phiên được giữ nguyên. Không commit/push. V3_0_3 đã apply nên không có lệnh DB bắt buộc còn lại; runner mặc định có thể tạo DB mới để tái kiểm thử khi cần, không dùng lại -ApplyAudit trên audit hiện tại. Hướng dẫn, giới hạn và bảng kết quả chi tiết nằm trong guide.

## 35. Tổng hợp công việc TV3 và yêu cầu phối hợp TV4 — 30/09/2026

### 35.1. Phạm vi hiện hành

Theo kế hoạch ba ngày và `docs/Members/mission/TV3.md`, TV3 phụ trách PostgreSQL schema vật lý, migration, constraint/index/FK, seed, dữ liệu demo, Data Dictionary và hướng dẫn bootstrap/backup/reset. TV4 phụ trách auth/security và cung cấp contract tài khoản để TV3 triển khai database tương thích.

Các mục crawler/ML trước đây được giữ làm lịch sử; không dùng để phân công công việc hiện tại. Trong đợt integrity V3_0_3, Backend chỉ được đọc để xác lập contract; không sửa Backend, frontend hoặc crawler.

### 35.2. Nội dung đã hoàn thành

| Hạng mục | Kết quả ghi nhận | Căn cứ |
|---|---|---|
| Kết nối PostgreSQL và kiểm tra cấu trúc | Hai database audit/backend test đều có 7 bảng | Output PowerShell người dùng cung cấp |
| Dữ liệu marketplace trên database audit | 10.812 listings, 10.812 URL phân biệt, 10.812 ảnh không NULL | Truy vấn COUNT thực tế |
| Phân biệt archive và tồn kho showroom | 5.243 cấu hình ARCHIVED không showroom; 10 xe demo gồm 7 AVAILABLE, 1 HOLD, 1 RESERVED, 1 SOLD | Truy vấn GROUP BY thực tế |
| Preflight deposit | Không có xe có nhiều cọc DEPOSITED; không có amount <= 0 | Truy vấn trước V3_0_2 |
| Migration V3_0_2 | Đã áp dụng unique index theo vehicle_id khi status=DEPOSITED và CHECK amount > 0 | Output BEGIN/CREATE INDEX/ALTER TABLE/COMMIT |
| Deposit regression | Chặn cọc DEPOSITED trùng xe và tiền cọc bằng 0; các dòng thử rollback | Hai NOTICE PASS và ROLLBACK |
| Migration V3_0_3 | Bổ sung ledger CHECK và ba appointment index; đã áp dụng trên audit sau test biệt lập/preflight | Báo cáo Codex và mục 34 |
| Kiểm thử V3_0_3 | Bootstrap sạch, migration, seed lặp, CHECK/NULL/FK/delete/rollback/index và probe dữ liệu vi phạm được báo cáo PASS | Mục 34; evidence trong repository |
| Bảo toàn dữ liệu/phạm vi | Snapshot 7 bảng trước/sau khớp; database backend test và các tệp ngoài phạm vi không đổi trong phiên V3_0_3 | Mục 34; snapshot/SHA-256 do Codex ghi nhận |
| Tài liệu | Đã cập nhật Data Dictionary, README, guide integrity và báo cáo tiến độ | Danh sách tệp tại mục 34 |

V3_0_2 chống trùng cọc ở trạng thái DEPOSITED; không suy ra rằng mọi trạng thái giữ chỗ khác hoặc toàn bộ lifecycle đã được khóa. Kiểm tra tiền cọc bằng 0 không thay thế kiểm thử đầy đủ mọi biên số tiền. Các kết quả V3_0_3 được tổng hợp theo báo cáo Codex và mục 34, không phải một lần kiểm toán độc lập mới trong lần bổ sung tài liệu này.

Không chạy lại V3_0_2/V3_0_3 trên database audit đã áp dụng. Không chạy `schema.sql` trên database có dữ liệu cần giữ.

### 35.3. TV4 cần xác nhận gì để TV3 làm tiếp

Database hiện chưa có `users` và `roles`; chưa thể bổ sung FK user_id và seed tài khoản tương thích auth khi contract còn thiếu. TV4 cần bàn giao một contract rõ ràng, có phiên bản hoặc mốc xác nhận, gồm:

| Nội dung cần chốt | TV4 cần cung cấp/xác nhận | TV3 sử dụng để làm gì |
|---|---|---|
| Identity tài khoản | Tên đăng nhập hay email; trường bắt buộc; quy tắc chuẩn hóa và UNIQUE; các trường profile được auth sử dụng | Thiết kế bảng users và index/constraint |
| Password hash | Thuật toán/encoder, tham số và định dạng hash mà code đăng nhập chấp nhận; độ dài cột cần thiết | Thiết kế cột password hash, tạo seed đăng nhập được |
| Role và cardinality | CUSTOMER/STAFF/ADMIN; một hay nhiều role mỗi user; cách code auth đọc role và tên authority | Thiết kế roles và quan hệ user–role tương thích |
| Khóa/trạng thái tài khoản | Trạng thái hợp lệ, giá trị mặc định, cơ chế enabled/locked và yêu cầu dữ liệu liên quan | CHECK/default/nullable và seed đúng trạng thái |
| STAFF và showroom | Có cần liên kết showroom không; một hay nhiều showroom; nullable và chính sách khi showroom bị xóa | FK/quan hệ/index tương ứng |
| Khóa user và current-user | Kiểu PK user; cách auth xác định user hiện tại; thống nhất với TV1 về user_id trong deposit/appointment | FK và contract dữ liệu xuyên các bảng |
| Xóa hoặc vô hiệu hóa tài khoản | Hard delete hay soft delete; cách bảo toàn deposit, appointment và ledger khi user ngừng hoạt động | Chọn delete policy và kiểm thử referential integrity |
| Tài khoản demo | Bộ tài khoản CUSTOMER/STAFF/ADMIN và yêu cầu quyền/phạm vi showroom để kiểm thử | Seed dev có thể chạy lại, bàn giao test account |

Không ghi mật khẩu thật, token hoặc secret vào báo cáo/repository. Nếu dùng tài khoản demo, phải thống nhất cơ chế cấu hình thông tin đăng nhập dev và lưu hash đúng định dạng; TV3 không tạo tài khoản giả chỉ để vượt FK/test.

TV4 chịu trách nhiệm triển khai đăng nhập, xác định current-user và phân quyền trong Backend. TV3 chịu trách nhiệm viết migration/seed database sau khi nhận contract; không giao toàn bộ phần users/roles database sang TV4.

### 35.4. Các dependency khác cần phối hợp

| Điểm chưa chốt | Thành viên cần phối hợp | Hành động cần có |
|---|---|---|
| SCHEDULED trong workflow và PENDING trong schema/entity | TV1 và TV5; TV4 nếu liên quan kiểm tra quyền | Thống nhất enum trước khi TV3 thay CHECK |
| Ngày hẹn phải ở tương lai | TV1 | Chốt và triển khai validation khi tạo/đổi lịch; không suy đoán CHECK phụ thuộc thời gian hiện tại |
| FORFEIT/PROCESSED/REVERSED | TV1 và người phụ trách workflow liên quan | Chốt dấu tiền và lifecycle để xác định constraint DB bổ sung |
| Callback/reference idempotency | TV1; TV4 nếu có yêu cầu xác thực callback | Chốt khóa tham chiếu và quy tắc xử lý lặp trước khi thêm UNIQUE |

Những điểm này không mặc định thuộc riêng TV4 và không được giải quyết bằng cách TV3 tự sửa business logic.

### 35.5. Trình tự TV3 thực hiện sau khi nhận contract

1. Đối chiếu contract TV4 với schema/API của TV1; ghi impact và version.
2. Viết migration additive tiếp theo cho users/roles và quan hệ cần thiết; không sửa migration đã áp dụng.
3. Kiểm tra user_id hiện có trước khi thêm FK; báo cáo orphan và thống nhất cách xử lý, không tự xóa dữ liệu hoặc tạo user giả.
4. Seed CUSTOMER/STAFF/ADMIN tương thích password encoder, role và showroom đã chốt; bảo đảm seed dev chạy lại an toàn.
5. Kiểm thử trên database biệt lập: bootstrap/migration, seed lặp, UNIQUE/FK/CHECK/NULL/delete/rollback và các ca quyền dữ liệu cần bàn giao.
6. Cập nhật Data Dictionary, ERD vật lý phối hợp TV5, bootstrap/backup/reset guide và log kiểm thử.
7. Bàn giao migration/schema/seed cho TV1/TV4, dữ liệu demo cho TV2 và bằng chứng DB cho TV5; kiểm thử tích hợp theo phân công, không sửa code ngoài phạm vi.

Trong thời gian chờ TV4, TV3 vẫn tiếp tục hoàn thiện hướng dẫn bootstrap/backup/reset, tổng hợp evidence và kiểm thử các constraint không phụ thuộc tài khoản.

**Trạng thái hiện tại:** các bước kiểm tra dữ liệu và integrity V3_0_2/V3_0_3 đã có kết quả nêu trên; phần users/roles, FK user_id, seed tài khoản và kiểm thử auth tích hợp còn chờ contract. Chưa xác nhận hoàn thành toàn bộ TV3.
