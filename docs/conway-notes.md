# Conway's Law: Notes & Context

## What is Conway's Law?

**Definition** (original, 1967):
> "Any organization that designs a system will produce a design whose structure is isomorphic to the structure of the organization which produced it."

**In plain English:**
The structure of the code/system mirrors the structure of the team that built it.

### Examples

1. **Monolith Team:**
   - Team: 3 people, no roles, all doing everything
   - Result: One large, tightly-coupled codebase (hard to separate concerns)

2. **Microservices Team:**
   - Team: 6 squads, each owning a service (checkout, payment, inventory, etc.)
   - Result: Separate microservices with clear boundaries

3. **Hierarchical Company:**
   - Team: CEO → VP → Managers → Engineers (strict reporting structure)
   - Result: Layered architecture (controllers → services → repositories → database)

4. **Flat, Autonomous Team:**
   - Team: 5 peers with no hierarchy or assignments
   - Result: Loosely-coupled, ad-hoc codebase; varied patterns and styles

---

## Why Does This Matter?

Conway's Law suggests that **organizational structure is not just about people — it affects the quality, coherence, and maintainability of the code they produce**.

### Implications

1. **Structure precedes design:** Before you design an architecture, you design the team that will build it.

2. **Bad communication → Bad code:** If your team structure creates communication silos, the code will be hard to integrate.

3. **Clear ownership → Clear boundaries:** Teams with defined responsibilities produce systems with clear module boundaries.

4. **Emergent complexity:** If your team is too autonomous and uncoordinated, the codebase becomes inconsistent and fragmented.

---

## Corollaries & Related Laws

### Mel Conway's Extension (1968)
> "The larger an organization, the more layers of management, and the more layers of software."

→ **Implication:** Adding managers doesn't speed up development; it adds coordination overhead.

### Martin Fowler's Observation (Microservices essay)
> "The microservice architectural style is an approach to developing a single application as a suite of small services, each running in its own process and communicating with lightweight mechanisms... **The microservice community favours an alternative approach: smart endpoints and dumb pipes.**"

→ **Implication:** Team autonomy (each service team owns their code) enables architectural independence.

### Fred Brooks' Observation (Mythical Man-Month)
> "Adding manpower to a late software project makes it later."

→ **Implication:** Coordination costs scale faster than productivity gains.

---

## What This Experiment Tests

This experiment is a **direct test of Conway's Law** in a controlled setting:

### Question
**Does team structure measurably affect code quality and delivery speed?**

### Hypothesis
A team with **clear specialist roles** (well-defined boundaries) will:
- Deliver faster (less rework, fewer conflicts)
- Produce higher quality (better design thinking upfront, better QA)
- Have less waste (fewer merge conflicts, reverted commits)
- Be clearer (better documented, better decision logging)

...than a team of **identical agents** with no ownership boundaries.

### Test Design
- **IV (Independent Variable):** Team structure (Specialists vs. Generics)
- **DVs (Dependent Variables):** Cycle time, quality, clarity, waste, user-value alignment
- **Control:** Identical tasks, identical starting code, identical tools, identical time budget

---

## Potential Confounds & Limitations

### Known Confounds

1. **Agent capability:** If specialist team has faster/smarter agents, specialists will win regardless of structure.
   - **Control:** Use agents from same pool (or document differences)

2. **Task selection:** If tasks don't require coordination, neither team structure will matter.
   - **Mitigation:** Tasks 01–05 are chosen specifically for interdependency (especially Task 04)

3. **Time budget:** If 8 hours is too short, both teams will be incomplete; if too long, both will finish easily.
   - **Target:** Budget should result in ~80% completion by both teams, requiring prioritization

4. **Tool bias:** JavaScript might favor one team structure over another.
   - **Mitigation:** JavaScript is neutral; any language would have similar results

### Unknowns

1. **Do agents self-organize?** Will generics naturally adopt specialist roles, negating the experiment?
   - **Prediction:** Unlikely at scale, but possible with 5 agents
   - **Mitigation:** Log observed roles in generics run

2. **How much does prior experience matter?** Will agents who've worked together have better coordination?
   - **Mitigation:** Prefer agents without prior shared context

3. **Is 12 hours enough?** Will either team discover issues only in production (post-run)?
   - **Mitigation:** This is a short-term experiment; longer runs would be different

---

## Related Research & Readings

### Academic
- **Conway, M. (1967).** "How do committees invent?" *Datamation*, April 1968. (Original paper)
- **Parnas, D. L. (1972).** "On the criteria to be used in decomposing systems into modules." *Communications of the ACM*.
  - Classic paper on modularity; argues structure should match expected change patterns

### Practitioner
- **Fowler, M. (2014).** "Microservices." *martinfowler.com*
  - Discusses how team structure enables architectural patterns
- **Brooks, F. P. (1995).** *The Mythical Man-Month* (Anniversary Edition)
  - Chapter 7: "Why Did the Tower of Babel Fail?" — on coordination overhead
- **Dunbar, R. (1998).** *Grooming, Gossip, and the Evolution of Language*
  - Suggests max stable group size (~150 people) based on cognitive limits

---

## Predictions (Optional Betting Pool)

For fun, here are tentative predictions:

| Metric | Specialist | Generic | Winner | Confidence |
|--------|---|---|---|---|
| Cycle time | 4.5 hr | 6 hr | Specialists | Medium |
| Test coverage | 88% | 78% | Specialists | Medium |
| Bugs (QA) | 3 | 8 | Specialists | Medium |
| Merge conflicts | 1 | 5 | Specialists | High |
| Documentation quality | Good | Fair | Specialists | High |
| Tasks completed | 5/5 | 4/5 | Specialists | Low |
| Final score | 4.2 | 3.3 | Specialists | Medium |

**Rationale:**
- Specialists should have fewer merge conflicts (clear ownership)
- Generics should find more bugs (less coordinated design)
- Cycle time gap narrows if generics discover conflicts early
- If generics self-organize, predictions may be wrong

---

## Follow-Up Experiments

If this experiment is successful, follow-ups could test:

1. **Scale:** What if the team is 10 specialists vs. 10 generics?
2. **Dynamics:** How do specialists perform with **unclear** ownership? Or generics with **assigned** roles?
3. **Duration:** Would a 40-hour sprint change the balance?
4. **Task complexity:** Would more complex tasks amplify the effect?
5. **Rematch:** Same teams, different tasks — does the structure win again?
6. **Role switching:** Generics adopt specialist roles mid-run — does performance improve?

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-02-13 | Saul | Initial Conway's Law notes |
