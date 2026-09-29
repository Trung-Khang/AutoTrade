# TV5 - UML, SRS và tài liệu thiết kế

## 1. Vai trò hiện tại

TV5 sở hữu tính nhất quán của SRS, UML và ma trận truy vết. TV5 vẽ theo contract và code thực tế, không tự thêm nghiệp vụ chưa triển khai.

## 2. Phạm vi sở hữu

- Đồng bộ SRS với Spring Boot, React và PostgreSQL thực tế.
- Use Case Diagram/đặc tả Use Case, Sequence, Collaboration, Class Diagram.
- ERD phối hợp TV3, Package/Deployment nếu báo cáo yêu cầu.
- Ma trận `FR -> UC -> API -> Test Case`, rà soát tài liệu/test evidence.

## 3. Không thuộc trách nhiệm

- Không implement Backend, Frontend, schema/migration hay auth logic.
- Không vẽ actor/class/endpoint không có trong contract/code.
- Không còn ML/Regression/Recommendation/Comparison trong UML hay phạm vi nộp.

## 4. Ngày 1 - SRS và UML lõi

1. Đồng bộ tên đề tài, scope và stack theo hai DOCX ưu tiên; loại Servlet/JSP/SQL Server/MySQL nếu không khớp repository.
2. Dựng Use Case tổng thể cho khách vãng lai, CUSTOMER, STAFF, ADMIN và System mock OTP/QR khi cần.
3. Đặc tả UC P0: đăng nhập, tìm/lọc/chi tiết xe, Admin CRUD, đặt cọc/lịch hẹn, xác nhận cọc.
4. Vẽ Sequence draft: login, tìm/lọc xe, Admin CRUD, tạo/xác nhận deposit.
5. Mở ma trận truy vết và review actor/state/API với TV1/TV4/TV3/TV2.

## 5. Ngày 2 - Bám integration

1. Hoàn thiện Sequence, Collaboration và Class Diagram từ tên class/controller/service/entity/DAO thực tế.
2. Phối hợp TV3 cập nhật ERD/Data Dictionary; phối hợp TV1/TV4 xác minh state và security flow.
3. Liên kết FR, UC, API và Test Case của TV2; loại mọi hạng mục không có trong P0/P1 đã chốt.
4. Bàn giao bộ UML bản review lúc 16:00.

## 6. Ngày 3 - Chốt tài liệu và nghiệm thu

1. Đối chiếu SRS/UML/schema/API/code/test evidence; sửa tên class/table/status sai.
2. Rà soát báo cáo chỉ ghi PASS cho test đã chạy.
3. Hoàn thiện ma trận truy vết, danh sách hạn chế/hướng phát triển và checklist nộp.
4. Hỗ trợ Final Gate, ghi các mismatch còn lại có owner.

## 7. Dependency

| Cần nhận | Từ ai | Thời điểm |
|---|---|---|
| API contract và state/business rule | TV1 | Ngày 1 |
| Auth/role/error flow | TV4 | Ngày 1 |
| Schema, ERD vật lý, seed/status | TV3 | Ngày 1 |
| Màn hình, Test Plan/Test Case/evidence | TV2 | Ngày 1-3 |

## 8. Bàn giao

- Cả nhóm: source và ảnh UML, SRS đồng bộ, ma trận truy vết, checklist review.
- TV2: UC/acceptance để hoàn thiện test cases.
- TV1/TV4/TV3: mismatch cụ thể về API/class/schema/state để sửa trước Final Gate.

## 9. Tiêu chí hoàn thành

- SRS/UML dùng đúng Spring Boot, React, PostgreSQL.
- Có Use Case, UC spec, Sequence, Collaboration, Class và ERD phù hợp scope thực tế.
- Mọi FR P0 có UC/API/Test Case/evidence hoặc được ghi Pending có lý do.
- Không xuất hiện ML, Regression, Recommendation, Comparison hay thanh toán tiền thật như chức năng bắt buộc.

## 10. Kiểm thử phải thực hiện

- Review chéo API response/state với TV1/TV4.
- Review ERD/FK/status với TV3.
- So khớp test result/evidence với Test Report TV2.
- Test chéo một golden flow để bảo đảm tài liệu mô tả đúng hệ thống.

## 11. Rủi ro và cắt giảm

- Ưu tiên đủ tài liệu P0, không vẽ diagram phụ đẹp nhưng không có code.
- Nếu chậm, hoãn Package/Deployment, chart/report nâng cao; không bỏ UC, Sequence, Collaboration, Class/ERD và traceability P0.
- Không giữ tài liệu cũ mâu thuẫn chỉ để đủ số trang.

## 12. Checklist cuối ngày

### Ngày 1
- [ ] Scope/stack/SRS đã đồng bộ.
- [ ] Use Case và Sequence draft P0 được review.

### Ngày 2
- [ ] UML bám code/contract và traceability có bản review.

### Ngày 3
- [ ] SRS/UML/schema/API/test khớp nhau.
- [ ] Danh sách hạn chế và evidence nộp đã hoàn tất.
