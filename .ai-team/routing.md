# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Architecture, scope, decisions, experiment design | Rusty | Stack choices, project structure, phase planning, experiment methodology |
| API, services, data, persistence | Basher | REST endpoints, database schema, data models, server setup |
| UI, CLI, user-facing surfaces | Linus | CLI commands, UI components, user experience, display formatting |
| Tests, quality, QA processes | Livingston | Unit tests, integration tests, test harness, edge cases, bug bash |
| Documentation, rubric, run harness docs | Saul | experiment.md, conway-notes.md, rubric, run plans, profiles |
| Code review | Rusty | Review PRs, check quality, suggest improvements |
| Session logging | Scribe | Automatic — never needs routing |

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn the tester to write test cases from requirements simultaneously.
