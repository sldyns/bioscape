import fs from "node:fs";
import { build } from "esbuild";
import { processCatalog, processesByRoot } from "../../../src/processes/catalog.js";
const original = { secretion: "secretionProcess.js", transcription: "transcriptionProcess.js", photosynthesis: "photosynthesisProcess.js", infection: "phageProcess.js" };
const models = [];
for (const entry of Object.values(processCatalog)) {
  const file = original[entry.id] || entry.module.replace(/^\.\//, "");
  const bundle = await build({entryPoints:[new URL(`../../../src/processes/${file}`, import.meta.url).pathname],bundle:true,write:false,platform:"node",format:"esm",packages:"external",logLevel:"silent"});
  const bundledPath = new URL("evidence/.inventory-module.mjs", import.meta.url);
  fs.writeFileSync(bundledPath, bundle.outputFiles[0].text);
  const definition = (await import(`${bundledPath.href}?id=${entry.id}`)).default;
  const roots = Object.entries(processesByRoot).filter(([, ids]) => ids.includes(entry.id)).map(([root]) => root);
  const contexts = roots.map(root => {
    const contextual = { ...definition, ...definition.contexts?.[root] };
    let combinations = [{}];
    for (const control of contextual.controls || []) combinations = combinations.flatMap(current => control.options.map(option => ({...current, [control.id]:option.value})));
    return {root, stages:contextual.stages.map(stage=>stage.at), controls:contextual.controls || [], combinations};
  });
  models.push({id:entry.id, group:original[entry.id]?"original":file.split("/")[1], file:`src/processes/${file}`, duration:definition.duration, roots, contexts});
}
const summary = {models:models.length, groups:new Set(models.map(m=>m.group)).size, rootContexts:models.reduce((n,m)=>n+m.roots.length,0), contextConditionCases:models.reduce((n,m)=>n+m.contexts.reduce((s,c)=>s+c.combinations.length,0),0)};
fs.writeFileSync(new URL("inventory.json", import.meta.url), JSON.stringify({baseline:"be81aa5ac4e2ed05ed057fbbdd5dade930188ec0", summary, models},null,2)+"\n");
console.log(JSON.stringify(summary));
fs.unlinkSync(new URL("evidence/.inventory-module.mjs", import.meta.url));
