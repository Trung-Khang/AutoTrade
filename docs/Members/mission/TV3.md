# TV3.md — Data Engineering, Crawler & Data Cleaning

> **Cập nhật phạm vi ngày 27/09/2026:** Mục 13 ở cuối tài liệu và `scope_change_mission.md` là nhiệm vụ hiện hành. Dataset 17 trường vẫn được giữ làm nguồn dữ liệu chuẩn cho tìm kiếm và Machine Learning.

## 1. Vai trò

**Vai trò:** Data Engineer / Data Pipeline Developer

TV3 chịu trách nhiệm xây dựng pipeline thu thập, làm sạch, chuẩn hóa, validation và chuẩn bị dữ liệu xe cho PostgreSQL.

### Phạm vi chính

```text
crawler/
database/seed/
```

TV3 không chịu trách nhiệm chính về:
- Spring Boot.
- React.
- Huấn luyện Regression.
- Recommendation algorithm.

---

# 2. Mục tiêu dữ liệu

Dataset mục tiêu:

```text
2.000–5.000+ listings
```

Mỗi listing nên có thông tin đủ để:

- Hiển thị lên Web.
- Lọc/tìm kiếm.
- Đưa feature vào model nếu phù hợp.
- Truy xuất nguồn.

Các field mục tiêu:

```text
brand
model
variant
manufacture_year
price
mileage
fuel_type
transmission
body_type
location
source_url
image_url
listed_at
crawled_at
```

---

# 3. Increment 1 — Foundation

## 3.1. Chốt Data Contract

Làm việc với:

- TV4 để xác định feature Model.
- TV5 để xác định field Database.
- TV1 để xác định backend API contract.

Tạo documentation tại:

```text
crawler/README.md
```

## 3.2. Chuẩn bị Seed Dataset

Trước khi crawler hoàn chỉnh, chuẩn bị dataset nhỏ:

```text
500–1.000 records
```

để các thành viên khác development.

Vị trí:

```text
crawler/data/seed/
```

---

# 4. Increment 2 — Market Data

## 4.1. Crawler Chợ Tốt

Vị trí:

```text
crawler/src/crawlers/chotot/
├── crawler.py
└── parser.py
```

`crawler.py` chịu trách nhiệm lấy dữ liệu.

`parser.py` chịu trách nhiệm chuyển dữ liệu nguồn thành schema nội bộ.

## 4.2. Crawler Bonbanh

Vị trí:

```text
crawler/src/crawlers/bonbanh/
├── crawler.py
└── parser.py
```

Nếu nguồn không cần/không thể triển khai thực tế, không được tự tạo dữ liệu giả để tuyên bố là crawl.

## 4.3. Data Cleaning

Vị trí:

```text
crawler/src/cleaning/
├── clean_price.py
├── clean_mileage.py
├── clean_vehicle.py
└── validator.py
```

### Giá

Ví dụ:

```text
750 triệu
↓
750000000
```

### ODO

```text
45.000 km
↓
45000
```

### Năm

Kiểm tra range hợp lý.

### Missing

Xử lý theo rule đã thống nhất với TV4/TV5.

## 4.4. Duplicate Detection

Kiểm tra duplicate dựa trên các trường phù hợp như:

```text
source_url
source + source_id nếu có
```

Không được xóa hai listing khác nhau chỉ vì cùng model/giá.

---

# 5. Pipeline

Vị trí:

```text
crawler/src/pipeline/
├── crawl_pipeline.py
├── clean_pipeline.py
└── import_pipeline.py
```

Luồng:

```text
Source
 ↓
Raw
 ↓
Cleaning
 ↓
Validation
 ↓
Cleaned
 ↓
Database
```

Scripts:

```text
crawler/scripts/
├── crawl.py
├── clean.py
└── seed_database.py
```

---

# 6. Data Directory

Cấu trúc:

```text
crawler/data/
├── raw/
├── cleaned/
└── seed/
```

Quy tắc:

- Raw: dữ liệu thô.
- Cleaned: dữ liệu sau cleaning.
- Seed: dataset ổn định phục vụ demo/dev.

Không commit file dữ liệu dung lượng quá lớn nếu không cần thiết.

---

# 7. Increment 3 — Hỗ trợ Model

TV3 phải cung cấp cho TV4:

```text
Clean Dataset
```

đúng schema.

Cần document rõ:

```text
field name
type
unit
missing rule
example
```

TV4 không được phải tự đoán ý nghĩa field.

Ví dụ:

```text
price → VND
mileage → km
manufacture_year → integer
```

---

# 8. Increment 4 — Final Dataset

Chuẩn bị:

```text
2.000–5.000+ clean records
```

Kiểm tra:

- Không có price âm.
- Không có mileage âm.
- Year hợp lệ.
- URL tồn tại nếu source yêu cầu.
- Field bắt buộc không rỗng.
- Encoding tiếng Việt đúng.
- Không duplicate bất hợp lý.

Chuẩn bị dataset phục vụ:

```text
demo
database seed
performance test
model validation
```

---

# 9. Nhiệm vụ bổ sung — Scheduler / Cronjob (Tùy chọn)

> **Mức độ ưu tiên: Tùy chọn.**
>
> Chỉ thực hiện sau khi Crawler, Cleaning, Validation và Seed/Import Pipeline đã chạy ổn định. **Không làm blocker cho chức năng cốt lõi.**

## Mục tiêu

Cho phép Data Pipeline được chạy định kỳ thay vì luôn phải chạy thủ công.

### Checklist
- Chốt script chạy toàn bộ pipeline.
- Đảm bảo pipeline chạy độc lập từ command/script.
- Bổ sung Scheduler hoặc Cronjob.
- Cấu hình chu kỳ chạy thử nghiệm, ví dụ 1 tuần/lần.
- Ghi log thời gian chạy.
- Ghi log kết quả crawl/import.
- Kiểm tra trường hợp pipeline lỗi.
- Không tạo dữ liệu trùng lặp không kiểm soát.

### Cách triển khai
Chọn một trong các hướng:
- Python `schedule`.
- Crontab trên Linux.
- Scheduler phù hợp với môi trường triển khai thực tế.

Không cần triển khai nhiều cơ chế cùng lúc.

### Input
- `crawl_pipeline.py`.
- `clean_pipeline.py`.
- `import_pipeline.py`.
- Database/import configuration đã ổn định.

### Output
- Script hoặc cấu hình Scheduler.
- Log chạy pipeline.
- Hướng dẫn chạy.

### Bàn giao
- **TV5:** nhận thông tin lịch chạy và dữ liệu được cập nhật.
- **Cả nhóm:** nhận hướng dẫn vận hành pipeline.

### Definition of Done
- Pipeline vẫn chạy được thủ công.
- Scheduler chỉ chạy khi được cấu hình.
- Không ảnh hưởng chức năng Demo nếu Scheduler không chạy.
- Có thể giải thích và trình diễn cơ chế tự động cập nhật dữ liệu.

---

# 10. Bàn giao

### TV4

Bàn giao:

```text
clean dataset
data dictionary
feature availability
data quality report
```

TV4 dùng cho Regression.

### TV5

Bàn giao:

```text
seed dataset
listing fields
source information
crawl timestamps
```

### TV1

Bàn giao:

```text
database-ready dataset
import instructions
field mapping
```

### TV2

Không cần code, nhưng phải cung cấp field/format hiển thị nếu có yêu cầu.

---


# 11. Tiêu chí nghiệm thu TV3

- Có pipeline crawl.
- Có parser.
- Có cleaning.
- Có validation.
- Có duplicate handling.
- Có seed dataset.
- Có dataset tối thiểu khoảng 2.000 records ở bản cuối.
- Các field theo Data Contract đầy đủ.
- Import vào PostgreSQL thành công.
- Có source_url/listed_at/crawled_at phù hợp.
- Có README hướng dẫn chạy pipeline.

---
# 12. Không làm ngoài phạm vi

Không xây:

- Spring Boot.
- React.
- Regression model.
- Deep Learning.
- Recommendation engine.
- Payment/chat.

---

# 13. Nhiệm vụ bổ sung sau thay đổi phạm vi - Dữ liệu và tin đăng nhập từ nguồn

TV3 giữ ranh giới Data Pipeline. TV3 không xây auth/payment, nhưng phải bảo đảm dữ liệu crawl cùng tồn tại an toàn với listing do user tạo.

## Việc đầu tiên

1. Chốt **một** canonical dataset version/checksum thống nhất trong CSV, JSON, lock report và mapping report.
2. Đóng Gate I2 bằng bằng chứng import/re-import theo schema v2.0.1.
3. Review schema delta TV5 để chốt mapping listing crawl, không tự sửa database schema.

## Tuần 1 - Canonical và mapping mới

- Công bố commit hash, record count, 17 fields, checksum và quality report thống nhất.
- Mapping tin crawl: `listing_origin = CRAWLED`, `seller_id = NULL`, `status = PUBLISHED`.
- Xác nhận import không cần user giả và không tạo dữ liệu enrich giả.
- Cập nhật validator/import tests nếu schema import thay đổi.

## Tuần 2 - Import/re-import và demo seed

- Import theo migration đã chốt; báo cáo insert/update/reject.
- Re-import cùng batch: 0 duplicate `source_url`, user listing không bị sửa hoặc xóa.
- Cung cấp lệnh seed/reset dữ liệu thị trường cho demo.
- Bảo toàn `image_url`, `listed_at_raw`, `crawled_at`, NULL và provenance.

## Tuần 3 - Freeze và hỗ trợ integration

- Đóng băng canonical dataset/import trước integration freeze.
- Kiểm tra FK/constraint cùng TV5, search result cùng TV1/TV2.
- Nếu có data bug P0, sửa bằng version/checksum mới và thông báo TV4; không sửa âm thầm.

**Bàn giao:** canonical checksum và commit, import command, import/re-import report, known data limitations.

**Nghiệm thu:** 10.813 URL unique; imported listing đúng origin/status; pipeline không chạm vào user listing.

## Không làm trong scope mới

- Tài khoản, moderation business logic, payment/deposit và dashboard.
- Training model hoặc tự điền missing để giúp model.
- Crawl realtime trong demo.
