Xây dựng hệ thống quản lý kinh doanh ô tô đã qua sử dụng

Stack:
Spring Boot
React
PostgreSQL
JPA

P0:
Auth/RBAC
Vehicle showroom
Search/filter/detail
Admin CRUD
Deposit giả lập
Appointment
Vehicle locking
Duplicate-deposit prevention

P1:
Register
OTP
Favorites
Deposit history
Staff appointment
Admin ledger/account/statistics

P2:
QR đẹp
Receipt/contract download
Contact links
Advanced gallery/chart

Removed:
ML
Regression
R Plumber
Valuation
Recommendation
Comparison
Real payment
Shopping cart
Standalone test-drive workflow

NFR-01 Performance
Search/filter target < 2s under normal demo conditions.

NFR-02 Integrity
Deposit/vehicle state transition must be transaction-safe.

NFR-03 Security
Password hashing and authorization.

NFR-04 Compatibility
Responsive React UI for desktop/mobile.