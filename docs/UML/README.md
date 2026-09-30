# UML Documentation

## Mục đích

Bộ UML của TV5 phải phản ánh **code + API + database hiện tại**, không giữ lại class/actor/endpoint từ scope cũ nếu project không còn triển khai.

## Tài liệu

| File | Nội dung |
|---|---|
| `Use_Case.md` | Actor, use case, scope và business rules |
| `Class_Diagram.md` | Class/entity/service/controller/repository chính đang có |
| `Sequence_Diagrams.md` | Luồng tương tác theo API hiện tại |
| `Collaboration_Diagrams.md` | Object collaboration của các flow nghiệp vụ chính |
| `Traceability_Matrix.md` | FR → UC → API → Test/Evidence → Status |
| `../Database/ERD/ERD.md` | ERD vật lý theo schema + V3 migration |

## Quy tắc source-of-truth

1. Backend source quyết định class, method và endpoint đã tồn tại.
2. Database migration/schema quyết định table, key, constraint và state.
3. API specification là contract cần đồng bộ với code; khi lệch phải đánh dấu `PARTIAL/CONTRACT MISMATCH`, không tự bịa code.
4. Test file/evidence quyết định `VERIFIED`; chỉ thấy code thì dùng `IMPLEMENTED`.
5. Auth classes chỉ đưa vào UML khi TV4 thực sự commit implementation.
6. Không mô tả ML, regression, valuation, recommendation, comparison, payment thật hoặc standalone test-drive như chức năng hiện hành.

## Ngày đồng bộ

30/09/2026 — TV5 audit branch `TV5`.
