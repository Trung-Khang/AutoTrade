
---

# 6. `docs/UML/Collaboration_Diagrams.md` — tạo mới

Nên chọn **Deposit** làm collaboration chính vì đây là luồng quan trọng nhất.

Nhưng hiện tại code Deposit chưa có.

Vì vậy ngày 30/09 có thể tạo phần khung:

```text
Customer
   ↓
Deposit UI
   ↓
Deposit Controller       [PENDING]
   ↓
Deposit Service          [PENDING]
   ↓
Deposit Repository       [PENDING]
   ↓
Database

Deposit Service
   ↓
Appointment Service      [PENDING]

Deposit Service
   ↓
Vehicle Repository