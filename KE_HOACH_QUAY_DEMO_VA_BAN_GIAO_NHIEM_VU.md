# Kế hoạch quay demo và bàn giao nhiệm vụ

## 1. Tổng quan

Nhóm gồm 4 thành viên: TV1, TV2, TV3 và TV4. Mỗi thành viên thực hiện một video demo riêng, thời lượng khoảng 10–15 phút.

| Video | Thành viên | Nội dung chính |
|---|---|---|
| Video 1 | TV1 | GUEST Kiến trúc hệ thống, showroom và tìm kiếm xe |
| Video 2 | TV2 | Customer đặt cọc, đặt lịch, thanh toán và xem đơn |
| Video 3 | TV3 | Admin/Staff quản lý kho xe, lịch hẹn và hoàn cọc |
| Video 4 | TV4 | Đăng ký, xác minh OTP, đăng nhập và khôi phục mật khẩu |

Tổng thời lượng dự kiến: 40–50 phút.

Mỗi video cần thể hiện được:

- Actor/role đang sử dụng.
- Điều kiện trước khi thực hiện.
- Các bước thao tác nghiệp vụ.
- Kết quả trên giao diện.
- Trường hợp lỗi hoặc bị từ chối.
- Trạng thái dữ liệu sau thao tác.
- Mối liên hệ giữa giao diện, Backend và Database.

---

## 2. TV1: Kiến trúc, showroom và tìm kiếm xe

### Sơ đồ PlantUML cần đọc

- `00_system_architecture.puml`
- `01_use_case_overview.puml`
- `06_sequence_search.puml`
- `12_collab_vehicle_search_detail.puml`

### Nghiệp vụ cần demo

1. Truy cập hệ thống với Guest.
2. Xem danh sách xe.
3. Tìm kiếm theo từ khóa.
4. Lọc theo hãng xe, khu vực, khoảng giá, nhiên liệu và hộp số.
5. Phân trang danh sách xe.
6. Mở trang chi tiết xe.
7. Kiểm tra các trạng thái:
   - `AVAILABLE`: Đang mở bán.
   - `HOLD`: Đang giữ cọc.
   - `SOLD`: Đã bán.
   - Chưa mở đặt cọc.
8. Thực hiện các chức năng của Customer như đặt cọc và hẹn bất kỳ xe đang mở nào xem hệ thống có chặn lại và bắt đăng nhập hay không?
9. So sánh giao diện khi truy cập bằng Customer, Staff và Admin (nếu còn thời gian).

### Hướng dẫn trình bày

TV1 cần giải thích được:

- Frontend gửi yêu cầu tìm kiếm và lọc đến Backend.
- Backend xử lý điều kiện lọc và phân trang.
- Dữ liệu đi qua Controller, Service, Repository và Database.
- `showroomId` dùng để xác định xe thuộc showroom nào.
- Xe không có `showroomId` không đủ điều kiện đặt cọc.
- Trạng thái xe lấy từ Backend, không dùng dữ liệu giả ở Frontend.
- Kết quả tìm kiếm và tổng số trang do Backend trả về.

### Phân bổ thời gian

```text
1 phút: Giới thiệu kiến trúc tổng thể
4 phút: Tìm kiếm, lọc và phân trang
3 phút: Mở chi tiết xe
3 phút: So sánh trạng thái xe
2 phút: Giải thích sơ đồ và luồng API
```

### Tiêu chí đạt

- Hiển thị đúng danh sách xe từ hệ thống.
- Bộ lọc hoạt động chính xác.
- Phân trang đúng tổng số dữ liệu.
- Chi tiết xe khớp với xe được chọn.
- Xe không đủ điều kiện không hiển thị nút đặt cọc.
- Giải thích đúng luồng Frontend → Backend → Database.

---

## 3. TV2: Đặt cọc, lịch hẹn và thanh toán

### Sơ đồ PlantUML cần đọc

- `02_activity_deposit.puml`
- `05_sequence_deposit.puml`
- `13_collab_deposit_appointment.puml`
- `16_collab_refund.puml`

### Nghiệp vụ cần demo

1. Đăng nhập bằng tài khoản Customer.
2. Mở chi tiết xe đủ điều kiện đặt cọc.
3. Chọn ngày hẹn, khung giờ và nhân viên.
4. Chọn hoặc bỏ chọn đăng ký lái thử.
5. Tạo đơn đặt cọc.
6. Hiển thị QR và thông tin thanh toán.
7. Thoát trang khi chưa thanh toán.
8. Vào mục **Đơn cọc & Lịch hẹn**.
9. Bấm **Tiếp tục thanh toán**.
10. Xác nhận thanh toán.
11. Kiểm tra các kết quả:
    - Deposit chuyển từ `PENDING` sang `DEPOSITED`.
    - Vehicle chuyển từ `AVAILABLE` sang `HOLD`.
    - Appointment được ghi nhận.
    - Biên lai/hợp đồng được sinh.
12. Kiểm tra không thể đặt cọc xe:
    - Không có showroom vận hành.
    - Đang `HOLD`.
    - Đã `SOLD`.

### Hướng dẫn trình bày

TV2 cần giải thích được:

- Chỉ Customer được tạo và xác nhận đơn cọc.
- Đơn mới tạo có trạng thái `PENDING`.
- Thoát trang không làm mất đơn cọc.
- Nút tiếp tục thanh toán lấy lại đơn cũ, không tạo đơn mới.
- Khi thanh toán thành công, xe chuyển sang `HOLD`.
- QR là QR/reference thanh toán mô phỏng trong hệ thống.
- Backend kiểm tra quyền sở hữu đơn, trạng thái xe, showroom, nhân viên và tranh chấp đồng thời.
- Admin và Staff không thể tạo hoặc xác nhận đơn cọc.

### Phân bổ thời gian

```text
2 phút: Đăng nhập Customer và chọn xe
3 phút: Tạo đơn cọc và lịch hẹn
2 phút: Thoát trang khi chưa thanh toán
3 phút: Tiếp tục thanh toán từ lịch sử đơn
2 phút: Xác nhận thanh toán và kiểm tra trạng thái HOLD
2 phút: Giải thích API, trạng thái và phân quyền
```

### Tiêu chí đạt

- Tạo được đơn cọc và lịch hẹn.
- Đơn chưa thanh toán vẫn được lưu ở trạng thái `PENDING`.
- Có thể quay lại đúng trang thanh toán của đơn cũ.
- Không tạo trùng Deposit hoặc Appointment.
- Thanh toán thành công cập nhật đúng trạng thái xe.
- Có biên lai/hợp đồng sau thanh toán.
- Xe không đủ điều kiện bị từ chối rõ ràng.
- Admin/Staff không thể bypass luồng bằng API.

---

## 4. TV3: Quản trị kho xe, lịch hẹn và hoàn cọc

# TV3 khi thực hiện quản lý lịch hẹn, đơn cọc phải lấy dữ liệu đã tạo từ TV2 khi TV2 demo Customer 

### Sơ đồ PlantUML cần đọc

- `01_use_case_overview.puml`
- `04_activity_admin_vehicle.puml`
- `08_sequence_admin_crud.puml`
- `09_sequence_staff.puml`
- `14_collab_staff_checkin.puml`
- `15_collab_admin_vehicle_crud.puml`
- `16_collab_refund.puml`
- `19_sequence_admin_refund_unlock_vehicle.puml`

### Nghiệp vụ cần demo

#### Quản lý kho xe bằng Admin

1. Đăng nhập Admin.
2. Mở **Kho xe**.
3. Xem danh sách xe.
4. Lọc theo:
   - Tất cả thành phố.
   - TP. Hồ Chí Minh.
   - Hà Nội.
   - Đà Nẵng.
   - Chưa phân chi nhánh.
5. Thêm xe mới.
6. Chọn chi nhánh showroom.
7. Kiểm tra `showroomId` và khu vực được đồng bộ.
8. Sửa thông tin xe.
9. Đổi trạng thái `AVAILABLE`, `HOLD`, `SOLD`.
10. Kiểm tra không thể mở lại xe đang có đơn cọc/lịch hẹn hiệu lực.

#### Quản lý lịch hẹn bằng Admin

1. Xem danh sách lịch hẹn đã thanh toán.
2. Kiểm tra lịch chưa thanh toán không xuất hiện trong danh sách xử lý.
3. Hủy lịch.
4. Đổi lịch.
5. Kiểm tra quyền hoàn cọc.

#### Hoàn cọc bằng Admin

1. Chọn đơn cần hoàn cọc.
2. Nhập lý do hoàn cọc.
3. Thực hiện hoàn cọc.
4. Kiểm tra:
   - Deposit chuyển sang `REFUNDED`.
   - Xe được mở lại khi đủ điều kiện.
   - Ledger ghi nhận giao dịch hoàn tiền.

#### Xử lý lịch bằng Staff

1. Đăng nhập Staff.
2. Xem lịch được phân công.
3. Không xem hoặc xử lý vượt quyền lịch của Staff khác.
4. Check-in khách/lái thử.
5. Kiểm tra lịch chuyển sang hoàn tất.
6. Kiểm tra Staff không có quyền tạo cọc hoặc hoàn cọc.

### Hướng dẫn trình bày

TV3 cần nhấn mạnh:

- Admin là role quản lý kho xe và hoàn cọc.
- Staff chỉ xử lý lịch được phân công.
- Lịch chưa thanh toán không xuất hiện trong giao diện Admin/Staff.
- `AVAILABLE + showroomId hợp lệ` mới đủ điều kiện đặt cọc.
- `AVAILABLE + showroomId NULL` hiển thị chưa mở đặt cọc.
- Không dùng text khu vực để suy đoán showroom.
- Xe `HOLD` có đơn hiệu lực không được mở lại.
- Hoàn cọc phải cập nhật Deposit, Vehicle và Ledger.
- Các thao tác quan trọng phải được Backend bảo vệ.
- Dữ liệu cũ có thể giữ `showroomId` hoặc `assignedStaffId` là `NULL` nếu chưa được phân công.

### Phân bổ thời gian

```text
3 phút: Kho xe và lọc theo showroom
3 phút: Thêm/sửa xe và đổi trạng thái
3 phút: Admin quản lý, hủy và đổi lịch
3 phút: Hoàn cọc và mở lại xe
2 phút: Staff xem lịch và check-in
```

### Tiêu chí đạt

- Admin thao tác được kho xe.
- Bộ lọc showroom trả đúng dữ liệu.
- Trạng thái xe đồng nhất giữa Kho xe và Showroom.
- Xe giữ cọc không thể mở bán lại trái quy trình.
- Lịch chưa thanh toán không xuất hiện cho Admin/Staff.
- Admin hủy/đổi lịch và hoàn cọc được.
- Staff chỉ xử lý lịch đúng quyền.
- Ledger ghi nhận đúng giao dịch hoàn tiền.

---

## 5. TV4: Đăng ký, OTP, đăng nhập và khôi phục mật khẩu

### Sơ đồ PlantUML cần đọc

- `00_system_architecture.puml`
- `03_activity_login.puml`
- `07_sequence_login.puml`
- `10_sequence_security.puml`
- `11_collab_login.puml`
- `17_sequence_register_verify_email.puml`
- `18_sequence_forgot_reset_password.puml`
- `20_collab_register_verify_email.puml`

### Nghiệp vụ cần demo

#### Đăng ký Customer

1. Mở trang đăng ký.
2. Nhập username, họ tên, email, số điện thoại và password.
3. Kiểm tra password policy:
   - Độ dài tối thiểu.
   - Chữ hoa.
   - Chữ thường.
   - Chữ số.
   - Ký tự đặc biệt.
4. Kiểm tra ràng buộc số điện thoại Việt Nam.
5. Gửi đăng ký.
6. Kiểm tra tài khoản được tạo ở trạng thái chưa xác minh.
7. Kiểm tra OTP được gửi qua email.

#### Xác minh email bằng OTP

1. Nhập email và OTP.
2. Xác minh thành công.
3. Kiểm tra tài khoản chuyển sang đã xác minh.
4. Nhập OTP sai hoặc hết hạn để minh họa lỗi.
5. Thử gửi lại OTP nếu có chức năng.

#### Đăng nhập

1. Đăng nhập bằng username/password.
2. Kiểm tra Backend xác thực:
   - Tài khoản tồn tại.
   - Mật khẩu đúng.
   - Email đã xác minh.
   - Tài khoản đang hoạt động.
   - Tài khoản không bị khóa.
3. Nhận JWT.
4. Chuyển đến giao diện đúng role.
5. Có thể minh họa thêm đăng nhập Admin và Staff.

#### Quên và đặt lại mật khẩu

1. Nhập username.
2. Nhận OTP qua email.
3. Nhập OTP.
4. Nhận reset token.
5. Nhập password mới.
6. Kiểm tra lại password policy.
7. Đăng nhập bằng password mới.

### Hướng dẫn trình bày

TV4 cần giải thích được:

- Password không lưu dạng plain text mà được mã hóa BCrypt.
- OTP được lưu dưới dạng hash, có thời hạn và chỉ dùng một lần.
- Email chưa xác minh không được đăng nhập.
- JWT dùng để xác thực các request sau đăng nhập.
- Role được kiểm tra ở Backend/Security Context, không tin dữ liệu Frontend.
- Customer, Staff và Admin có quyền khác nhau.
- Số điện thoại được kiểm tra ở Backend, không chỉ ở Frontend.
- Password reset sử dụng OTP và reset token một lần.
- OTP/reset token sai, hết hạn hoặc đã sử dụng đều bị từ chối.
- Gmail SMTP là dịch vụ gửi OTP bên ngoài hệ thống.

### Phân bổ thời gian

```text
3 phút: Đăng ký và kiểm tra password/số điện thoại
3 phút: Nhận OTP và xác minh email
3 phút: Đăng nhập, JWT và phân quyền
3 phút: Quên mật khẩu và đặt lại mật khẩu
1 phút: Giải thích Backend, Security và SMTP
```

### Tiêu chí đạt

- Đăng ký thành công với dữ liệu hợp lệ.
- Dữ liệu sai bị chặn và hiển thị thông báo rõ ràng.
- OTP được gửi và xác minh đúng.
- OTP sai/hết hạn bị từ chối.
- Tài khoản chưa xác minh không đăng nhập được.
- Login trả JWT hợp lệ.
- Giao diện được chuyển đúng theo role.
- Password reset thành công với token hợp lệ.
- Password mới phải đạt password policy.

---

## 6. Mẫu trình bày thống nhất cho mỗi video

### Mở đầu

```text
Tôi là TVx, phụ trách nhóm nghiệp vụ...
Nội dung này tương ứng với các sơ đồ...
```

### Điều kiện trước khi chạy

- Backend đang chạy.
- Frontend đang chạy.
- Database đã có dữ liệu cần thiết.
- Tài khoản demo đã được chuẩn bị.
- Các dịch vụ liên quan như SMTP đã sẵn sàng nếu cần.

### Trong lúc demo

- Nói rõ đang dùng role nào.
- Nói rõ dữ liệu đầu vào.
- Thực hiện từng bước chậm và rõ.
- Chờ kết quả API/giao diện trước khi chuyển bước.
- Giải thích trạng thái trước và sau thao tác.
- Thể hiện ít nhất một trường hợp lỗi hoặc bị từ chối.

### Kết thúc

```text
Nghiệp vụ đã hoàn tất.
Trạng thái dữ liệu sau cùng là...
Quyền của role được bảo vệ tại Backend bằng...
Các sơ đồ đã thể hiện trong video là...
```

---

## 7. Checklist chung trước khi quay

### Dữ liệu và tài khoản

- Có tài khoản Customer đã xác minh email.
- Có tài khoản Staff được gán showroom.
- Có tài khoản Admin.
- Có xe `AVAILABLE` tại TP.HCM, Hà Nội hoặc Đà Nẵng.
- Có xe `HOLD`.
- Có xe `SOLD`.
- Có xe `showroomId = NULL`.
- Có nhân viên còn trống lịch.
- Có đơn cọc đã thanh toán.
- Có đơn cọc đang chờ thanh toán.

### Kỹ thuật

- Backend chạy ổn định.
- Frontend chạy ổn định.
- Database đúng phiên bản migration.
- Gmail SMTP hoạt động.
- Không để lộ password thật, JWT hoặc dữ liệu nhạy cảm.
- Tắt các cửa sổ không liên quan.
- Chuẩn bị dữ liệu test trước để tránh mất thời gian nhập.
- Kiểm tra độ phân giải màn hình và font chữ.

### Tên file video đề xuất

```text
TV1_KienTruc_TimKiemXe.mp4
TV2_DatCoc_ThanhToan.mp4
TV3_QuanLyKhoXe_LichHen_HoanCoc.mp4
TV4_DangKy_DangNhap_OTP.mp4
```

## 8. Mục tiêu tổng thể của 4 video

```text
Xem xe
  -> Đăng ký
  -> Xác minh OTP
  -> Đăng nhập
  -> Tìm kiếm xe
  -> Đặt cọc
  -> Đặt lịch
  -> Thanh toán
  -> Nhân viên tiếp nhận
  -> Admin quản lý xe
  -> Hoàn cọc
  -> Cập nhật trạng thái
  -> Kiểm tra phân quyền và bảo mật
```

Sau 4 video, toàn bộ luồng chính của hệ thống phải được thể hiện từ lúc người dùng truy cập, xác thực, tìm xe, đặt cọc, thanh toán, xử lý lịch hẹn cho đến quản trị và hoàn cọc.
