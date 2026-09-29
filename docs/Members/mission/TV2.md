# TV2 - Frontend và Test Lead

## 1. Vai trò hiện tại

TV2 sở hữu React UI và là Test Lead. TV2 tích hợp UI với API thật, quản lý Test Plan/Test Case/Defect Log/Test Report, điều phối system test của cả năm thành viên.

## 2. Phạm vi sở hữu

- UI khách vãng lai, CUSTOMER, STAFF và ADMIN.
- Showroom, tìm kiếm/lọc, chi tiết xe, auth UI, Admin CRUD, đặt cọc/lịch hẹn/mock payment.
- Loading, empty, validation, error state, responsive cơ bản.
- Test Plan, Test Case, Defect Log, evidence và demo script.

## 3. Không thuộc trách nhiệm

- Rule nghiệp vụ, phân quyền và trạng thái trên server: TV1/TV4.
- Schema, migration, seed: TV3.
- UML/SRS: TV5.
- Không hard-code trạng thái, kết quả cọc hoặc quyền; không có ML/Recommendation/Comparison.

## 4. Ngày 1 - Khóa contract và dựng UI lõi

1. Lập danh sách màn hình, request/response/error state theo contract TV1/TV4.
2. Dựng route/layout: showroom, chi tiết xe, login, Admin quản lý xe, form đặt cọc.
3. Kết nối showroom/detail/filter với API thật; mock chỉ được dùng có nhãn khi API chưa bàn giao.
4. Dựng login UI và xử lý token/role được TV4 quy định.
5. Mở Test Plan, Test Case P0 và Defect Log; phân severity Critical/High/Medium/Low.

## 5. Ngày 2 - Hoàn thành integration

1. Hoàn thiện Admin CRUD UI và hiển thị lỗi server rõ ràng.
2. Hoàn thiện form đặt cọc: showroom, ngày/giờ, checkbox lái thử, validation và mock QR/reference.
3. Dựng lịch sử cọc CUSTOMER, lịch hẹn STAFF và ledger tối thiểu Admin nếu API P0 đã ổn.
4. Xử lý đúng `401/403/404/409/422`; chặn double-click ở UI nhưng vẫn dựa vào rule server.
5. Điều phối Gate 2, chạy luồng vàng và test âm cùng các TV.

## 6. Ngày 3 - System test và minh chứng

1. Code freeze UI; chỉ sửa lỗi hoặc polish cần cho demo.
2. Chạy system test trên seed sạch, cập nhật Pass/Fail/Blocked và bằng chứng ảnh/log/video.
3. Test responsive cơ bản, reload session hợp lệ, loading/empty/error states.
4. Tổng hợp Defect Log, Test Report và demo script; điều phối Final Gate.

## 7. Dependency

| Cần nhận | Từ ai | Thời điểm |
|---|---|---|
| Endpoint xe/deposit/appointment/Admin | TV1 | Theo mốc Ngày 1-2 |
| Auth response, token và role | TV4 | Trước integration login |
| Seed/tài khoản demo/reset hướng dẫn | TV3 | Trước system test |
| FR/UC và acceptance criteria | TV5 | Trước Gate 2 |

## 8. Bàn giao

- TV1/TV4: danh sách payload mismatch và lỗi UI/API trong ngày.
- TV5: Test Plan, Test Case, Defect Log, Test Report, screenshot và kết quả thật.
- Cả nhóm: demo script, test account và các lỗi còn mở có owner.

## 9. Tiêu chí hoàn thành

- Luồng vàng hiển thị đúng từ UI đến DB, không phụ thuộc mock trong P0.
- Không có submit lặp từ UI và mọi HTTP error có trạng thái dễ hiểu.
- Test case có input, expected result, actual result, status và evidence.
- Final Gate không còn Critical/High mở.

## 10. Kiểm thử phải thực hiện

- Happy path: xem/lọc xe, đăng nhập, Admin CRUD, deposit/lịch hẹn, Staff cập nhật lịch, Admin ledger.
- Negative: login sai, thiếu token, cấm role, xe đã giữ, ngày quá khứ, input thiếu/sai, double click.
- Test chéo API/search của TV1 và auth/role của TV4.

## 11. Rủi ro và cắt giảm

- Khi chậm P0, bỏ favorites, chart nâng cao, gallery, PDF tải về và liên kết contact nâng cao.
- Không cắt error UI, Defect Log, system test hoặc bằng chứng demo.

## 12. Checklist cuối ngày

### Ngày 1
- [ ] Routes/skeleton và Test Plan P0 đã có.
- [ ] Showroom/detail/filter kết nối API hoặc có mismatch rõ.

### Ngày 2
- [ ] Auth, Admin CRUD, deposit/lịch hẹn UI tích hợp API thật.
- [ ] Gate 2 và Defect Log được cập nhật.

### Ngày 3
- [ ] Test Report/evidence/demo script hoàn tất.
- [ ] Không còn Critical/High UI mở.
