# Activity Diagrams — TV5

Ngày đồng bộ: 01/10/2026

Các activity dưới đây mô tả **luồng xử lý nghiệp vụ** theo code hiện tại. UI được tách thành partition riêng để khi xuất ảnh có thể nhìn giống mẫu: UI → Controller → Service → Database → UI.

## 1. Đặt cọc + lịch hẹn + xác nhận cọc

Nguồn: `DepositPage`, `DepositController`, `DepositService`, `VehicleRepository`, `DepositRepository`, `AppointmentRepository`, `TransactionLedgerRepository`.

```plantuml
!include 02_activity_deposit.puml
```

## 2. Đăng nhập + JWT/RBAC

```plantuml
!include 03_activity_login.puml
```

## 3. Admin CRUD / trạng thái xe

```plantuml
!include 04_activity_admin_vehicle.puml
```

> `!include` chỉ dùng khi render từ thư mục `docs/UML`; nếu công cụ không resolve include, mở trực tiếp file `.puml` tương ứng trong `docs/UML/diagrams/`.
