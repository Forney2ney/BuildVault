# BuildVault Capability Audit

Stage 1 deliverable. Source of truth: `toolkit/data/capability-catalog.json` (catalogVersion 2.0.0, generatedAt 2026-09-01), cross-checked against `toolkit/references/*` and the two schemas in `toolkit/schemas/`.

Status: **generation-time feasibility audit only**. No NAS device was contacted, no `cli.invoke` was executed, no Skill was written, and no static check has been run. Nothing here proves NAS runtime compatibility, upload, or installation.

---

## 1. Catalog facts that constrain every design decision

**Invocation model** (from `invocation`):
`cli.invoke --cli <CLI> --action <ACTION> -- <ACTION_OPTIONS>`

**Result envelope**:
- success: `{"ok": true, "data": {}}`
- failure: `{"ok": false, "error": {}}`

**Complete CLI -> expert map** (each CLI has exactly one owning agent; this is the only legal `delegate --target` value):

| CLI | Domain | Agent |
|---|---|---|
| `ug-filesystem` | file | `file-agent` |
| `ug-filemgr` | file | `file-agent` |
| `file-workflow` | file | `file-agent` |
| `ug-document` | document | `document-agent` |
| `ug-knowledge` | knowledge | `knowledge-agent` |
| `ug-photo` | album | `photo-agent` |
| `ug-video` | media | `media-agent` |
| `ug-music` | music | `media-agent` |
| `ug-surveillance` | monitor | `security-monitor-agent` |

**Enum values used throughout:**
- `effect`: `read` | `state-change` | `mixed`
- `approval`: `none` | `gateway` | `conditional` | `workflow`

**Verified unknowns (machine-checked over all 78 actions):**
- `permissions.knowledgeStatus` = `unknown` for every action
- `prerequisites.knowledgeStatus` = `unknown` for every action
- `errorCodes.knowledgeStatus` = `unknown` for every action
- `stability` = `unknown` for every action
- `example.outputStatus` = `unknown` for every action

Consequence: **exact error codes, prerequisites, stability guarantees, and output payload shapes are not published.** Only `name`, `description`, `parameters`, `effect`, `approval`, `returnSummary`, and `completionEvidence` are usable facts. Any statement beyond those would be invented.

**Completion truth rule** (`references/completion-and-errors.md`): only report a business result after the delegated expert returns `completed`. Report `failed`, `cancelled`, `waiting_user`, and `waiting_approval` as states, never as success. Preserve partial results; stop dependent work when required data is missing.

**Delegation rule** (`references/cli-usage-rules.md`, `references/expert-orchestration.md`, root `SKILL.md`): the parent Skill may use only `delegate --target <agent-id> --instruction '<task>'`. It must not execute `cli.invoke` directly, must not bypass approval, and must not claim NAS execution from local generation or static checks. Child experts select and execute their own CLI/Action workflows.

**Toolkit boundary** (root `SKILL.md`, `references/help.md`): the toolkit does not execute NAS business, does not upload to SkillHub, does not install Skills, and does not verify target-device runtime behavior.

---

## 2. Complete catalog inventory (all 9 CLIs, all 78 actions)

Machine-extracted from `data/capability-catalog.json`. `*` marks a required parameter.

### 2.1 Discovery and filesystem reads — `file-agent`

| Action | Effect | Approval | Required params | Other params | Returns |
|---|---|---|---|---|---|
| `find` | read | none | `path*` | `pattern`, `type` ∈ all\|dir\|file\|image\|video\|audio\|archive\|documents\|font\|application, `min-size`, `max-size`, `date-type` (0..3), `start-timestamp`, `end-timestamp`, `max-depth`, `limit` | files, real path, `fileId` |
| `ls` | read | none | `path*` | `recursive` (bool), `max-depth`, `limit` | directory listing, real path, `fileId` |
| `stat` | read | none | `path*` | — | real path, size, times |
| `getfattr` | read | none | `path*` | `field` | file attributes |
| `category` | read | none | — | `root-type` (1..9), `limit`, `permission` | files |
| `cat` | read | none | `path*` | `offset` (>=0), `length` (>=0) | file content |
| `md5sum` | read | none | `path*` | — | MD5 |
| `sha256sum` | read | none | `path*` | — | SHA-256 |

### 2.2 File management, tagging and organization — `file-agent`

| Action | Effect | Approval | Params | Returns |
|---|---|---|---|---|
| `ug-filemgr mediainfo` | read | none | `path*`, `intranet-share-id` | media metadata |
| `ug-filemgr scan-dedupe` | read | none | `path*` (repeatable), `scope` ∈ all\|documents\|images\|videos\|audio | duplicate report |
| `ug-filemgr tag-list` | read | none | none | tags |
| `ug-filemgr tag-get` | read | none | `tag-id*` (int) | tag |
| `ug-filemgr tag-get-by-name` | read | none | `name*` | tag |
| `ug-filemgr tag-get-file` | read | none | `path*` (repeatable) | tags on file |
| `ug-filemgr tag-filter` | read | none | `tag-id*` (repeatable), `path` (repeatable), `recursive` | files |
| `ug-filemgr tag-list-file` | read | none | `tag-id*` (int) | files for tag |
| `file-workflow get-user-dir` | read | none | none | `fileId`, real directory `path` |
| `file-workflow start` | read | none | `kind*` ∈ organize\|deduplication, `target*`, `lang`, `destination`, `by` ∈ type\|btime\|ctime\|mtime\|size\|image_resolution\|audio_duration\|video_duration\|video_resolution, `filter`, `type-rule`, `scope`, `keep-by` ∈ latest\|oldest | `id`, `status=planned`, `plan` |
| `ug-filemgr tag-add` | state-change | gateway | `tag-id*`, `colour` | tag created |
| `ug-filemgr tag-set` | state-change | gateway | `tag-id*` (int), `name`, `colour` | tag updated |
| `ug-filemgr tag-add-file` | state-change | **conditional** | `path*` (repeatable), `tag-id*` | tag applied to file |
| `ug-filemgr tag-delete-file` | state-change | **conditional** | `path*` (repeatable), `tag-id*` | tag removed from file |
| `ug-filemgr tag-delete` | state-change | gateway | `tag-id*` | tag deleted |
| `ug-filesystem mkdir` | state-change | gateway | `path*`, `mode`, `parents` | directory created |
| `ug-filesystem touch` | state-change | gateway | `path*`, `mode`, `content` | file created |
| `ug-filesystem echo` | state-change | gateway | `path*`, `content`, `write-mode` ∈ overwrite\|append\|patch, `offset` | file written |
| `ug-filesystem cpmv` | state-change | gateway | `src*`, `dst*`, `type` ∈ move\|copy, `action-type`, `overwrite` | move/copy done |
| `ug-filesystem rename` | state-change | gateway | `path*`, `old-name*`, `new-name*` | renamed |
| `ug-filesystem chtimes` | state-change | gateway | `path*`, `atime`, `mtime` | times changed |
| `ug-filesystem del` | state-change | gateway | `path*` | deleted, `final_path` |
| `ug-filesystem restore` | state-change | gateway | `path*` | restored from recycle |
| `ug-filesystem share-mkdir` | state-change | gateway | `volume*`, `folder-name*`, `quota-bytes`, `quota-unit`, `network-places-hide`, `no-permission-hide`, `enable-recycle`, `allow-only-admin-recycle` | share folder created |
| `file-workflow run` | state-change | workflow | `id*` (must equal `start.data.id`) | `id`, `status`, `total`, `succeeded`, `failed` |
| `file-workflow batch-move` | state-change | workflow | `data` (JSON), `actionType`, `root`, `renameBy`, `dateField` ∈ atime\|btime\|ctime\|mtime, `sourceDir`, `destination` | `status`, `total`, `succeeded`, `failed`, `renamedFiles`, `hasMore` |
| `file-workflow batch-del` | state-change | workflow | `paths*` (JSON string) | `status`, `total`, `succeeded`, `failed` |

### 2.3 Documents — `document-agent`

| Action | Effect | Approval | Required params | Other params | Returns |
|---|---|---|---|---|---|
| `page-count` | read | none | — | `file` (repeatable) | `items[].file`, `items[].page_count` |
| `metadata` | read | none | — | `file` (repeatable), `include-pages` (bool, default true), `directory-limit` (>=1, default 200) | document/directory metadata |
| `qa` | read | none | `query*` | `file` (repeatable), `intent` ∈ qa\|content_read\|extraction\|period\|condition\|comparison\|summary\|outline\|semantic_lookup\|locate_content, `content-scope` ∈ auto\|preview\|full, `top-k` (1..20), `entities` (repeatable), `answer-mode` ∈ direct\|list\|table\|prose, `evidence-mode` ∈ balanced\|focused\|broad, `max-files` (1..200, default 60), `body-cap` (>=1000) | answer, evidence, coverage |
| `extract` | read | none | `query*` | `file` (repeatable), `schema` ∈ auto\|invoice\|contract\|expense\|receipt\|medical-report\|purchase_order\|mixed\|mixed_reconciliation, `content-scope`, `max-files` (1..500, default 60), `body-cap`, `dedupe` (bool, default true) | data, coverage, failures |
| `reconcile` | read | none | — | `query`, `file` (repeatable), `max-files` (1..200, default 60) | comparison result, coverage |
| `translate` | **mixed** | **gateway** | — | `query`, `file` (repeatable), `target-lang`, `style`, `body-cap`, `max-files` (1..50, default 5), `extract-only` (bool), `content`, `source-title` | `mode`, `translation`, `output_file`, `target_lang`, coverage, sources, safety |
| `writing` | **mixed** | **gateway** | — | `query`, `file` (repeatable), `task` ∈ outline\|polish\|rewrite\|expand\|compress\|draft\|minutes, `style` ∈ professional\|formal\|concise\|friendly, `template`=`management-summary`, `content-scope`, `max-length` (>=1), `body-cap`, `max-files` (1..200, default 60), `extract-only` (bool), `content`, `source-title` | `mode`, `draft`, `output_file`, `task`, `processing_mode`, coverage, sources, safety |

### 2.4 Knowledge — `knowledge-agent`

| Action | Effect | Approval | Required params | Other params | Returns |
|---|---|---|---|---|---|
| `collect-evidence` | read | none | `query*` | `path` (repeatable), `extension` (repeatable), `full` (bool) | `evidence`, `sources`, `coverage`, `failures`/`warnings` |
| `answer-official` | read | none | `query*` | — | official NAS knowledge answer |
| `audio-transcription` | read | none | — | `path` (repeatable), `language`, `speak-count` (>=1) | `items[].transcriptText`, `transcriptRef`, `segments`, `sourceKind`, `sourcePath`, coverage, summary, failures, quality, warnings |
| `save-text` | state-change | **workflow** | — | `path`, `content`, `content-ref`, `filename-hint` | real `verified=true`, `outputFile`, `contentBytes` |

### 2.5 Photos and vision — `photo-agent`

| Action | Effect | Approval | Notable params | Returns |
|---|---|---|---|---|
| `vision-ocr` | read | none | `path` | OCR text |
| `vision-vlm` | read | none | `path`, `prompt`, `model`, `max-tokens`, `temperature`, `top-p` | vision result |
| `meta` | read | none | `path` (repeatable), `raw` | EXIF data, failures |
| `search-screen` | read | none | `category` ∈ screen\|figure\|pet\|scene\|card\|ocr\|location\|folder\|file\|album\|car-animal\|screen-custom\|custom, `keyword`, `path`, `location-level`, `index-id`, `class-index`, `file-type`, EXIF params, paging | search results, UUID/ID |
| `search-picture` | read | none | `album-uuid`/`album-name`/`album-type`, `figure-*`, `pet-*`, `ai-object-*`, `file-name-contains`, `ocr-contains`, `start-time`/`end-time`, `file-type` ∈ all\|image\|video\|gif\|live, EXIF params | photos + file identity |
| `search-classify` | read | none | `keyword`, `category` ∈ figure-pet\|file-image-recognition | people/pets |
| `search-hint` | read | none | `keyword`, `cover-total`, `record` | search hints |
| `albums` / `album-detail` | read | none | `keyword`, `album-select`, `album-type`, paging | album metadata |
| `figure-albums` / `object-albums` | read | none | `album-name`, `album-uuid`, `show-name` | album UUIDs |
| `health` | read | none | `domain` | service health |
| `create-album` and its 4 condition/baby/anniversary/custom variants | state-change | **workflow** | album-specific filters | album UUID |
| `timeline` | state-change | **workflow** | `start-time`, `end-time`, `group-by` ∈ month\|year, figure/pet/album/AI-object filters, EXIF params, `file-type` | `status` ∈ completed\|submitted\|partial\|blocked |

### 2.6 Media and surveillance — out of BuildVault scope

| Action | Effect | Approval | Why excluded |
|---|---|---|---|
| `ug-video search`, `ug-video control` | mixed / state-change | none | entertainment media library, not project evidence |
| `ug-video subtitle-search` | read | none | candidate subtitle listing only |
| `ug-video subtitle-download` | state-change | gateway | writes a file beside user video; not needed for BuildVault |
| `ug-music search`, `ug-music control` | mixed / state-change | none | music domain |
| `ug-surveillance` (all 8: `cameras`, `event-timeline`, `identity-resolve`, `event-evidence`, `faces`, `face-detail`, `vehicle-plates`, `vehicle-plate-detail`) | read | none | **Not** project monitoring. Despite `event-timeline` and `event-evidence` naming, these query surveillance camera events, faces and plates only. |

---

## 3. Evaluation against the original BuildVault workflow

| # | Workflow step | Verdict | Basis |
|---|---|---|---|
| 1 | Discover project files | **Supported** | `ug-filesystem find`/`ls`/`stat`/`getfattr`/`category`/`cat`/`md5sum`/`sha256sum`, `file-workflow get-user-dir` — all read, no approval |
| 2 | Read and extract document contents | **Partially supported** | `ug-document qa`/`extract`/`metadata`/`page-count`/`reconcile` exist (read, no approval) but are query-and-evidence shaped. No action returns verbatim full text of a PDF/DOCX. `cat` returns raw bytes; binary parsing is not a documented capability |
| 3 | Extract from images/media | **Partially supported, uncertain** | `ug-photo vision-ocr`/`vision-vlm`/`meta`, `ug-knowledge audio-transcription`, `ug-filemgr mediainfo`, `ug-video subtitle-search` exist. Album-index dependence, supported formats, prerequisites and error codes are all `unknown` |
| 4 | Record evidence and source references | **Partially supported** | `ug-knowledge collect-evidence` plus evidence fields in `ug-document qa`/`extract` return evidence, sources, coverage. **No structured per-milestone evidence store exists** — evidence survives only in returned payloads or must be persisted through an approved write |
| 5 | Reconstruct project timeline | **Not supported** | No timeline capability for arbitrary project documents. `ug-filesystem find` date filters and `stat` times are inputs, not reconstruction. `ug-photo timeline` is album photos; `ug-surveillance event-timeline` is surveillance |
| 6 | Classify milestones | **Not supported** | No classification capability. `ug-document extract` `schema` enums are invoice/contract/expense/receipt/medical-report/purchase_order/mixed/mixed_reconciliation — no project or milestone schema. Classification is Skill-defined reasoning |
| 7 | Prioritized next-step recommendations | **Not supported** | No recommendation capability. `ug-knowledge answer-official` answers official NAS product knowledge only |
| 8 | Save a report | **Supported with approval** | `ug-knowledge save-text` (workflow approval) or `ug-filesystem echo` (gateway approval). Every persistence action is state-change and gated |

Closest documented analog in the catalog's own guide is the **"contractinvoice"** scenario (`find` → `extract` → `tag-add-file` → `mkdir` → `cpmv`), whose boundary requires real documents, a confirmed scope, and no movement without confirmation.

---

## 4. Gap and uncertainty register

| Gap | Impact | Handling required |
|---|---|---|
| No full-text corpus retrieval | `qa`/`extract` are query-scoped with `evidence-mode`, `max-files`, `body-cap` caps | Surface `coverage`, `failures` and `warnings` to the user; never present partial coverage as complete |
| No timeline engine, no classifier, no recommender | 3 of 8 steps are inference | Label all such output as BuildVault reasoning over verified evidence, never as platform output |
| No structured evidence store | Evidence is per-response | Keep an evidence model in the Skill's working output; persist only via an approved write |
| `errorCodes`, `prerequisites`, `stability` all `unknown` for all 78 actions | No published failure semantics | Handle only the `ok:false` envelope and the five delegation states generically; do not invent an error taxonomy |
| Media extraction uncertain | Images/audio/video may not be readable | Treat media as optional and degradable; record "no media evidence available" rather than substituting |
| `find` `date-type` (0..3) semantics undocumented | Date filtering meaning unclear | Do not assume which timestamp is filtered; prefer `stat` for per-file times |
| All persistence gated by `gateway`/`workflow`/`conditional` approval | Cannot write silently | Present findings, get explicit approval, then delegate the write |
| Action parameter edge cases (`getfattr` example shows an undocumented `--all true`; `restore`/`del` examples show recycle-bin paths) | Possible undocumented parameters | Treat as unverified; the checker also forbids hidden parameters |
| No ZIP/snapshot, no CAD/STL parsing, no task/CRM, no cross-project knowledge base, no scheduling | Several long-term features have no catalog basis | Exclude from MVP; mark explicitly as unsupported rather than approximable |

---

## 5. Delegation and safety obligations carried into implementation

1. Parent Skill may only use `delegate --target <agent-id> --instruction '<task>'` — never `cli.invoke`, never approval bypass, never runtime claims from local generation.
2. Exactly one agent per CLI; use the mapping in section 1 verbatim.
3. Catalog `effect` and `approval` are generation-time facts; actual validation, approval, auditing and completion belong to the child workflow.
4. Report only after `completed`; treat `failed`/`cancelled`/`waiting_user`/`waiting_approval` as states; preserve partial results; stop dependents when required data is missing; handle empty results without inventing NAS data.
5. No credentials, manifests, sidecars, scripts, binaries or direct `cli.invoke` in the generated Skill.
6. The bundled `check-skill.mjs` (read-only, exit codes 0/1/2) validates delegate format and targets, `- <cli> -> <agent>` evidence lines, coverage of the five delegation states, and empty-result handling. Its `static-pass` status does **not** prove upload, installation, or NAS runtime compatibility.

