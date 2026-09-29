# TV3 - Database và dữ liệu

## 1. Vai trò hiện tại

TV3 sở hữu PostgreSQL schema vật lý, migration, seed, Data Dictionary và dữ liệu demo phục vụ hệ thống. Dataset crawler là tài sản hiện có, phải được bảo toàn tuyệt đối.

## 2. Phạm vi sở hữu

- Thiết kế schema/migration/seed cho users, roles, vehicle/listing, deposits, appointments và ledger tối thiểu.
- PK, FK, `UNIQUE`, `CHECK`, index và constraint chống đặt cọc trùng.
- Tài khoản mẫu, tối thiểu 10 xe demo, showroom, trạng thái hợp lệ và reset script dev.
- Data Dictionary, ERD vật lý phối hợp với TV5, hướng dẫn bootstrap/reset.

## 3. Không thuộc trách nhiệm

- Không chỉnh sửa hoặc xóa bất kỳ file nào trong `crawler/`, gồm data/source/reports.
- Không làm business logic Backend, security, React UI hay UML/SRS.
- Machine Learning/Regression/Recommendation/Comparison đã ngoài phạm vi.

## 4. Ngày 1 - Khóa schema và seed

1. Chốt enum/status với TV1/TV4/TV5 cho role, vehicle, deposit và appointment.
2. Thiết kế migration theo PostgreSQL hiện có; không tạo hệ quản trị mới hoặc phá schema cũ khi chưa có migration.
3. Tạo bảng/quan hệ cần thiết cho P0 và review FK/index/nullable.
4. Chuẩn bị seed gồm CUSTOMER, STAFF, ADMIN, showroom, xe `AVAILABLE` và xe đã giữ để test.
5. Bàn giao ERD vật lý/migration draft lúc 10:00, DB bootstrap/reset và seed chạy được trước 12:00.

## 5. Ngày 2 - Khóa integrity và hỗ trợ integration

1. Bổ sung unique/locking/constraint hỗ trợ một xe chỉ có một deposit giữ chỗ thành công.
2. Kiểm tra FK, transaction rollback, index truy vấn vehicle/listing và dữ liệu của appointment/ledger.
3. Schema freeze lúc 11:00; sau đó chỉ thêm migration sửa lỗi có impact note.
4. Hỗ trợ TV1 xử lý unique/FK/deadlock; hoàn thiện Data Dictionary và reset guide.

## 6. Ngày 3 - Kiểm thử DB và đóng gói

1. Chạy migration từ database trống, seed/reset lặp và ghi log kết quả.
2. Test constraint, FK, `UNIQUE`, `CHECK`, NULL, index và consistency deposit-vehicle.
3. Bàn giao script/lệnh khởi tạo DB, dữ liệu demo và known limitations.

## 7. Dependency

| Cần nhận | Từ ai | Thời điểm |
|---|---|---|
| Entity/API/state cần dùng | TV1 | Sáng Ngày 1 |
| User/role/auth requirements | TV4 | Sáng Ngày 1 |
| ERD/UML naming review | TV5 | Trước schema freeze |
| Dữ liệu hiển thị/mismatch | TV2 | Trong integration |

## 8. Bàn giao

- TV1/TV4: migration version, enum/status, seed account và DB config không chứa secret.
- TV2: test account, dữ liệu demo, reset timing và dữ liệu trạng thái.
- TV5: ERD/Data Dictionary/schema version/test SQL.

## 9. Tiêu chí hoàn thành

- Database trống tạo được bằng migration/bootstrap được hướng dẫn.
- Seed được chạy lại an toàn trên môi trường dev.
- Hai người không thể tạo cọc giữ thành công cho một xe.
- Schema/Data Dictionary/ERD đồng nhất và không chạm `crawler/`.

## 10. Kiểm thử phải thực hiện

- Migration/seed/reset từ DB trống.
- FK, unique, check, null, index và transaction rollback.
- Duplicate deposit và vehicle state consistency.
- Test chéo Backend API của TV1 với data seed thật.

## 11. Rủi ro và cắt giảm

- Không thay đổi database engine hoặc viết lại import crawler.
- Nếu chậm: giữ bảng/constraint P0; hoãn favorites, thống kê/chart và audit nâng cao.
- Không cắt unique/transaction/FK cho deposit hay reset/seed evidence.

## 12. Checklist cuối ngày

### Ngày 1
- [ ] Migration, ERD draft, seed và reset guide chạy được.
- [ ] TV1/TV4 đã review enum/FK/state.

### Ngày 2
- [ ] Schema freeze và constraint chống cọc trùng có bằng chứng.
- [ ] Data Dictionary được cập nhật.

### Ngày 3
- [ ] DB test log được bàn giao TV2/TV5.
- [ ] Xác nhận `crawler/` không thay đổi.
