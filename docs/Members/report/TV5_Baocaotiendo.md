# BÁO CÁO TIẾN ĐỘ — TV5

**Ngày cập nhật:** 01/10/2026  
**Branch snapshot:** `TV5`  
**Vai trò:** UML, SRS, ERD/Data Dictionary phối hợp, Traceability và tài liệu thiết kế

## 1. Mục tiêu đợt cập nhật

TV5 rà soát tài liệu theo hai nguồn chính:

1. Nghiệp vụ trong `docs/Project/mô tả hệ thống.docx`.
2. Implementation, API contract và database migration hiện có trong repository.

Nguyên tắc: **đủ nghiệp vụ theo baseline nhưng không vẽ chức năng chưa được triển khai thành chức năng hoàn thành**. Những phần chưa có hoặc còn mismatch được đánh dấu `PENDING`/`PARTIAL` và chuyển đúng owner.

## 2. Kết quả audit implementation

### Backend đã có implementation

- Listing/search/filter/detail.
- Vehicle/Admin vehicle CRUD và cập nhật trạng thái.
- Deposit create/confirm/receipt/my deposits.
- Appointment list/check-in.
- Admin ledger/refund.
- Auth register/verify/resend/login/logout/current-user/forgot/reset.
- JWT filter/service, BCrypt password hashing.
- OTP hash + Gmail mail service.
- REST 401/403 handlers.

### Database

Các migration hiện có:

```text
V3_0_0__showroom_deposit_appointment.sql
V3_0_1__archive_inventory_boundary.sql
V3_0_2__deposit_integrity.sql
V3_0_3__appointment_ledger_integrity.sql
V3_0_4__auth_and_otp.sql
```

`schema.sql` vẫn là bootstrap cũ cho phần inventory/listing, chưa phải một clean bootstrap duy nhất bao phủ toàn bộ V3/Auth.

### Frontend

Đã có AuthProvider, token persistence, `/auth/me` restore, ProtectedRoute theo role, Login/Register/Verify/Forgot Password, showroom/vehicle detail, Deposit/Admin/Staff pages.

Một số service vẫn còn LocalStorage/mock fallback; đây là dependency của TV2 và không phải phần TV5 trực tiếp sửa.

## 3. Bộ tài liệu TV5 đã hoàn thiện

### 3.1. Use Case — đủ baseline 19 nghiệp vụ

TV5 đã chuyển Use Case sang **19 UC** theo baseline nghiệp vụ:

1. Xem danh mục xe
2. Tìm kiếm & lọc xe
3. Xem chi tiết xe
4. Đăng ký tài khoản
5. Liên hệ nhanh
6. Đăng nhập / Đăng xuất
7. Quên mật khẩu
8. Quản lý xe yêu thích
9. Đặt cọc & hẹn lịch xem xe
10. Thanh toán cọc giả lập
11. Xem biên lai & hợp đồng
12. Xem đơn cọc của tôi
13. Quản lý lịch hẹn showroom
14. Check-in khách / lái thử
15. Hỗ trợ tiếp nhận hoàn cọc
16. Quản lý kho xe (CRUD)
17. Quản lý tài khoản
18. Quản lý ledger & hoàn cọc
19. Báo cáo thống kê

Các UC `PENDING/PARTIAL` vẫn giữ trong baseline để không làm mất nghiệp vụ yêu cầu.

**File:** `docs/UML/Use_Case.md`

### 3.2. Sơ đồ công tác (Activity Diagram)

Đã bổ sung sơ đồ công tác cho các luồng chính:

- Đặt cọc + lịch hẹn + xác nhận cọc.
- Đăng nhập + JWT/RBAC.
- Admin CRUD/trạng thái xe.

UI được tách thành partition riêng để khi render thể hiện rõ luồng **UI → Controller → Service → Database → UI**, đồng thời có nhánh xử lý cho trường hợp lỗi/nghiệp vụ.

**File:** `docs/UML/Activity_Diagrams.md`  
**Source:** `docs/UML/diagrams/02_activity_deposit.puml`, `03_activity_login.puml`, `04_activity_admin_vehicle.puml`

### 3.3. Sơ đồ tuần tự (Sequence Diagram)

Đã cập nhật sequence theo kiểu ký hiệu gần với mẫu nhóm:

- `actor` cho người dùng.
- `boundary` cho React UI/Page.
- `control` cho Controller/Service.
- `collections` cho Repository.
- `database` cho PostgreSQL.
- `alt` cho nhánh nghiệp vụ/lỗi.

Các luồng chính:

- Deposit + Appointment + Confirm.
- Search/Filter.
- Login + JWT.
- Admin CRUD.
- Staff Appointment/Check-in.
- Security boundary.

**File:** `docs/UML/Sequence_Diagrams.md`

### 3.4. Sơ đồ cộng tác (Communication/Collaboration Diagram)

Đã bổ sung bộ source PlantUML riêng với **đánh số message 1, 2, 3...** và các kiểu đối tượng `boundary/control/entity/database` để phù hợp với mẫu sơ đồ cộng tác nhóm.

Các luồng:

- Login + JWT.
- Vehicle search/detail.
- Deposit + Appointment.
- Staff check-in.
- Admin vehicle CRUD.
- Refund.

**File:** `docs/UML/Communication_Diagrams.md`  
**Source:** `docs/UML/diagrams/collaboration/*.puml`

### 3.5. Class Diagram / ERD / Traceability

- Class Diagram bám class/service/controller/entity/security thực tế.
- ERD/Data Dictionary bám migration hiện tại; không tự vẽ FK chưa tồn tại trong database.
- Traceability liên kết `FR → UC → API/Implementation → Test/Evidence → Status`.

## 4. Các mismatch TV5 đã phát hiện

| ID | Vấn đề | Owner | TV5 xử lý |
|---|---|---|---|
| F-01 | Deposit create/my còn `X-User-Id`; confirm/receipt chưa kiểm tra current-user ownership | TV4 + TV1 | Giữ `PARTIAL`, ghi chú trên UML/traceability |
| F-02 | Official Auth API contract còn payload/status cũ ở một số mục | TV1 + TV4 | Không tự sửa contract ngoài phạm vi TV5 |
| F-03 | `schema.sql` chưa bao phủ V3/Auth | TV3 | Ghi bootstrap gap trong ERD/Data Dictionary |
| F-04 | Frontend còn LocalStorage/mock fallback | TV2 | Ghi dependency |
| F-05 | CORS chưa liệt kê PATCH đầy đủ | TV1/TV4 | Ghi finding trước Final Gate |
| F-06 | Test Plan có PASS claims rộng hơn evidence độc lập hiện có | TV2 | Không tự chuyển sang `VERIFIED` |
| F-07 | Tài liệu gốc yêu cầu OTP 90 giây nhưng `OtpService` hiện dùng 5 phút | TV1/TV4 | Ghi requirement mismatch, không tự đổi code |

## 5. Evidence kiểm thử hiện có

TV4 đã báo cáo:

- Backend build PASS.
- Frontend build PASS.
- Auth security unit tests PASS.
- Full Maven test: 22/22 PASS trên PostgreSQL thật.
- Runtime API/JWT/RBAC smoke PASS.
- Gmail OTP PASS.

Trong môi trường audit hiện tại, TV5 chưa rerun độc lập Maven do wrapper/dependency cần tải từ Maven Central. Vì vậy các kết quả trên được ghi là **reported evidence từ TV4**, không phải independent rerun.

## 6. Trạng thái Use Case / Traceability

| Nhóm | Trạng thái tài liệu |
|---|---|
| UC-01..04 | Đã mô tả, đối chiếu implementation |
| UC-05 | `PENDING/P2` vì chưa có backend contract riêng |
| UC-06..07 | Đã đối chiếu Auth/JWT/OTP implementation |
| UC-08 | `PENDING` vì chưa có backend model/API |
| UC-09..12 | `PARTIAL` tại các điểm current-user/ownership/evidence |
| UC-13..14 | Đã đối chiếu Staff appointment/check-in |
| UC-15 | `PARTIAL/CONTRACT GAP` vì refund hiện ở Admin, chưa có Staff endpoint riêng |
| UC-16 | `PARTIAL` tại CORS/evidence |
| UC-17 | `PENDING` vì chưa có module Admin account riêng |
| UC-18 | `PARTIAL` vì còn contract/HTTP evidence gap |
| UC-19 | `PENDING` vì chưa có backend statistics module |

## 7. Việc còn lại của TV5

1. Commit bộ UML/documentation patch lên branch TV5.
2. Chờ TV1/TV4/TV3/TV2 xử lý F-01..F-07.
3. Sau khi có evidence cuối, cập nhật Traceability và status lần cuối.
4. Render các `.puml` thành PNG/SVG để đưa vào report/slide.
5. Khi nhóm chốt contract/security/bootstrap, đồng bộ SRS/UML/ERD lần cuối.

## 8. Tiêu chí hoàn thành TV5

- [x] SRS đúng stack và scope thực tế.
- [x] Use Case đủ 19 nghiệp vụ baseline.
- [x] Có Sơ đồ công tác (Activity Diagram).
- [x] Có Sơ đồ tuần tự (Sequence Diagram).
- [x] Có Sơ đồ cộng tác (Communication/Collaboration Diagram).
- [x] Class Diagram bám implementation hiện tại.
- [x] ERD/Data Dictionary bám migration hiện tại.
- [x] Traceability FR → UC → API → Test/Evidence.
- [x] Không invent implementation cho các chức năng chưa làm.
- [ ] Owner xử lý xong các mismatch còn mở.
- [ ] Final evidence được nhóm xác nhận và cập nhật lần cuối.
