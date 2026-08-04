# Product Requirements Document (PRD)

## Project: AI code-review agent for small teams (`5-ai-code-review-agent`)

---

## 1. Product Objectives & Scope

### Goals
- Ship MVP within **3-4w** at ~10 hrs/wk founder time.
- Reach 10 paying customers in early validation phase.
- Hold LLM cost to <= 20% of customer revenue per unit.

### Non-Goals
- Anything outside the Second-Build / AI Agents wedge.
- Custom integrations not on Stripe / standard APIs / MCP.

---

## 2. User Stories & Workflows

### Persona 1: Buyer / Decision-Maker
- **As a** Eng lead at seed-Series B SaaS. Dev-tool budget. Buys time back from senior reviewers., **I want to** see measurable ROI in week 1, **so that** I keep paying.
- **Acceptance:** Dashboard surfaces per-outcome savings within first session.

### Persona 2: End User / Operator
- **As an** operator, **I want to** approve or correct agent output cheaply, **so that** the workflow stays under my control.
- **Acceptance:** HITL gate on high-impact actions; one-click approval UI; Slack/email notifications.

---

## 3. Key Functional Requirements

### MVP Features
1. **GitHub PR webhook**
2. **diff-aware review (bug/security/style)**
3. **suggested fixes inline**
4. **ignore-list per repo**

### Post-MVP
1. Multi-tenant RBAC + SSO for B2B expansion.
2. Eval regression suite in CI w/ golden cases.
3. MCP server hosting for adjacent tools.

---

## 4. Non-Functional Requirements

- **Performance:** <2s API response (non-LLM); streamed agent updates.
- **Reliability:** 99.9% uptime target w/ retries + DLQ.
- **Security:** TLS 1.3 in transit, AES-256 at rest, secrets scrubbed from logs.
- **Compliance:** GDPR, SOC2-lite if B2B enterprise.

---

## 5. Key Metrics & Success Criteria

- Conversion: >= 5% landing -> trial.
- Churn: < 5% monthly.
- LLM margin: cost <= 20% of customer revenue.
- Eval pass rate: 100% of 3 golden cases before each release.

---

## 6. Failure Modes (must not regress)

- False positives cause alert fatigue.
- latency too high for fast-moving PRs.
- comment conflicts with human reviewer.
