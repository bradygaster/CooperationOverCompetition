# Decision Log Template: Specialists Run

This log captures all significant decisions made during the run: technical choices, scope trade-offs, prioritization, and escalations.

**Run:** Specialists
**Date Range:** _______________ to _______________

---

## Decision Log Entries

### Entry 1: [Decision Title]

**Time:** _______________
**Made by:** _______________ (specialist role)
**Context:** What triggered this decision? What was the question?

**Options Considered:**
1. Option A — [description + pros/cons]
2. Option B — [description + pros/cons]
3. Option C — [description + pros/cons]

**Decision:** Option __
**Rationale:** Why this one?

**Impact:** Which tasks does this affect? Are there follow-on decisions needed?

**Escalation:** Yes / No. If yes: Coordinator agreed on _______________ (date/time).

---

### Entry 2: [Next Decision]

**Time:** _______________
**Made by:** _______________
**Context:** _______________

**Options Considered:**
1. _______________
2. _______________

**Decision:** _______________
**Rationale:** _______________

**Impact:** _______________

**Escalation:** Yes / No

---

### Entry 3: [Next Decision]

(Copy template above for each decision)

---

## Decision Types Expected

Examples of decisions to log:
- **Technical:** How should we implement filtering? Should we use SQL WHERE or in-memory filtering?
- **Architecture:** Should audit log use a separate table or JSON in the tasks table?
- **API Design:** Should DELETE /tasks/bulk be its own endpoint or use DELETE /tasks with array body?
- **Testing Strategy:** Should we test bulk operations at the unit level or integration level?
- **Scope Trade-offs:** Should we implement rate limiting for export/import or defer to later?
- **Prioritization:** Which task should we tackle first?
- **Escalation:** When a conflict arises between specialists (e.g., API design vs. persistence design).

---

## Summary (End of Run)

**Total decisions logged:** ___________
**Major decisions (affecting architecture):** ___________
**Escalations to Coordinator:** ___________
**Scope changes (vs. original tasks):** ___________

**Patterns observed:**
- Did decisions cluster in one area (e.g., API design)?
- Were there any recurring decision conflicts?
- How often was the Coordinator involved?
- Did specialists make decisions independently or collaboratively?

