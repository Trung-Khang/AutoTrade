# Nhiệm vụ chuyển đổi phạm vi hệ thống

Ngày ban hành: 27/09/2026. Thời gian còn lại dự kiến: 3 tuần.

Tên đề tài mới: **Xây dựng hệ thống quản lý kinh doanh ô tô đã qua sử dụng**.

Tài liệu này trả lời ba câu hỏi cho từng thành viên: bắt đầu từ đâu, phải chờ ai và bàn giao gì. Chi tiết nghiệp vụ, state machine, gate và test strategy nằm trong `docs/Project/Workflow_4_Increment.md`.

## 1. Quyết định đã khóa

- Giữ search/filter/detail và dữ liệu thị trường của Increment 2.
- Giữ Machine Learning định giá xe và R Plumber.
- Thêm auth, đăng tin, kiểm duyệt, AI risk flag, đặt cọc giả lập, Admin ledger và dashboard.
- Bỏ lịch xem xe/lái thử, Recommendation, Comparison mới, chat, yêu thích và thanh toán toàn bộ xe.
- AI chỉ hỗ trợ Admin; không tự động từ chối tin.
- Payment chỉ là simulator/sandbox cho khoản cọc, không phải escrow pháp lý.

## 2. Việc cả nhóm làm trong 48 giờ đầu

| Thứ tự | Owner | Việc phải làm | Bàn giao cho | Điều kiện hoàn thành |
|---:|---|---|---|---|
| 1 | Leader | Công bố scope freeze và workflow v2 | Cả nhóm | Mọi TV xác nhận đã đọc |
| 2 | TV3 | Chốt một canonical checksum và tình trạng import Increment 2 | TV4, TV5, TV1 | CSV/report/checksum thống nhất |
| 3 | TV5 | Vẽ ERD/state delta, draft migration và API/status matrix | TV1, TV2, TV3, TV4 | Review xong trong Ngày 2 |
| 4 | TV1 | Review security, transaction, JPA và HTTP/error contract | TV5, TV2 | Không còn blocker kiến trúc P0 |
| 5 | TV4 | Xác nhận prediction input/output và model failure behavior | TV1, TV2, TV5 | Contract đủ để tích hợp |
| 6 | TV2 | Map contract thành màn hình và UI states | TV1, TV5 | Không thiếu API cho luồng chính |
| 7 | Leader | Ghi `CONTRACT FROZEN FOR IMPLEMENTATION` | Cả nhóm | Cho phép bắt đầu code song song |

Không chờ mọi runtime issue của Increment 2 vô thời hạn. Sau hai ngày, leader ghi `PASS`, `PASS WITH RUNTIME PENDING` hoặc `BLOCKED` kèm owner và tiếp tục kế hoạch ba tuần.

## 3. Nhiệm vụ theo thành viên

### TV1 - Backend

**Làm ngay:** đóng `ddl-auto=validate` và search smoke; review schema/API TV5.

**Thứ tự:** Auth/RBAC -> Listing ownership/state -> Moderation -> ML client/risk flag -> Deposit/idempotency -> Dashboard.

**Phải chờ:** schema/API draft TV5 trước Entity/Controller mới; prediction contract TV4 trước ML integration.

**Bàn giao:** API contract, OpenAPI/endpoint list, automated tests, error examples và demo evidence cho TV2/TV5.

### TV2 - Frontend

**Làm ngay:** nối showroom hiện có với API thật; đọc contract và lập danh sách màn hình/error state.

**Thứ tự:** Auth UI -> My Listings -> Admin Moderation -> Valuation -> Deposit -> Ledger/Dashboard.

**Phải chờ:** request/response frozen; có thể dựng UI bằng mock đúng contract trong lúc TV1 code.

**Bàn giao:** integrated UI, negative-state screenshots/demo và mismatch list trong ngày cho TV1.

### TV3 - Data Pipeline

**Làm ngay:** thống nhất canonical checksum và bằng chứng import/re-import Increment 2.

**Thứ tự:** Canonical lock -> imported-listing mapping -> import/re-import -> reset/seed demo -> freeze.

**Phải chờ:** migration mới của TV5 trước khi sửa import mapping.

**Bàn giao:** dataset commit/checksum, import command, row counts, idempotency report và data limitations.

### TV4 - Machine Learning

**Làm ngay:** xác minh canonical dataset, chuẩn bị R runtime và chạy EDA/candidate evaluation.

**Thứ tự:** EDA -> A/B/C candidate comparison -> model decision -> `regression_v1` -> Plumber -> integration/monitoring.

**Phải chờ:** canonical checksum TV3 để chốt metrics chính thức; không cần chờ auth/deposit để train model.

**Bàn giao:** artifact có version, preprocessing/prediction contract, metrics/evaluation, runbook và error behavior.

### TV5 - Database, UML và Testing

**Làm ngay:** chủ trì ERD/state/API delta trong hai ngày đầu.

**Thứ tự:** Migration/API freeze -> DB tests -> integration test matrix -> deposit concurrency tests -> UML/SRS/report.

**Phải chờ:** TV1 review feasibility, TV3/TV4 review mapping, TV2 review payload trước contract freeze.

**Bàn giao:** migration/run order, ERD/Data Dictionary/API spec, Use Case/Class/State/Sequence/Activity/Component/Deployment diagrams, test matrix và test report.

## 4. Cổng bàn giao

### Cuối Tuần 1

- Contract frozen; migration và UML draft có version.
- Auth và owner listing chạy ở Backend; UI có skeleton đúng contract.
- Dataset canonical được khóa; TV4 có kết quả candidate hoặc blocker runtime cụ thể.

### Cuối Tuần 2

- Seller submit -> AI prediction/flag -> Admin approve chạy qua API.
- `regression_v1` và Plumber có metrics/test evidence.
- Imported listing và user listing cùng tồn tại, không ghi đè nhau.

### Giữa Tuần 3

- Deposit simulator, idempotency và listing reservation chạy được.
- Admin ledger và dashboard nối API.
- UML/SRS/API/Test Plan phản ánh đúng scope mới.

### Cuối Tuần 3

- Hai golden flows chạy end-to-end.
- Test P0 pass; P1 còn lỗi phải ghi known limitation và không phá demo.
- Seed/reset, lệnh chạy và demo script đã được rehearsal.

## 5. Cách báo cáo mỗi ngày

Mỗi thành viên cập nhật báo cáo cá nhân theo mẫu:

```text
Đã xong:
Đang làm:
Blocked bởi ai/đầu ra nào:
Bằng chứng: commit, test command, log hoặc screenshot
```

Blocker quá nửa ngày phải báo leader. Không tự thay enum, state, API payload, database column hoặc model feature sau contract freeze.

## 6. Trạng thái điều phối

| Gate | Trạng thái ban đầu | Leader cập nhật |
|---|---|---|
| Gate I2 - Market Data | Chờ runtime/checksum evidence | `PENDING` |
| Scope Transition Contract | Chờ review TV1-TV5 | `PENDING` |
| Gate I3 - Auth/Moderation/ML | Chưa bắt đầu | `NOT_STARTED` |
| Gate I4 - Deposit/System Test | Chưa bắt đầu | `NOT_STARTED` |

Khi một gate hoàn tất, leader thay trạng thái và gắn link PR/report bằng chứng ngay trong bảng này.
