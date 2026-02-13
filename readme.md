# Cooperation Over Competition: A Conway's Law Experiment

**An AI agent team experiment testing whether specialist ownership produces better architecture than generic, interchangeable agents.**

---

## The Question

Does team structure affect software architecture—even with AI agents?

Melvin Conway's 1967 observation states: *"Any organization that designs a system will produce a design whose structure is a copy of the organization's communication structure."*

This repo tests whether **specialist roles with clear ownership** (Coordinator, API/Backend, Database, CLI/UX, QA, Docs) outperform **generic, interchangeable agents** (5 identical agents, no boundaries) when building the same software under the same constraints. Both teams execute 5 tasks on a minimal Task Board API, starting from identical baselines.

---

## Results

**Specialists: 4.80/5 | Generics: 4.45/5**

| Metric | Specialist | Generic | Difference |
|--------|-----------|---------|-----------|
| **Test count** | 102 | 108 | Generics wrote 6 more tests (not always better) |
| **Lines of code** | 1,345 | 1,600 | **Generics produced 19% more code** |
| **Code clarity** | 4/5 | 3/5 | Consolidation beats fragmentation |
| **Waste** | 5/5 (zero conflicts) | 4/5 | Specialist ownership reduced overhead |
| **Task completion** | 5/5 | 5/5 | Both finished all tasks |

**Key Finding:** Specialist ownership produced **19% less code with better architecture coherence**. The specialist team maintained a unified task model; the generic team fragmented it across separate modules, creating the kind of boundary-multiplication Conway's Law predicts.

---

## How It Works

Both teams start from an Express + SQLite baseline (29 passing tests) and execute 5 sequential tasks:

1. **Task 01 – Filtering** — Add status and text search to tasks
2. **Task 02 – Priorities** — Add priority field, schema migration, sort API
3. **Task 03 – Bulk Operations** — Implement transaction-based bulk delete/update
4. **Task 04 – Audit History** — Append-only log of all mutations
5. **Task 05 – Export/Import** — JSON export and import with validation

### Two Team Structures

**Specialists Mode:**
- 6 defined roles (Lead Coordinator, Backend Dev, Database Dev, CLI/UX Dev, QA/Test, Docs/Release)
- Clear ownership: "Backend Dev owns all API routes," "Database Dev owns schema"
- Formal coordination: Tasks assigned by Coordinator; blockers escalated
- Strict boundaries: "Do not edit Database schema without Database Dev"

**Generics Mode:**
- 5 identical agents with no roles
- No ownership: Any agent can work on any file
- Async coordination: Agents pick work first-come-first-served
- No boundaries: Agents edit where needed, resolve conflicts peer-to-peer

### Execution
Both teams work linearly through tasks (no parallelism) to ensure a fair comparison. Each task becomes a git PR. All code is tested before merge.

---

## Repo Structure

```
.
├── app/                              # Runnable Task Board API (Express + SQLite)
│   ├── src/
│   │   ├── index.js                  # Express server & API routes
│   │   ├── db.js                     # SQLite setup & schema
│   │   └── models/task.js            # Task model & business logic
│   ├── cli/taskboard.js              # CLI client
│   ├── tests/                        # Automated tests
│   ├── package.json
│   └── README.md                     # API documentation
│
├── tasks/                            # Task definitions (5 files)
│   ├── 01-filtering.md
│   ├── 02-priorities.md
│   ├── 03-bulk-operations.md
│   ├── 04-audit-history.md
│   └── 05-export-import.md
│
├── rubric/                           # Evaluation criteria
│   └── rubric.md                     # Scoring methodology (0–5 per dimension)
│
├── runs/                             # Execution harness & results
│   ├── results.md                    # ⭐ Final scores and analysis
│   ├── specialists/                  # Specialist run branch artifacts
│   └── generics/                     # Generic run branch artifacts
│
├── squad/                            # Team profiles & rules
│   ├── profiles/
│   │   ├── specialists.md            # 6 roles, ownership, boundaries
│   │   └── generics.md               # 5 identical agents, no ownership
│   └── rules.md                      # Git hygiene, branching, tests required
│
├── docs/                             # Experiment design & theory
│   ├── experiment.md                 # Hypothesis, methodology, design
│   └── conway-notes.md               # Conway's Law analysis
│
└── readme.md                         # This file

```

---

## Run the App

### Quick Start

```bash
cd app
npm install
npm start
```

The API starts on `http://localhost:3000`. 

### CLI Client

```bash
node cli/taskboard.js
```

### Run Tests

```bash
npm test
```

Output: `102/102 tests passing` (specialist baseline) or `108/108` (generic baseline after their changes).

---

## Explore the Results

### See the Full Analysis

👉 **[`runs/results.md`](runs/results.md)** — Detailed scoring, rubric application, Conway's Law findings, and evidence artifacts.

### See the Code

- **Specialist branch:** `run/specialists` (5 clean commits from baseline `638e0eb`)
- **Generic branch:** `run/generics` (5 commits with more files and 255 extra lines)

Both branches are in the same repo; switch to compare:
```bash
git checkout run/specialists
git log --oneline | head -6   # See the 5 specialist commits

git checkout run/generics
git log --oneline | head -6   # See the 5 generic commits
```

### Diff the Outcomes

```bash
git diff run/specialists..run/generics -- app/src/models/
# See: specialist's consolidated task.js vs. generic's split into auditLog.js
```

---

## Key Findings (Conway's Law in Action)

1. **Specialist ownership produces architectural coherence.** The specialist team had one backend developer who consolidated all model changes into `task.js`. The generic team, lacking ownership, naturally split audit logging into a separate module — team boundaries became code boundaries.

2. **Generics write 19% more code for the same functionality.** Without shared vision, agents independently solved similar problems, resulting in ~255 extra lines (1,600 vs. 1,345). Not wrong code, but structural overhead.

3. **Test organization reflects team structure.** Specialists wrote 3 test files (model, API, export). Generics wrote 5 (each agent created their own), fragmenting test organization.

4. **Specialist clarity wins.** With one backend dev, API design is consistent. With 5 agents, slight style variations emerge and decisions go undocumented (no shared decision log).

5. **The gap compounds over time.** For 5 tasks, the difference is modest (4.80 vs 4.45). In a 50-task project, architectural fragmentation and context-switching overhead would compound significantly.

---

## How This Was Built

**Entirely by AI agents using the [Squad agent orchestration system](https://github.com/bradygaster/squad).** No human-written code in the app, routes, or tests — the agents designed, implemented, and evaluated themselves.

- **Specialist team orchestration:** 6 agents operating under defined roles and ownership constraints
- **Generic team orchestration:** 5 identical agents working asynchronously with no boundaries
- **Evaluator:** Copilot CLI (same agent that executed the experiment)

This makes the experiment itself an artifact: proof that Conway's Law applies to AI agent teams just as it does to human teams.

---

## Learn More

- **[Experiment Design](docs/experiment.md)** — Detailed hypothesis, methodology, and how we kept the comparison fair
- **[Rubric](rubric/rubric.md)** — Full scoring criteria and evidence collection method
- **[Task Definitions](tasks/)** — The 5 tasks with acceptance criteria and constraints
- **[Team Profiles](squad/profiles/)** — Specialist roles and generic structure

---

## Cite This Work

If you reference this experiment, cite it as:

> **Cooperation Over Competition: A Conway's Law Experiment with AI Agents**  
> Baseline: Express + SQLite task board API (29 tests)  
> Two runs: Specialist team (6 roles) vs. Generic team (5 interchangeable agents)  
> Final scores: Specialists 4.80/5, Generics 4.45/5  
> Evaluator: GitHub Copilot CLI (Squad orchestration)  
> 2025-02-18

---

## License

MIT. The code in `/app` and the experiment design are provided as-is for research and education.

---

**Questions? Issues?** Open an issue or check [GitHub Discussions](https://github.com/bradygaster/CooperationOverCompetition/discussions).
