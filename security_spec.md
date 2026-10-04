# Security Specification: DO-DEEL CDS Manager

## 1. Data Invariants
1. **PII Isolation**: Users' private contact details (`email`, `phone`, `callUpNo`) stored in `/users/{userId}` can ONLY be read by the user themselves or State Leadership (`isAdmin()` / `isStateLeadership()`). Members cannot read other members' `/users/{userId}` records.
2. **Public Directory**: Non-sensitive profiles in `/user_profiles/{userId}` can be read by signed-in members of the same organization.
3. **Role Escalation Defense**: Non-admin users cannot write or elevate their own `role` field.
4. **LG Scoping Invariant**: LG-level users (LG President, Executive, Member) are restricted to their own `assignedLG` / `lgId`, while State Leadership (`CDS_COORDINATOR`, `STATE_PRESIDENT`, `VP_GROWTH`, `VP_ACCOUNTABILITY`, `VP_COMMUNITY_IMPACT`) has state-wide visibility.
5. **Anti-Manual Overdue**: `status` field cannot be arbitrarily chosen as `OVERDUE` by client writes; `OVERDUE` is calculated dynamically against the deadline, while client writes update `manualProgress` to `IN_PROGRESS` or `COMPLETED`.
6. **Task Assignment Authority**: Only authorized leadership and LG executives can create or reassign tasks.
7. **Attendance Deduplication**: Attendance records are stored at `/activities/{activityId}/attendance/{memberId}`, guaranteeing single-entry idempotency and mathematically preventing duplicate attendance records for the same member and activity.
8. **Document Confidentiality**: Documents with visibility `EXECUTIVES_ONLY` or `LEADERSHIP_ONLY` cannot be read by standard `MEMBER` users.
9. **Learning Authoring**: Only `CDS_COORDINATOR`, `STATE_PRESIDENT`, or `VP_GROWTH` can publish or update learning resources.
10. **Report Confidentiality**: Monthly operational reports cannot be accessed by general `MEMBER` users; access is restricted to executives, LG presidents (for their LG), and state leadership.
11. **Immutable Fields**: `id`, `createdAt`, `createdBy`, and `taskId` cannot be tampered with on update.
12. **Audit Timestamp**: `createdAt` and `updatedAt` must be valid timestamps.

## 2. The Dirty Dozen Payloads (Adversarial Tests)
1. **Payload 1 (PII Scraping Attack)**: Member user A requests `get /users/{userB}` to scrape private phone and call-up numbers. Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Self Role Escalation)**: User registers or updates their own document with `role: "CDS_COORDINATOR"`. Expected: `PERMISSION_DENIED`.
3. **Payload 3 (LG Boundary Breach)**: LG President of Ikeja attempts to read or mutate tasks belonging to `assignedLG: "lg-surulere"`. Expected: `PERMISSION_DENIED`.
4. **Payload 4 (Confidential Document Exfiltration)**: Member requests `get /documents/{docId}` where `visibility: "LEADERSHIP_ONLY"`. Expected: `PERMISSION_DENIED`.
5. **Payload 5 (Report Snoop Attack)**: Member requests `get /monthly_reports/{reportId}` containing internal challenges and executive reviews. Expected: `PERMISSION_DENIED`.
6. **Payload 6 (Shadow Status Falsification)**: Member attempts to update task status directly to `COMPLETED` without being the assignee or having submitted deliverables. Expected: `PERMISSION_DENIED`.
7. **Payload 7 (Duplicate Attendance Injection)**: Executive attempts to post multiple attendance entries for the same member to artificially inflate numbers. Blocked by document ID path `{memberId}`.
8. **Payload 8 (Unauthorized Learning Publication)**: Standard member attempts to publish or delete a YouTube learning resource in `/learning_resources`. Expected: `PERMISSION_DENIED`.
9. **Payload 9 (Task Hijack)**: Unrelated user attempts to reassign a task's `assignedTo` to another user. Expected: `PERMISSION_DENIED`.
10. **Payload 10 (Ghost Field Injection)**: Client sends task payload with injected hidden administrative privilege flag `__isAdmin: true`. Rejected by `affectedKeys().hasOnly()`. Expected: `PERMISSION_DENIED`.
11. **Payload 11 (Oversized ID Injection)**: Adversary sends document write with 2000-character malicious string ID to crash index. Rejected by `isValidId()`. Expected: `PERMISSION_DENIED`.
12. **Payload 12 (Unauthenticated Write)**: Unauthenticated visitor attempts to create activity or mark attendance. Expected: `PERMISSION_DENIED`.
