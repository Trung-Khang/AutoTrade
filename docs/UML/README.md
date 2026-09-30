# UML Documentation

## Mục đích

UML của TV5 phải phản ánh **implementation + API contract đã được xác minh + database migration**, và phải đánh dấu rõ khi ba nguồn này lệch nhau.

## Tài liệu

| File | Nội dung |
|---|---|
| `Use_Case.md` | Actor, use case, business rules, trạng thái |
| `Class_Diagram.md` | Entity, DTO, service, controller, repository, security/auth classes thực tế |
| `Sequence_Diagrams.md` | Luồng auth, catalog, deposit, appointment, refund |
| `Collaboration_Diagrams.md` | Object collaboration cho các flow chính |
| `Traceability_Matrix.md` | FR → UC → API → Test/Evidence → Status |
| `../Database/ERD/ERD.md` | Physical relational model theo migration hiện tại |

## Source-of-truth rule

1. Backend source quyết định class, method và endpoint thực tế.
2. Database migration quyết định table, column, key, constraint, status.
3. API specification là contract cần đồng bộ; nếu lệch source, TV5 ghi `CONTRACT MISMATCH`, không tự bịa implementation.
4. Test files/evidence quyết định `VERIFIED`.
5. Auth/security classes **được đưa vào UML** vì đã có trong repository.
6. `X-User-Id` trong `DepositController` được ghi như legacy mismatch; không coi nó là current-user contract.
7. Không mô tả ML/regression/valuation/recommendation/comparison/payment thật là chức năng hiện hành.

## Ngày đồng bộ

01/10/2026 — audit branch `TV5`.
