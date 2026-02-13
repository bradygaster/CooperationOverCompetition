# Decision Log Template: Generics Run

This log captures all significant decisions made during the run: technical choices, scope trade-offs, and conflict resolutions.

**Note:** In generic mode, decisions may be made individually by agents without coordination. Log decisions as they're discovered (via PR discussions, merge commits, or direct observations).

**Run:** Generics
**Date Range:** _______________ to _______________

---

## Decision Log Entries

### Entry 1: [Decision Title]

**Time:** _______________
**Made by:** _______________ (agent name)
**Context:** What triggered this decision? Was it coordinated or unilateral?

**Decision:** [What was decided?]
**Rationale:** Why was it decided this way?

**Conflict:** Yes / No. If yes:
- What was the alternative?
- How was the conflict resolved? (code review, rewrite, compromise)
- Time spent on conflict: _______________

**Impact:** Which tasks does this affect? Did other agents have to adapt?

---

### Entry 2: [Next Decision]

(Copy template above for each decision)

---

## Decision Types Expected

Examples of decisions in generic mode:
- **Uncoordinated:** Agent A decides to use SQL joins for filtering; Agent B later assumes in-memory filtering. Discovered in review. Rework required.
- **Conflicting schema:** Agent A adds `priority` column; Agent B adds `priority_level` column for same feature. Merge conflict. One gets rewritten.
- **API design:** Agent A names endpoint `GET /tasks/filter`; Agent B names it `GET /tasks?filter=...`. Both push. PR discussion, one rewrites.
- **Test strategy:** Agent A writes unit tests; Agent B writes integration tests. Test structure is inconsistent.
- **Documentation:** Agent A documents API fully; Agent B skips docs and focuses on code. Inconsistent.
- **Escalation:** None expected (no Coordinator role).

---

## Conflict Resolution Patterns

Track how conflicts were resolved:

| Conflict Type | Count | Typical Resolution | Time to Resolve |
|---|---|---|---|
| Merge conflict (code overlap) | ___ | Manual resolution | ___ min |
| Design conflict (schema/API) | ___ | Code review + rewrite | ___ min |
| Test structure inconsistency | ___ | Refactor + adjustment | ___ min |
| Documentation gap | ___ | One agent catches up | ___ min |

---

## Decision Autonomy

Track how decisions were made:

| Category | Count | Pattern |
|---|---|---|
| Unilateral (no discussion) | ___ | Agent decides; others adapt |
| PR-based (discovered in review) | ___ | Conflict found after code written |
| Coordinated (discussed before) | ___ | Agents talked first |

---

## Summary (End of Run)

**Total decisions logged:** ___________
**Uncoordinated decisions:** ___________
**Design conflicts discovered:** ___________
**Rework due to conflicts:** ___________
**Time spent on conflict resolution:** ___________

**Patterns observed:**
- Did agents naturally coordinate or stay independent?
- Which task created the most conflicts (API, persistence, or tests)?
- Did conflict resolution get faster as the run progressed?
- Any patterns in which agents conflicted with each other?

