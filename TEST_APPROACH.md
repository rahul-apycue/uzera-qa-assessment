# Part 1: Test Approach - Plan-Based Team Member Invitations

## 1. Overview & Strategy
The objective is to validate plan-based team member invitation restrictions for Uzera: Free plan capped at 2 members, and Premium plan permitting unlimited invites. The test strategy focuses heavily on API contract verification, boundary validation, state transitions, and concurrency.

## 2. Ambiguities, Assumptions & Product Questions
- **Quota Count Definition:** Both accepted members and pending invitations count toward the 2-member limit. Revoked/expired invites free up slots.
- **Workspace Owner:** The owner is the administrator and does not consume one of the 2 member slots.
- **Plan Downgrade:** Existing members retain read-only access, but new invitations are blocked until active members drop below 2.
- **Plan Upgrade:** Upgrades take effect immediately, lifting limits without requiring workspace recreation.
- **Duplicate Invites:** Returns HTTP 409 Conflict without consuming an extra slot.
- **Error Contract:** Returns HTTP 403 Forbidden with `{"error": "LIMIT_EXCEEDED"}` when exceeding the limit.

## 3. Test Coverage Matrix
- **Boundary Value Analysis (Free Plan):** 0 invites (allowed), 1 invite (allowed), 2 invites (allowed, limit reached), 3rd invite (rejected).
- **CRUD Lifecycle:** Free plan reaches 2 -> Revoke 1 -> Verify count drops -> Send new invite -> Successfully allowed.
- **Premium Plan:** Sending 3, 5, or 10+ invites succeeds without restrictions.
- **Concurrency:** Simultaneous requests targeting 1 remaining slot ensure only one succeeds.

## 4. Automation vs. Manual Rationale
- **Automated:** Boundary limits, CRUD state transitions, race conditions, regression API suites.
- **Manual:** Visual email deliverability/rendering across mail clients and exploratory client-side banner UX.
