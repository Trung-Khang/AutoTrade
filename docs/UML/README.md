# UML — TV5

## Source of truth

Diagram phải bám:

1. `backend/src/main/java/com/system/controller`
2. `backend/src/main/java/com/system/service`
3. `backend/src/main/java/com/system/repository`
4. `backend/src/main/java/com/system/entity`
5. `backend/src/main/java/com/system/config/SecurityConfig.java`
6. `frontend/src/pages`
7. `frontend/src/App.jsx`
8. PostgreSQL migrations trong `database/migrations`

## Bộ diagram cần dùng

- `Use_Case.md`: 19 nghiệp vụ baseline từ tài liệu mô tả hệ thống, có trạng thái implementation.
- `Activity_Diagrams.md`: activity cho deposit, login, Admin CRUD.
- `Sequence_Diagrams.md`: sequence có ký hiệu UI (`boundary`) → controller/service (`control`) → repository (`collections`) → PostgreSQL (`database`).
- `Collaboration_Diagrams.md`: message/object view.
- `Class_Diagram.md`: class thực tế.
- `Traceability_Matrix.md`: FR → UC → API → Test/Evidence.

## PlantUML source

Các file `.puml` nằm tại `docs/UML/diagrams/` để import trực tiếp vào PlantUML/VS Code extension.

Không sửa diagram bằng cách tự thêm class/API/actor chưa có trong source. Nếu nghiệp vụ có trong tài liệu gốc nhưng chưa có code, đánh dấu `PENDING` hoặc `PARTIAL`.
