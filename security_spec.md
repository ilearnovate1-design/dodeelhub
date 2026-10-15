# Security Specification: DO-DEEL CDS Manager

## Data Invariants
1. A Task must have a valid `assignedTo` (Member ID) and `assignedBy` (Leadership ID).
2. Attendance records must correspond to a valid Member ID and Activity ID.
3. Only the CDS Coordinator can access administrative settings and perform bulk data operations.
4. Membership status can only be modified by authorized leadership (LG President or above).

## The "Dirty Dozen" Payloads (Deny List)
1. **Unauthenticated Write**: Attempting to create a member profile without being logged in.
2. **Self-Elevation**: A Member trying to change their own `role` to `CDS_COORDINATOR`.
3. **ID Poisoning**: Submitting a Task with a 1MB string as the `taskId`.
4. **PII Leak**: A Member trying to `get` the full profile (including phone) of another member they don't lead.
5. **Orphaned Task**: Creating a Task for a non-existent Member.
6. **Shadow Update**: Updating a Task and adding a secret `isAdmin: true` field.
7. **Time Spoofing**: Setting a `createdAt` date in the past instead of using `request.time`.
8. **Status Shortcut**: Marking a Task as `COMPLETED` without providing any `evidence` when it's required.
9. **Cross-LG Snooping**: An LG President trying to list activities of a different LG chapter.
10. **Bypassing Invariants**: Deleting an Activity that has recorded attendance (if forbidden).
11. **Bulk Scrape**: Attempting a `list` on the `members` collection without any filters.
12. **Metadata Hijack**: Updating a document and changing the `createdBy` field.

## Security Rule Logic Strategy
- **isLeadership()**: Helper to identify roles with oversight.
- **isOwner(userId)**: strictly matches `request.auth.uid`.
- **isValidMember()**, **isValidTask()**: Strict schema validation.
- **Master Gate**: Use `get()` to verify leadership roles on-the-fly.
