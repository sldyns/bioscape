# Scientific audit, before further model edits

The user questioned DNA-like helices in the ribosomal translation scene and requests a complete global scientific/visual audit FIRST, then corrections. Prior visual refinement and technical smoke tests are NOT scientific approval. Audit other authors' models independently.

Phase A is READ-ONLY for product/model/test files. You may write only docs/science-audit/<assigned-group>.json and .md. Do not modify a model until root reconciles the full 84-model inventory and releases Phase B. Do not operate the browser. Local screenshots in /tmp/atlas-refinement/<id>.png show a representative frame; inspect with view_image when useful, but inspect code across EVERY stage, all controls and ALL declared root contexts as well.

For every assigned id:
1. Establish organism/specimen, compartment, input/output, molecular identities, biological direction, stoichiometry/energy (where relevant), order and causal dependencies. Identify teaching omissions that change meaning versus safe simplifications.
2. Trace actual geometry/helpers and update formulas, not userData alone. Look for fake organelle/protein topology, reversed strands, detached ends, duplicated molecules, wrong compartment, moving inactive entities, impossible lipid tails, membrane crossing, falsely universal species mechanisms, shell-like ribosomes, disconnected or DNA-looking RNA, and synthetic decorative folds presented as fact.
3. Compare BOTH zh/en stage text, intro, controls, labels, legends, metadata, root contexts and sources with actual animation. Check intermediate and end state. A disclaimer cannot cure a wrong geometry/motion.
4. Browse authoritative scientific evidence for nontrivial/niche claims. Prefer primary papers/structural datasets (RCSB/EMDB), official biology resources; actually open the cited source. Record exact supporting observation and URL. Never equate a title or source list with verification. No unsupported absolute guarantee of correctness.
5. Every id must have explicit verdict: confirmed_issue / qualified_pass / unresolved. Even a pass needs what was checked, evidence and remaining abstraction. Mark confidence. Do not invent defects just to fill a quota.
6. Each issue: stable issueId <group>-01 etc, severity P0/P1/P2 (P1 scientific falsehood/misleading causality/topology; P2 important annotation/ambiguity), file/line or object, exact code-derived evidence, biological source, concrete fix and a meaningful verification invariant. Distinguish fact error, misleading representation, scope, and technical problem.

JSON format:
{group, reviewer, models:[{id, roots:[], verdict, scope, checks:[...], sources:[{url,title,supports}], findings:[{issueId,severity,kind,file,location,evidence,whyWrong,fix,verification,sourceUrls:[]}], limitations:[], confidence:"high|medium|low"}]}

Markdown is concise human-readable findings by model. Inventory must cover every id in your assigned entries.js, including those with no confirmed error. Report final counts and top concerns to root. ROOT handles old secretion/transcription/photosynthesis/infection unless explicitly included. No new process IDs or science feature expansion. Preserve pending work of others.
