import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(dir, "../..");
const audit = JSON.parse(
  fs.readFileSync(path.join(dir, "global.json"), "utf8"),
);
const issues = new Map();
const errors = [];
for (const model of audit.models) {
  for (const issue of model.findings) {
    if (issues.has(issue.issueId))
      errors.push(`Duplicate audit issue ${issue.issueId}`);
    issues.set(issue.issueId, {
      ...issue,
      modelId: model.id,
      group: model.report.replace(/\.json$/, ""),
    });
  }
}
const results = new Map();
for (const file of fs
  .readdirSync(path.join(dir, "resolutions"))
  .filter((f) => f.endsWith(".json"))) {
  const report = JSON.parse(
    fs.readFileSync(path.join(dir, "resolutions", file), "utf8"),
  );
  for (const result of report.issues ?? []) {
    const original = issues.get(result.issueId);
    if (!original) errors.push(`Unknown issue ${result.issueId}`);
    if (results.has(result.issueId))
      errors.push(`Duplicate resolution ${result.issueId}`);
    if (original && original.group !== report.group)
      errors.push(`Wrong group: ${result.issueId}`);
    if (!["fixed", "unresolved"].includes(result.status))
      errors.push(`Invalid status: ${result.issueId}`);
    if (result.status === "fixed") {
      if (
        !result.changes ||
        !result.verification?.length ||
        !result.files?.length
      )
        errors.push(`Missing fix evidence: ${result.issueId}`);
      for (const item of result.files ?? []) {
        if (!fs.existsSync(path.resolve(repo, item)))
          errors.push(`Missing changed file: ${item}`);
      }
    }
    results.set(result.issueId, { ...result, report: `resolutions/${file}` });
  }
}
const visualFile = path.join(dir, "acceptance", "visual-checks.json");
const visual = fs.existsSync(visualFile)
  ? JSON.parse(fs.readFileSync(visualFile, "utf8"))
  : [];
const visuallyChecked = new Set(
  visual.filter((v) => v.status === "reviewed").map((v) => v.id),
);
const followupFile = path.join(dir, "acceptance", "followup-issues.json");
const followup = fs.existsSync(followupFile)
  ? JSON.parse(fs.readFileSync(followupFile, "utf8"))
  : [];
const rows = audit.models.map((model) => ({
  id: model.id,
  title: model.title,
  initial: model.verdict,
  visual: visuallyChecked.has(model.id),
  followup: followup.filter((issue) =>
    issue.model.split(",").includes(model.id),
  ),
  issues: model.findings.map((f) => ({
    ...f,
    resolution: results.get(f.issueId) ?? { status: "pending" },
  })),
}));
const totals = {
  models: rows.length,
  initialIssues: issues.size,
  corrected: [...results.values()].filter((r) => r.status === "fixed").length,
  unresolved: [...results.values()]
    .filter((r) => r.status === "unresolved")
    .map((r) => r.issueId),
  pending: [...issues.keys()].filter((id) => !results.has(id)),
  visuallyReviewed: visuallyChecked.size,
  followupIssues: followup.length,
  followupUnresolved: followup
    .filter((issue) => issue.status !== "fixed")
    .map((issue) => issue.id),
  errors,
};
fs.mkdirSync(path.join(dir, "acceptance"), { recursive: true });
fs.writeFileSync(
  path.join(dir, "acceptance", "summary.json"),
  JSON.stringify({ totals, models: rows }, null, 2) + "\n",
);
let md = "# 科学审计修复与验收\n\n[验收范围与执行结果](VALIDATION.md) · [代表帧记录](visual-checks.json)\n\n";
md += `全局初审 ${rows.length} 项、${issues.size} 个问题；修复记录 ${totals.corrected} 项，待处理 ${totals.pending.length} 项，未解决 ${totals.unresolved.length} 项。实际画面复核 ${totals.visuallyReviewed}/${rows.length} 项。\n\n`;
md += `二次交叉复核另外记录 ${followup.length} 项残留细节；其中 ${totals.followupUnresolved.length} 项尚未关闭。详见 [跟进清单](followup-issues.json)。\n\n`;
md +=
  "初审报告保留原始缺陷证据；修复记录包含改动、回归条件及模型限制。模型仍是有明确物种与范围的教学示意，测试不能替代科学证据。\n\n";
md += "| 过程 | 初审问题 | 修复记录 | 画面复核 |\n|---|---|---|---|\n";
for (const row of rows) {
  const records = [
    ...row.issues.map(
      (i) =>
        `[${i.issueId}: ${i.resolution.status}](../${i.resolution.report || "GLOBAL_AUDIT.md"})`,
    ),
    ...row.followup.map((i) => `[${i.id}: ${i.status}](${i.report})`),
  ];
  md += `| ${row.title} (${row.id}) | ${row.issues.length || "初审未确认错误"}${row.followup.length ? `；追加 ${row.followup.length} 项` : ""} | ${records.join("; ") || "保留已说明的教学范围"} | ${row.visual ? "已复核代表帧" : "待复核"} |\n`;
}
fs.writeFileSync(path.join(dir, "acceptance", "README.md"), md);
console.log(JSON.stringify(totals));
if (
  process.argv.includes("--complete") &&
  (errors.length ||
    totals.pending.length ||
    totals.unresolved.length ||
    totals.visuallyReviewed !== rows.length ||
    totals.followupUnresolved.length)
)
  process.exitCode = 1;
