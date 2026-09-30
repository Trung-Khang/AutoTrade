# Kiểm toán appointments và transaction_ledger ngày 30/09/2026

TV3 bổ sung migration **V3_0_3__appointment_ledger_integrity.sql**, sau V3_0_2. Chỉ thêm CHECK/index; không đổi hoặc sửa dữ liệu, không đổi FK/lifecycle hiện có. Đã thử biệt lập và áp dụng vào `autotrade_tv3_audit_20260930` bằng `ON_ERROR_STOP=1`. Đây là kiểm toán integrity tập trung, không phải xác nhận hoàn thành toàn bộ nhiệm vụ TV3 hay Gate integration.

## Nguồn và quyết định

Đã đọc kế hoạch `docs/Project/Ke_hoach_3_ngay_phan_cong_nhiem_vu.docx` (trích OOXML), Workflow_4_Increment.md, mission TV3/TV4, schema README, toàn bộ migrations/seed/tests hiện có, Data Dictionary, Mapping Matrix và ERD. Không tìm thấy AGENTS.md trong repository hoặc các thư mục cha được kiểm tra. Không sử dụng emergency_mission.md/scope_change_mission.md làm phân công hiện tại. Backend chỉ được đọc để đối chiếu contract.

| Thay đổi V3_0_3 | Quy tắc và nguồn |
|---|---|
| `chk_ledger_transaction_type` | `DEPOSIT_RECEIVED`, `REFUND`, `FORFEIT`: vocabulary khai báo trong `backend/src/main/java/com/system/entity/TransactionLedger.java`. FORFEIT được chấp nhận là giá trị lưu trữ, không chứng minh đã có workflow tịch thu. |
| `chk_ledger_status` | `CONFIRMED`, `PROCESSED`, `REVERSED`: cùng entity; default CONFIRMED giữ nguyên. |
| `chk_ledger_confirmed_amount` | Chỉ khi CONFIRMED: DEPOSIT_RECEIVED > 0 và khác numeric NaN; REFUND < 0. `DepositService.confirmPayment` lấy amount dương từ deposit (V3_0_2); `AdminLedgerService.refundDeposit` gọi `deposit.getAmount().negate()`. NaN không phải số tiền VND và PostgreSQL coi NaN lớn hơn số thông thường. |
| `idx_appointments_deposit_id` | Hỗ trợ FK SET NULL khi xóa deposit và `AppointmentRepository.findByDepositId`. Index không unique; Optional trong repository không đủ chứng minh cardinality nghiệp vụ. |
| `idx_appointments_vehicle_id` | Hỗ trợ kiểm tra FK RESTRICT khi xóa vehicle; FK không tự tạo index phía tham chiếu. |
| `idx_appointments_user_date` | `(user_id, appointment_date DESC)` khớp `findByUserIdOrderByAppointmentDateDesc`; không tạo user FK khi chưa có bảng identity. |

Không thêm ledger deposit index vì `idx_ledger_deposit_id` đã có. Giữ nguyên appointment indexes trên showroom/date/status; chưa có measurement để thêm index tổng hợp showroom/date hoặc ledger created_at. Index mới là hỗ trợ truy vấn/FK, không phải ràng buộc nghiệp vụ.

## Quy tắc hiện có và phần chờ contract

- Appointment: user/vehicle/showroom/date bắt buộc, deposit nullable; status `PENDING/COMPLETED/CANCELLED`; FK deposit SET NULL, vehicle/showroom RESTRICT. Workflow mục 4 ghi `SCHEDULED`, còn migration V3_0_0 và entity dùng `PENDING`. TV1/TV5 cần chốt tên trạng thái với TV3; chưa tự mở rộng hoặc đổi CHECK.
- Ledger: deposit/amount/type/status bắt buộc; deposit RESTRICT. Không unique theo deposit/type, không ép amount bằng deposit.amount, không ép deposit phải DEPOSITED. Callback/reference lặp là yêu cầu Workflow, nhưng ledger hiện chưa có reference key và policy nhiều bút toán chưa chốt; không suy ra UNIQUE(deposit_id) hoặc UNIQUE(deposit_id,transaction_type).
- Không ép sign/zero cho FORFEIT hoặc các status PROCESSED/REVERSED: chưa có writer/contract quy định số tiền. Test có ví dụ chấp nhận để thể hiện giới hạn CHECK, không đề xuất nghiệp vụ dùng các giá trị đó. Khi TV1 chốt convention, bổ sung migration mới kèm preflight.
- Không thêm composite FK để ép user/vehicle/showroom của appointment trùng deposit hoặc showroom của vehicle. Contract khi chuyển showroom, hủy cọc, xóa cọc và lịch hẹn độc lập chưa được xác lập.
- Workflow cấm tạo lịch hẹn quá khứ. Đây là validation khi tạo/đổi lịch của TV1; không dùng CHECK dựa vào CURRENT_TIMESTAMP vì lịch sử hợp lệ sẽ trở thành quá khứ. `appointment_date` hiện là TIMESTAMP không timezone; cần thống nhất timezone và policy đổi lịch trước khi cân nhắc trigger. Đọc DTO/CreateDepositRequest và DepositService chưa thấy validation ngày tương lai; cần TV1 xử lý, TV3 không sửa Backend.
- Không thêm trigger updated_at/lifecycle. AppointmentService.checkIn đang tự cập nhật updatedAt; chưa có yêu cầu trigger DB chung.
- Database audit không có users/roles. TV4 mission yêu cầu CUSTOMER/STAFF/ADMIN, password hash, lock account và current user contract. Chưa tìm thấy User/Role/auth/security implementation trong backend/src; DepositController hiện nhận `X-User-Id` default 1. Header này không phải bằng chứng identity/auth. Cần TV4/TV1 thống nhất bảng/schema/id type, unique identity, password format/hash provisioning, role mapping, lock fields, current-user interface và delete/retention policy; sau đó TV3 mới tạo migration user/role, seed account được hỗ trợ, preflight orphan user_id và FK deposits/appointments. Không tạo bảng đoán hoặc tài khoản giả.

## Preflight và kết quả chạy thật

PostgreSQL **18.6**, credential từ biến `DB_PASSWORD` hiện có chuyển tạm sang `PGPASSWORD`, không ghi secret. Kết nối ban đầu không truyền credential bị từ chối; không đổi authentication settings.

Database thử thành công: `autotrade_tv3_integrity_20260930_230336_851`; probe: tên đó cộng `_preflight`. Database `autotrade_tv3_backend_test_20260930` không được kết nối hoặc thay đổi.

| Kiểm thử | Actual |
|---|---|
| Bootstrap sạch | schema v2.0.1 → smoke → V3_0_0 → V3_0_1 → V3_0_2 → seed hai lần → preflight → V3_0_3: PASS. Không chạy V2_0_1 patch trên schema v2.0.1 đã có CHECK. |
| Seed-repeat | 10 demo duy nhất, 7 AVAILABLE/1 HOLD/1 RESERVED/1 SOLD: PASS. |
| Deposit regression | deposit_integrity_test.sql cũ: PASS, ROLLBACK; không sửa V3_0_2 hoặc test cũ. |
| Ledger | 9 tổ hợp type/status hợp lệ; sai type/status, zero/sai sign/NaN cho CONFIRMED, NULL, FK thiếu, delete RESTRICT: PASS. Kiểm tra đúng constraint name và SQLSTATE. |
| Appointment | Default PENDING/false, 3 status hợp lệ, sai status, NULL bắt buộc, FK thiếu, SET NULL khi xóa deposit, RESTRICT vehicle/showroom: PASS. Các blocker khác đã được gỡ trong fixture để chứng minh đúng FK. |
| Index/rollback | Kiểm tra chính xác định nghĩa 3 index không unique; rollback fixture khớp số hàng ban đầu; transaction cuối ROLLBACK; bảng business còn 0 fixture: PASS. Sequence có thể tiến do nextval dù rollback; chỉ trên DB disposable. |
| Migration preflight âm | Clone DB mới trước V3_0_3, tạo 1 ledger UNKNOWN; migration từ chối bằng guard V3_0_3, không có CHECK/index dở dang và giữ nguyên hàng sai: PASS. Probe được giữ để đối chiếu, không sửa/xóa vi phạm. |
| Audit preflight | 0 ledger vi phạm, 0 orphan appointment/ledger; 0 appointment/ledger hiện có. |
| Audit apply | BEGIN/LOCK/DO/ALTER/3 CREATE INDEX/COMMIT: PASS; lock_timeout 10s, preflight trong khóa chặn writer race; nếu có vi phạm thì abort toàn migration. |
| Bảo toàn audit | Toàn bộ output snapshot trước/sau giống nhau, gồm fingerprint MD5 JSON toàn hàng theo id của sources/vehicles/listings/showrooms/deposits/appointments/transaction_ledger. 10.812 listings/URL/ảnh, 5.243 ARCHIVED không showroom, 10 demo không đổi. |

Evidence thật: `database/evidence/appointment_ledger_20260930/`: isolated_01..13.log, probe_fixture.log, probe_rejected_migration.log, probe_preserved.log, audit_before.log, audit_preflight.log, audit_migration.log, audit_after.log và audit_catalog.log. Các log `initial_*failure.log` ghi thử thất bại đã sửa: smoke chạy sau seed gây subquery >1 hàng; probe trước seed thiếu fixture; CHECK amount ban đầu bắt cả type UNKNOWN; PG18 trả SQLSTATE 23001 cho RESTRICT thay vì 23503. Mọi lần thất bại dừng trước apply audit. Test helper cuối chấp nhận 23001/23503 cho RESTRICT nhưng luôn yêu cầu đúng constraint name. Các DB thử ban đầu cũng được giữ, không reset DB nào.

## Chạy lại khi cần

Không cần chạy lại migration trên audit: V3_0_3 đã áp dụng, đây là migration run-once. Runner mặc định tạo DB mới và chỉ đọc audit; evidence của lần chạy mới ở thư mục con riêng để giữ log cũ:

```powershell
Set-Location D:\CONG_NGHE_PHAN_MEM\AutoTrade
& .\database\tests\run_appointment_ledger_audit.ps1
```

Runner dùng psql tuyệt đối, `-X -w -v ON_ERROR_STOP=1`, credential môi trường/pgpass hiện có. Không truyền mật khẩu trên command line. `-ApplyAudit` chỉ dùng cho database audit còn ở V3_0_2; không dùng lại ở trạng thái hiện tại. Không dùng schema.sql trên DB đã có dữ liệu. Mutation/preflight fixture chỉ dành cho DB disposable mới. Runner không drop DB; việc xóa DB thử là thao tác riêng sau khi người dùng quyết định không cần giữ evidence.

Kiểm tra audit hiện tại chỉ đọc, nếu cần:

```powershell
$psql='C:\Program Files\PostgreSQL\18\bin\psql.exe'
# Dùng PGPASSWORD/pgpass đã cấu hình an toàn trong phiên; không ghi secret vào tệp.
& $psql -X -w -U postgres -d autotrade_tv3_audit_20260930 -v ON_ERROR_STOP=1 -f database/tests/appointment_ledger_preflight.sql
& $psql -X -w -U postgres -d autotrade_tv3_audit_20260930 -v ON_ERROR_STOP=1 -f database/tests/appointment_ledger_snapshot.sql
```

## Phạm vi bàn giao Git trên TV3

Worktree riêng `D:\CONG_NGHE_PHAN_MEM\AutoTrade-TV3` lấy nền origin/main `a369d53` bằng fast-forward từ TV3 `76c4bb3`. Không tích hợp commit riêng main local `5cb040c` hoặc `6d44056`. Chỉ bàn giao database, Data Dictionary và các phần báo cáo bổ sung 33–35; mục 32 thuộc commit local không được chuyển sang.

Các thay đổi Backend/crawler, audit import và Mapping_Matrix.md tại thư mục gốc không thuộc commit này. Những kết quả import/API trong mục 33 là evidence của phiên local trước, không chứng minh nhánh TV3 đã chứa các bản sửa đó. Lọc inventory ARCHIVED ở public API, kiểm tra showroom/price trong Backend và importer strict/quarantine còn cần TV1/owner tích hợp riêng. Database integrity và runner SQL không phụ thuộc các bản sửa ngoài phạm vi ấy. Users/roles/auth và các dependency đã liệt kê vẫn chưa hoàn thành. Trong thao tác Git không chạy SQL hoặc thay đổi database.