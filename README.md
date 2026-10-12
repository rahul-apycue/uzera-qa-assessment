# Uzera - Plan-Based Team Member Invitations Automation Suite

## Overview
This repository contains the end-to-end test approach and automated verification suite for Uzera's team member invitation limits based on subscription plans (Free: up to 2 members, Premium: unlimited).

## Tech Stack
- **Test Framework:** Playwright Test (TypeScript)
- **Mock Server:** Express (Node.js) simulating REST API endpoints
- **Test Isolation:** Tenant-scoped headers (`x-workspace-id`) with state reset hooks

## Project Structure
- `TEST_APPROACH.md`: Part 1 test approach, risk matrix, assumptions, and product questions.
- `src/server/mockServer.ts`: Lightweight Express mock server simulating Uzera API contracts.
- `src/api/invitationClient.ts`: Reusable API client abstraction managing requests and headers.
- `tests/teamInvitations.spec.ts`: Test suite covering boundary limits, lifecycle events, plan upgrades, and concurrency.

## Setup & Execution

### Prerequisites
- Node.js (v18.x or later)
- npm (v9.x or later)

### Installation
```bash
npm install
npx playwright install --with-deps
```

### Running the Tests
```bash
npm test
```

To run with HTML reporting:
```bash
npx playwright test --reporter=html
npx playwright show-report
```
