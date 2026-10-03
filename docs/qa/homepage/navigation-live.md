# Homepage navigation — actual browser verification

Date: 2026-10-03. Independent background CUA IAB tab 1, local dev server `http://127.0.0.1:5174/`. Native browser UI input, supported tab Back/Forward/reload, accessibility observations, screenshots, and public URL reads. No source edits, build, commit, user-tab changes, or viewport overrides.

## Passed live scenarios

- Empty base `/` and `#/` display the homepage. Plant model card entered the Plant cell scene. A directly opened captured deep shared URL entered Chloroplast with its serialized state, rather than landing on home.
- Plant cell → Chloroplast: zoom in, Exploded mode, labels on → home → Continue restored the exact pre-home URL. State included `mode:explode`, `labels:true`, and camera direction `[0.05084,0.0661,0.99652]`, target `[0,0,0]`, zoom `0.99403`.
- Browser Back from resumed Chloroplast returned to `#/`; Forward restored the exact captured Chloroplast URL.
- Chloroplast → Photosynthesis: chapter 05, progress `0.66`, speed `1.5`, annotations false, camera zoom `0.84` → home → Continue restored the exact URL. Visible controls confirmed chapter 05, 0:16 / 0:24, 1.5×, labels off.
- Immediate annotation toggle from false to true followed by homepage navigation, with no intervening observation, preserved `annotations:true` when resumed.
- Mitosis: select “One unattached kinetochore” and chapter 03 → home → Continue restored exact URL containing `progress:0.37` and `parameters:{attachment:unattached}`. Actual screenshot showed the rendered mitotic cell, selected chapter 03, and “Unattached kinetochore blocks anaphase” explanation.
- Homepage Compare two models: native drag on left animal cell and wheel zoom on right plant cell produced independent serialized views. Left direction `[-0.59865,0.76833,0.22646]`, zoom `1.0035`; right direction `[0.05084,0.0661,0.99652]`, zoom `0.69363`. Home → Continue restored the exact URL. Actual screenshot confirmed both models rendered.

## Observed narrow reload race

One native `click(Show labels)` immediately followed by `tab.reload()` in the same tool invocation, with no state observation between them, lost the latest Photosynthesis annotation toggle: previous `annotations:true` returned after the intended change to false. Fresh post-reload accessibility tree confirmed labels remained checked. Repeating with an accessibility observation between the click and reload preserved `annotations:false`. This is timing-sensitive evidence of a last-change/debounce race, not evidence that ordinary reload always loses state. Reported to integrator for fix and follow-up.

## Limits and interference

- This is representative navigation/state QA, not a full 84-process regression, performance gate, or deployed-site acceptance.
- Screenshot observations were made through CUA, but no screenshot file was persisted by this worker.
- Homepage language once changed from English to Chinese while the scene URL explicitly retained English. Other parallel QA tabs share localStorage; this was treated as possible cross-tab interference, not a confirmed product defect.
- Legacy hash variants without `/` and query-only share URLs were covered by the existing automated navigation suite, not separately exercised in this live pass.
- The exact comparison final-animation-frame micro-update race was not stress-tested; the settled independent views passed.

## Follow-up retest availability

The integrator requested three immediate click→reload repeats after a routing fix. On this worker's follow-up turn, creating a fresh background IAB tab reported `Browser is not available: iab`; one `cua.getState()` returned `browsers: []`. No post-fix browser repetitions were possible in this worker. The exact event sequence was handed to the routing worker and integrator; source repair must not be counted as live closure until another connected browser verifies it.
