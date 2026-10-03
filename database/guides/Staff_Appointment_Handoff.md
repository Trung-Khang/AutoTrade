# TV3 bàn giao database staff/showroom/lịch hẹn — 02/10/2026

Contract chuẩn: HANDOFF_TV3_DATABASE.md, hướng xử lý TV3 và phản hồi TV4 được người dùng xác nhận. TV3 chỉ migration V3_0_7, seed, kiểm thử database và tài liệu. Frontend TV2; entity/DTO/API/auto-assign/RBAC TV4. Không sửa V3_0_6, dữ liệu crawler, xe, đơn cọc, ledger hoặc auth cũ.

## Schema

| Thành phần | Contract vật lý |
|---|---|
| app_users.showroom_id | BIGINT NULL, không default; fk_app_users_showroom → showrooms.id, ON DELETE SET NULL |
| appointments.assigned_staff_id | BIGINT NULL, không default; fk_appointments_assigned_staff → app_users.id, ON DELETE RESTRICT |
| idx_app_users_showroom_role | (showroom_id, role), WHERE active=true AND locked=false |
| idx_appointments_assigned_staff_date | (assigned_staff_id, appointment_date, status) |
| uq_staff_appointment_slot | UNIQUE (assigned_staff_id, appointment_date), WHERE status IN ('PENDING','SCHEDULED') |
| chk_appointments_status | PENDING, SCHEDULED, COMPLETED, CANCELLED |

`appointment_date` vẫn TIMESTAMP WITHOUT TIME ZONE, phù hợp LocalDateTime/ISO local `2026-10-05T09:30:00`. Không đổi timezone hoặc độ chính xác. Unique bảo vệ thời điểm bằng nhau, không bảo vệ khoảng thời lượng chồng lấn. TV2/TV4 phải dùng cùng khung giờ cố định và chuẩn hóa seconds; nếu chọn lịch có thời lượng cần contract mới.

Hai cột mới không backfill. Mọi tài khoản/lịch cũ giữ NULL. Unique vẫn cho phép nhiều lịch chưa phân công cùng giờ. Một staff khác hoặc giờ khác được phép; COMPLETED/CANCELLED giải phóng slot. Chuyển lịch trở lại trạng thái hoạt động, đổi staff hoặc đổi giờ đều chịu unique. Không thêm trigger hoặc CHECK bắt STAFF phải có showroom, đúng role/chi nhánh/trạng thái tài khoản: đây là kiểm tra TV4, được ghi rõ bên dưới.

Migration chạy một lần, không IF NOT EXISTS che giấu schema xung đột. Chạy lại bị từ chối và rollback nguyên transaction; đối chiếu manifest/catalog trước khi quyết định đã áp dụng. Bổ sung SCHEDULED là cần thiết vì CHECK hiện tại từ V3_0_0 thiếu trạng thái này. V3_0_6 độc lập; catalog target tại preflight chưa có chk_app_users_phone/uq_app_users_phone, không tự áp dụng thêm V3_0_6.

## Seed demo

Seed `database/seed/demo_showroom_staff.sql` tìm showroom bằng **exact name**, kiểm tra mỗi tên có đúng một record. Thiếu/trùng tên → lỗi và rollback; không tự tạo showroom, không dựa trên thứ tự ID. Đây là định danh nghiệp vụ hiện có; DB chưa có mã showroom bất biến. Nếu đổi tên chi nhánh, TV3 phải review mapping trước khi chạy seed.

| Chi nhánh thực tế | Tài khoản | Email |
|---|---|---|
| Showroom Hà Nội - Cầu Giấy | staff_hn_01, staff_hn_02 | staff_hn1@autotrade.vn, staff_hn2@autotrade.vn |
| Showroom Sài Gòn - Thủ Đức | staff_hcm_01, staff_hcm_02, staff_hcm_03 | staff_hcm1@autotrade.vn, staff_hcm2@autotrade.vn, staff_hcm3@autotrade.vn |
| Showroom Đà Nẵng - Hải Châu | staff_dn_01, staff_dn_02 | staff_dn1@autotrade.vn, staff_dn2@autotrade.vn |

Mật khẩu demo theo handoff: `Password@123`, BCrypt cost 12 được sinh và kiểm chứng bởi Spring BCryptPasswordEncoder. Hash truyền qua environment `AUTOTRADE_STAFF_BCRYPT_HASH`; không copy các hash mẫu chưa xác thực trong handoff. Tài khoản mới STAFF/active=true/email_verified=true/locked=false. Không UPDATE tài khoản có sẵn. Existing username/email/phone collision khác danh tính/role/showroom → từ chối. Existing account đúng username/email/role/showroom → bỏ qua, giữ password, trạng thái, thông tin cá nhân và timestamps ngay cả khi chúng đã thay đổi. Không bảo đảm mật khẩu demo cho tài khoản có sẵn đã đổi mật khẩu.

## TV4 cần thực hiện

1. Map AppUser.showroomId, Appointment.assignedStaffId và DTO theo handoff; không chạy Hibernate update/create. DB đã cung cấp nullable để tương thích backend cũ.
2. GET /api/v1/showrooms/{id}/staff: STAFF, active=true, locked=false, đúng showroom; availability kiểm tra chính xác thời điểm và PENDING/SCHEDULED.
3. Tạo lịch/cọc trong cùng transaction: xác minh staff tồn tại, role STAFF, active, unlocked, đúng showroom; auto-assign chỉ chọn người rảnh. Không fallback chọn người bận.
4. Kín lịch → lỗi rõ ràng và yêu cầu chọn giờ khác. Tranh chấp unique `uq_staff_appointment_slot`, SQLSTATE 23505 → rollback toàn bộ cọc/lịch và trả thông báo nghiệp vụ tương tự; HTTP 409 là lựa chọn đề xuất. Không catch rồi tiếp tục trong transaction PostgreSQL đã lỗi; không để đơn cọc dở dang.
5. STAFF chỉ xem/check-in lịch của chính mình; ADMIN xem toàn bộ. Không tự gán lịch cũ có assigned_staff_id=NULL. Bổ sung showroom/staff vào DTO biên lai; thông tin staff/showroom có thể NULL.
6. FK invalid reference: SQLSTATE 23503; PostgreSQL 18 ON DELETE RESTRICT khi xóa staff đã có lịch trả 23001. Soft disable giữ lịch sử. DB FK không kiểm tra role/active/showroom tương ứng của lịch; TV4 phải kiểm tra.

## TV2 cần thực hiện

Dùng showroomId của xe, không gán cứng ID theo ví dụ handoff. Chọn ngày/giờ → gọi staff availability; gửi assignedStaffId hoặc để backend auto-assign. Người bận disabled; xử lý lỗi kín lịch/tranh chấp bằng thông báo chọn giờ khác và tải lại availability. RBAC hiển thị theo API TV4; biên lai lấy thông tin showroom/staff từ DTO và xử lý lịch cũ NULL.

## Thực thi và bằng chứng

**Đã áp dụng PASS vào autotrade_final ngày 02/10/2026**, sau xác nhận dừng ghi của operator. app_users 5 → 12; hai lịch cũ giữ assigned_staff_id=NULL. Bảy nhân viên phân bổ đúng 2 Hà Nội / 3 TP.HCM / 2 Đà Nẵng. Toàn bộ original rows không đổi; seed chạy lại giữ rows/sequences. Hibernate validate và 14 lượt đăng nhập username/email trên cả bản sao và target đều HTTP 200/STAFF, không đổi dữ liệu.

Runner `database/tests/run_staff_database.py`: `prepare --evidence database/evidence/<run>` rồi `apply --writers-paused --evidence database/evidence/<run>`. Yêu cầu Python standard library, PostgreSQL 18 binaries, Java, Spring BCrypt jars có sẵn và admin DB_PASSWORD/PGPASSWORD qua môi trường; không đặt credential trên command line.

Prepare: pg_dump đầy đủ trong `database/backups/<run>/` Git-ignored, có ACL riêng; restore DB `tv3_staff_<timestamp>`; so toàn bộ rows/schema/sequences; kiểm thử SQL và hai phiên concurrency; so target không đổi. Apply: kiểm tra identity, backup/source hashes, catalog/sequences và fingerprint rows dưới khóa ghi toàn bộ tables; migration+seed cùng transaction; đối chiếu dữ liệu cũ trước COMMIT. Không tự reset/replay/drop DB.

Evidence cuối: `database/evidence/staff_appointments_20261002_03/manifest.json`, `execution.json`, `result.json`; login/Hibernate probe riêng trong các thư mục `login_*`. Lần 01 sai kỳ vọng SQLSTATE RESTRICT; lần 02 truy vấn fixture ORDER BY id mơ hồ. Cả hai chỉ ảnh hưởng DB kiểm thử, giữ evidence thất bại. Login probe đầu dùng JWT Base64 sai dạng; sửa cấu hình probe và giữ evidence. Trạng thái áp dụng và kết quả login cuối phải đọc các result.json, không coi mọi lần thử đều PASS.

Recorder ban đầu reset preparation execution log khi sang apply. Đã sửa để append; toàn bộ kiểm thử được tái thực hiện từ backup gốc trước nâng cấp trên DB riêng bằng `database/tests/verify_staff_backup.py`, bằng chứng đầy đủ tại `database/evidence/staff_appointments_20261002_reverification/`. Không chạy migration lần hai trên target. Manifest lần áp dụng giữ source hashes thực tế trước chỉnh sửa recorder.

Không gửi tin nhắn teammate, không commit/push/merge. Việc tích hợp staff API/auto-assign/RBAC/UI vẫn thuộc TV4/TV2; login backend cũ thành công không thay thế kiểm thử tích hợp chức năng mới.
