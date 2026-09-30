| FR    | Yêu cầu               | UC       | API                         | Test    | Hiện trạng                                |
| ----- | --------------------- | -------- | --------------------------- | ------- | ----------------------------------------- |
| FR-01 | Đăng ký               | UC-09    | Pending                     | AUTH-01 | Pending                                   |
| FR-02 | Login/RBAC            | UC-04    | Pending                     | AUTH-02 | Pending                                   |
| FR-03 | OTP reset             | UC-10    | Pending                     | AUTH-03 | Pending                                   |
| FR-04 | Search/filter         | UC-02    | `GET /api/v1/listings`      | CAR-01  | Có code                                   |
| FR-05 | Detail                | UC-03    | `GET /api/v1/listings/{id}` | CAR-02  | Có code, còn thiếu một số field nghiệp vụ |
| FR-06 | Favorites             | UC-11    | Pending                     | USER-01 | Pending                                   |
| FR-07 | Deposit + Appointment | UC-06    | Pending                     | DEP-01  | Pending                                   |
| FR-08 | Mock payment          | UC-07    | Pending                     | DEP-02  | Pending                                   |
| FR-09 | Lock vehicle          | UC-07    | Pending                     | DEP-03  | Pending                                   |
| FR-10 | Receipt/contract      | UC-07/P2 | Pending                     | DEP-04  | Pending                                   |
| FR-11 | Contact               | P2       | Pending/static              | UI-01   | Pending                                   |
| FR-12 | Staff appointment     | UC-08    | Pending                     | APP-01  | Pending                                   |
| FR-13 | Admin CRUD            | UC-05    | `/api/v1/vehicles`          | ADM-01  | API có, RBAC pending                      |
| FR-14 | Deposit ledger        | UC-14    | Pending                     | ADM-02  | Pending                                   |
| FR-15 | Account management    | UC-13    | Pending                     | ADM-03  | Pending                                   |
