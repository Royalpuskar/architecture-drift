# Architecture Drift

Audit a declared module dependency graph against allowed layer boundaries.

**Status:** implemented browser-local research prototype. Automated tests can be reproduced with the command below. The existing Pages site previously passed smoke checks. The cycle-analysis update is locally tested; its latest deployment and browser behavior have not been verified.

## Website

Live website: https://royalpuskar.github.io/architecture-drift/

## Problem and approach

Maintainers need to inspect both layer-boundary violations and circular module coupling. Individually allowed imports may still form a cycle. This tool reports those two properties separately using the supplied directed import graph. It runs the same pure JavaScript engine in the browser and Node tests. All input is provided by the user or the included synthetic fixture; no external facts are inferred.

## Implemented features

- Editable scenario with a synthetic example and reset control.
- Deterministic analysis, summary metrics, filterable result table, and JSON report export.
- Input validation, explicit errors, and invalidation of outdated reports after edits.
- Keyboard-accessible controls, responsive layout, and large-screen CSS.
- Zero runtime dependencies and no external API calls.

## Install and run

Requirements: Python 3 for a static local server, Node.js 22 or later for tests.

```sh
git clone https://github.com/Royalpuskar/architecture-drift.git
cd architecture-drift
python3 -m http.server 8000
```

Open http://localhost:8000. Do not open index.html through a file URL; ES modules require a server.

```sh
node --test test.mjs
```

## Example and schema

The complete example in `sample.mjs` defines the supported input shape:

```json
{
  "layers": {
    "view": "ui",
    "service": "domain",
    "db": "data"
  },
  "allowed": [
    {
      "from": "ui",
      "to": "domain"
    },
    {
      "from": "domain",
      "to": "data"
    }
  ],
  "imports": [
    {
      "from": "view",
      "to": "service"
    },
    {
      "from": "view",
      "to": "db"
    }
  ]
}
```

Edit one value and select **Run analysis**. **Reset example** restores the fixture. **Export report** downloads the current result; it never publishes it.

Input is capped at 200,000 serialized characters, arrays processed by the engine at 500 elements, and numeric magnitudes at 1e12. Domain constraints are checked inside `engine.mjs`; unsupported structures return an error.

## Circular dependency evidence

The report now includes `cycles`, a list of cyclic strongly connected groups. Members of each group can all reach one another through supplied imports. Singleton groups are included only when they have a self-import. Duplicate edges do not duplicate groups; one-way bridges do not merge groups.

```json
{"layers":{"a":"domain","b":"domain"},"allowed":[],
"imports":[{"from":"a","to":"b"},{"from":"b","to":"a"}]}
```

Expected result: zero forbidden edges, one cycle group with members a and b, and witness `["a","b","a"]`. A cycle is diagnostic evidence, not automatically a layer-policy violation.

Each witness is a real, nonempty closed import path. It is the shortest return path from the lexically first member, with sorted-neighbor tie breaking; it is not necessarily the shortest cycle anywhere in the group, nor a path visiting every member. Members and groups are deterministically ordered. All supplied edges participate, including forbidden edges and edges with unmapped endpoints; unmapped modules remain flagged in the original rows.

The implementation computes reachability with breadth-first traversal, groups mutually reachable modules, then finds one return-path witness per cyclic group. With V endpoint modules and E distinct edges, reachability takes O(V(V+E)) time and O(V²+E) space. Input remains bounded at 500 import edges. This is not an enumeration of every simple cycle.

## Architecture and request flow

`index.html` loads `app.mjs`, which parses scenario JSON and calls `run` from `engine.mjs`. The engine returns `metrics` and `rows`; the UI renders values with `textContent`, never user-supplied HTML. Editing invalidates the prior report. Export creates a local Blob download.

There is no application authentication, credential store, session cookie, or token lifecycle. GitHub Pages serves public static files. The app does not collect passwords or API keys, contact third-party APIs, persist inputs, or send scenario data over the network. GitHub hosting can still receive ordinary page request metadata. Reloading discards edits.

## Limitations

Audits supplied import edges, not source code parsing. Dynamic imports and real repository discovery remain future work.

The interface shares a portfolio design system, while this repository has its own domain engine, fixture, and tests. No accuracy, novelty, production-readiness, or 4K visual-test claim is made. Large-screen CSS is not a substitute for device testing.

## Validation

Eight local Node tests pass for this update. They cover allowed-edge cycles, self-imports, unmapped modules, duplicate edges, one-way bridges, deterministic ordering, and existing boundary behavior. An independent transitive-closure matrix checks all 512 directed graphs on three nodes, including self-loops, for cyclic node membership and valid witness edges. This bounded exhaustive experiment is not proof for arbitrary graphs. Mobile, laptop, and 3840×2160 browser checks have not been performed for this update.

`test.mjs` checks domain outcomes and edge cases, deterministic behavior, input preservation, malformed roots, and size limits. GitHub Actions runs the same suite. Review the tests themselves to see exactly what is covered; passing these checks does not establish security or exhaustive correctness.

## Roadmap

- Add more independently reviewed domain fixtures and explicit schema documentation.
- Add domain-specific form controls alongside the JSON editor.
- Expand accessibility and mobile browser testing.
- Revisit the documented domain limitations before production use.

## Contribution and license

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [LICENSE](LICENSE).

© 2026 Puskar (Royalpuskar). All rights reserved except permissions granted by the MIT license. Preserve applicable third-party notices.

