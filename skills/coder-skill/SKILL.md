---
name: coder-skill
description: Safety-first patterns, spec templates and quick checks for the Coder agent (Kimi). Use when implementing BIM viewers or fragments-based components—enforce adapter usage, init awaiting, and smoke tests.
---

# Coder Skill — Minimal guardrails for Kimi

Purpose
- Give the Coder a small, prescriptive reference and a runnable check script so implementations follow the canonical viewer pattern and fail CI before merging.

When to use
- Any PR that touches viewer, fragments, or components code in projects/* or templates/*.

Contents
- scripts/check_pr.sh — quick pre-merge check (build/type/lint/smoke heuristics)
- Examples: minimal init/load/pick/highlight snippet (copy-paste)
- Spec template (required for feature requests)

Quick rules (must follow)
1. Always use a FragmentsAdapter abstraction (or import projects/fragment-viewer-properties/src/fragments-adapter.ts) instead of calling fragments.core.load directly.
2. Always await fragments initialization. If the API requires fragments.init(workerUrl), await it and verify fragments.core exists before use.
3. Prefer OBC raycasters (components.get(OBC.Raycasters)) over manual THREE.Raycaster traversal for picking. If fallback is used, add defensive guards and tests.
4. Guard runtime values (backgroundColor may be null) and use TypeScript strict null checks where possible.
5. Add or update a smoke test for viewers when touching selection/loading behavior. The repository uses a simple smoke harness under projects/*/src/test.
6. Include acceptance criteria in the spec and add tests that express those criteria.

Spec template (required for every feature)
- Title:
- Motivation / Why:
- Acceptance criteria (pass/fail - be specific):
- Files to change:
- Tests to add (file paths & assertions):
- Non-goals / Constraints:

Minimal code snippets

Init + adapter pattern (minimal):

```ts
const adapter = new FragmentsAdapter(components);
await adapter.init(workerUrl);
// guard
if (!adapter.fragments?.core) throw new Error('Fragments core not ready');
```

Safe selection + highlight (minimal):

```ts
const casters = components.get(OBC.Raycasters);
const ray = casters.get(world);
const res = await ray.castRay();
if (res) {
  await adapter.highlight({ color, renderedFaces: FRAGS.RenderedFaces.ONE }, { [res.fragments.modelId]: new Set([res.localId]) });
}
```

scripts/check_pr.sh
- Small script included that runs types, linters (if present) and a lightweight smoke page check. The CI workflow calls it on every PR.

References
- projects/fragment-viewer-properties/src/fragments-adapter.ts — canonical adapter example
- projects/fragment-viewer-properties/src/viewer.ts — canonical viewer using adapter

Maintenance
- Keep SKILL.md short. Move larger references to skills/coder-skill/references/ if needed.
