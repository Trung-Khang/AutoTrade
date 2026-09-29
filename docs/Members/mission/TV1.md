# TV1 - Backend nghiệp vụ và tích hợp

## 1. Vai trò hiện tại

TV1 sở hữu Backend nghiệp vụ của hệ thống **Xây dựng hệ thống quản lý kinh doanh ô tô đã qua sử dụng**. TV1 triển khai và tích hợp các API xe, đặt cọc giả lập, lịch hẹn, Staff/Admin; bảo đảm business rule chạy ở server.

## 2. Phạm vi sở hữu

- Spring Boot REST API cho danh sách, tìm kiếm, lọc và chi tiết xe.
- Admin CRUD xe và API Staff/Admin tối thiểu.
- Nghiệp vụ đặt cọc giả lập, lịch hẹn, trạng thái xe/giao dịch và transaction chống đặt cọc trùng.
- API contract, Swagger/OpenAPI, unit test và integration test nghiệp vụ.

## 3. Không thuộc trách nhiệm

- Đăng ký, đăng nhập, JWT, OTP và phân quyền lõi: TV4 sở hữu.
- Migration, seed, constraint và dữ liệu mẫu: TV3 sở hữu.
- React UI và hệ thống test report: TV2 sở hữu.
- SRS/UML/ma trận truy vết: TV5 sở hữu.
- Hồi quy tuyến tính, Machine Learning, Recommendation và Comparison đã loại khỏi phạm vi nộp.

## 4. Ngày 1 - Khóa contract và dựng lõi

1. Chốt cùng TV4/TV3 API contract: request, response, lỗi `400/401/403/404/409/422`, role và state transition.
2. Rà soát schema TV3 để xác nhận entity/DTO hiện có cho vehicle/listing không mâu thuẫn.
3. Hoàn thiện API công khai: danh sách, tìm kiếm, lọc và chi tiết xe.
4. Hoàn thiện Admin CRUD xe; không xóa xe đang được deposit/appointment tham chiếu.
5. Dựng entity/service/controller skeleton cho deposit và appointment theo contract đã khóa.
6. Bàn giao endpoint xe cho TV2 trước 15:00; code deposit/appointment sẵn sàng review trước 17:00.

## 5. Ngày 2 - Hoàn thành nghiệp vụ và tích hợp

1. Chỉ cho phép đặt cọc với xe `AVAILABLE`.
2. Tạo deposit `PENDING_PAYMENT`, lịch hẹn và mock QR/reference; khi xác nhận thành công chuyển deposit sang `DEPOSITED` và xe sang `HOLD` hoặc `RESERVED` trong cùng transaction.
3. Chặn hai tài khoản giữ cùng một xe bằng transaction/constraint của TV3; xử lý duplicate submit và callback lặp theo idempotency/reference.
4. Kiểm tra ngày hẹn không ở quá khứ; lái thử chỉ là checkbox của lịch hẹn, không tạo workflow độc lập.
5. Cung cấp API cho CUSTOMER xem đơn cọc, STAFF xem/cập nhật lịch hẹn, ADMIN xem ledger tối thiểu.
6. Tích hợp với TV2 và sửa các mismatch được ghi trong Defect Log.

## 6. Ngày 3 - Code freeze và đóng gói

1. Chỉ sửa lỗi Critical/High; không thêm endpoint hoặc state mới.
2. Kiểm tra transaction, trạng thái sai, dữ liệu không tồn tại, submit lặp và lỗi mapping sau integration.
3. Hoàn thiện OpenAPI/API notes thực tế.
4. Chạy build, unit/integration tests và rehearsal cùng TV2/TV3.

## 7. Dependency

| Cần nhận | Từ ai | Thời điểm |
|---|---|---|
| Migration, enum/status, seed và constraint | TV3 | Trước 12:00 Ngày 1 |
| Current-user contract, role protection | TV4 | Trước 15:00 Ngày 1 |
| Payload/UI mismatch và Defect Log | TV2 | Trong ngày |
| Danh sách FR/UC cần khớp | TV5 | Trước Gate 2 |

## 8. Bàn giao

- TV2: endpoint, payload, enum, error response, dữ liệu mẫu và lệnh chạy.
- TV3: yêu cầu migration/constraint có lý do, không tự sửa schema.
- TV4: endpoint cần role/current user để review quyền.
- TV5: API contract, state transition, tên class/package thực tế và test evidence.

## 9. Tiêu chí hoàn thành

- API public và Admin CRUD chạy với dữ liệu seed thật.
- Deposit thành công khóa xe; deposit trùng không tạo giao dịch thứ hai.
- Lỗi nghiệp vụ trả `4xx` có cấu trúc, không trả `500`.
- Staff/Admin chỉ thấy và thực hiện đúng quyền được cấp.
- Có test nghiệp vụ và log/demo cho Gate 1, Gate 2, Final Gate.

## 10. Kiểm thử phải thực hiện

- Xe không tồn tại, input lọc sai, CRUD sai dữ liệu.
- Xe `HOLD/RESERVED` hoặc xe không `AVAILABLE` bị từ chối đặt cọc.
- Hai request đồng thời, callback/reference lặp và lịch hẹn quá khứ.
- CUSTOMER gọi API Staff/Admin; người dùng gọi thao tác không thuộc quyền.
- Test chéo ít nhất một endpoint auth do TV4 bàn giao.

## 11. Rủi ro và cắt giảm

- Nếu P0 chưa ổn: hoãn dashboard, báo cáo biểu đồ, PDF hợp đồng/biên lai và quản lý ledger nâng cao.
- Mock QR chỉ hiển thị reference hợp lệ, không tích hợp cổng tiền thật.
- Không cắt transaction chống đặt cọc trùng, state validation hoặc kiểm tra quyền.

## 12. Checklist cuối ngày

### Ngày 1
- [ ] API contract đã gửi TV2/TV4/TV5.
- [ ] Public vehicle API và Admin CRUD có response thật.
- [ ] Deposit/appointment skeleton đã review schema.

### Ngày 2
- [ ] Luồng đặt cọc và lịch hẹn end-to-end chạy được.
- [ ] Có bằng chứng chặn cọc trùng và transition sai.

### Ngày 3
- [ ] Không còn lỗi Critical/High thuộc Backend nghiệp vụ.
- [ ] API docs, test result và known limitation đã bàn giao.
