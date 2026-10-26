# Security Specification — MozFácil Professionals & Services Module

## 1. Data Invariants

1. **PII Isolation (`users/{userId}`)**:
   - A user profile document can only be read (`get`) by the authenticated owner (`request.auth.uid == userId`) or a verified administrator (`isAdmin()`).
   - No `list` operation is allowed on `users` except for verified administrators (`isAdmin()`).
   - Regular users cannot self-assign `role == 'admin'`. Only `role in ['visitor', 'professional']` is allowed on self-registration unless `isAdmin()`.
2. **Professional Profile Ownership & Lifecycle (`professional_profiles/{profileId}`)**:
   - Every profile must have `ownerId == request.auth.uid` on creation and `ownerId` is immutable on update.
   - `primaryCategoryId` must reference an existing document in `professional_categories`.
   - Public visitors can only `get` or `list` profiles where `resource.data.publicationStatus == 'published'`.
   - Non-admin owners can create profiles with `publicationStatus in ['draft', 'pending_review', 'published']` (when mandatory fields are satisfied) and cannot modify `suspended` profiles (`resource.data.publicationStatus != 'suspended'`) without an administrator.
   - `specialtyIds` and `specialtyNames` arrays are strictly bounded to `.size() <= 10`.
3. **Dynamic Professional Categories (`professional_categories/{categoryId}`)**:
   - Any verified authenticated user can propose a new category with `reviewStatus == 'pending'` and `creatorId == request.auth.uid` (or `isAdmin()` can create with `'approved'`).
   - Only administrators (`isAdmin()`) can approve, reject, rename, merge, or configure activity-specific fields on existing categories.
4. **Relational Sub-Entities (`professional_specialties`, `professional_services`, `professional_media`, `availability_schedules`)**:
   - Cannot exist without an existing parent `professional_profiles/{profileId}` document owned by `request.auth.uid` (or `isAdmin()`).
   - Public visitors can only read (`get`, `list`) records where `resource.data.publicationStatus == 'published'`.
5. **Immutable Audit Trail (`audit_logs/{logId}`)**:
   - Audit logs can only be created with `actorId == request.auth.uid` and `createdAt == request.time`.
   - Audit logs are strictly immutable (`allow update, delete: if false;`) and readable only by `isAdmin()` or the actor (`resource.data.actorId == request.auth.uid`).

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Privilege Escalation / Self-Admin Assignment)**:
   `users/attacker_uid` create with `{"id": "attacker_uid", "role": "admin", ...}` by non-admin user.
2. **Payload 2 (PII Blanket Read / Cross-User Scraping)**:
   Authenticated user `user_b` attempting `get(/users/user_a)` or `list(/users)`.
3. **Payload 3 (Shadow Field Injection on Profile Update)**:
   Owner updating `professional_profiles/prof_1` with an undeclared field `{"isFeaturedSuperAdmin": true}`.
4. **Payload 4 (Identity Spoofing on Profile Creation)**:
   Authenticated user `user_a` creating `professional_profiles/prof_1` with `{"ownerId": "user_b", ...}`.
5. **Payload 5 (Orphaned Service Creation)**:
   Authenticated user creating `professional_services/srv_1` referencing a non-existent `profileId: "non_existent_prof"`.
6. **Payload 6 (Cross-Owner Service Injection)**:
   Authenticated user `user_b` creating `professional_services/srv_1` referencing `profileId: "prof_owned_by_user_a"`.
7. **Payload 7 (Denial of Wallet / ID Poisoning)**:
   Creating `professional_profiles/{200_char_junk_id}` or `displayName` exceeding 120 characters.
8. **Payload 8 (Unbounded Array Exhaustion)**:
   Updating `professional_profiles/prof_1` with `specialtyIds` containing 25 elements (exceeding max 10).
9. **Payload 9 (Unauthorized Category Approval by Non-Admin)**:
   Regular user updating `professional_categories/cat_1` to set `reviewStatus: "approved"`.
10. **Payload 10 (Suspended Profile Self-Reactivation)**:
    Owner of a `suspended` profile attempting to update `publicationStatus` back to `published`.
11. **Payload 11 (Timestamp Forgery / Backdating)**:
    Creating `professional_profiles/prof_1` with a past `createdAt` timestamp instead of `request.time`.
12. **Payload 12 (Audit Log Tampering / Deletion)**:
    User or admin attempting to `update` or `delete` an existing document in `audit_logs/log_1`.

---

## 3. Test Runner Reference

See `/firestore.rules.test.ts` for the verification suite testing all 12 adversarial payloads for `PERMISSION_DENIED`.
