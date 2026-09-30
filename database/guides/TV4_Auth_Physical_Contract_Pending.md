# Official reconciliation resolved — 01/10/2026

V3_0_4 từ origin/main đã đối chiếu; V3_0_5 additive giữ contract29. Hibernate validate, demo HTTP login/current-user và OTP DB regressions PASS. Real SMTP delivery NOT RUN: SMTP_USERNAME/SMTP_PASSWORD chưa có. Các ghi chú predecessor absent/pending phía dưới là lịch sử nguồn, đã được supersede. Xem Auth_Identity_Integration.md và evidence official_20261001_030621_7a31e3.

## Historical physical response

# TV4 physical contract — RESOLVED — 01/10/2026

Tên file được giữ để bảo toàn link cũ. Dependency định nghĩa cột OTP/reset đã RESOLVED bởi TV4_Auth_Physical_Contract_Response.md, với đầy đủ physical contract được người dùng chép lại trong yêu cầu cập nhật. Không yêu cầu thêm entity/checkout để triển khai database.

- app_users: giữ identity/profile/role/state; thêm created_at và updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP. Không updated_at trigger; TV4 dùng @PreUpdate.
- auth_otps: id BIGSERIAL PK; user_id BIGINT NOT NULL/CASCADE; email VARCHAR(254), purpose VARCHAR(30), code_hash VARCHAR(64), expires_at TIMESTAMPTZ đều NOT NULL; expires_at không default. created_at/last_sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP; consumed_at/invalidated_at TIMESTAMPTZ nullable; attempt_count INT NOT NULL DEFAULT 0. Purpose VERIFY_EMAIL/RESET_PASSWORD, attempts 0–5; index (user_id,purpose,created_at DESC).
- password_reset_sessions: id BIGSERIAL PK; user_id BIGINT NOT NULL/CASCADE; token_hash VARCHAR(64) NOT NULL UNIQUE; expires_at TIMESTAMPTZ NOT NULL không default; created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP; consumed_at TIMESTAMPTZ nullable.
- Business identity: deposits/appointments.user_id BIGINT NOT NULL/RESTRICT; soft disable giữ history. Không index thường trùng UNIQUE token_hash, direct OTP FK, active-OTP uniqueness, extra fields, lifecycle triggers hoặc CHECK NOW().

Candidate hoàn chỉnh: database/drafts/auth_database_candidate.sql, không gắn version vì TV4 dành official V3_0_4__auth_and_otp.sql, commit 48c8f88. File gốc vắng trong workspace; chưa đối chiếu checksum/nội dung. Không tạo V3_0_4 thứ hai hoặc V3_0_5 phụ thuộc predecessor chưa review.

Dependency còn lại: official migration reconciliation và auth runtime, không phải định nghĩa cột. TV4/manager review candidate với SQL V3_0_4 gốc rồi chốt artifact/version/bootstrap; TV4 chạy Hibernate validate và real login/register/OTP/reset trên DB isolated. SQL PASS không chứng minh JWT/RBAC/SMTP/ownership/Gate 2.

Nguồn handoff ban đầu: C:/Users/DELL/Downloads/TV4_Handoff.md sections 5/5A. Nguồn response sử dụng là toàn bộ physical contract chép trong attachment yêu cầu Pasted text.txt; bản Markdown response riêng không hiện diện ở các vị trí được cung cấp. Mapping đã đầy đủ, không xem đây là blocker implementation. Không tìm hoặc thay đổi checkout thành viên khác. Xem [guide](Auth_Identity_Integration.md).
