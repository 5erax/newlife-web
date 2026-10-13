import { writeFileSync, mkdirSync } from "node:fs";
import {
  events,
  fallbacks,
  activities,
  jobs,
  education,
  assets,
  achievements,
  stories,
  apkEvents,
  apkJobs,
  apkEducation,
} from "../content/catalog";
import titles from "../content/titles.json" with { type: "json" };
import medals from "../content/medals.json" with { type: "json" };
import { CONTENT_VERSION } from "../engine/types";
import { validateContent } from "./content";
import { branchStats } from "./branch-analysis";
import { expandCases } from "../engine/branches";
import type { Choice } from "../engine/types";
import investments from "../content/investments.json" with { type: "json" };
import apkCoins from "../content/apk/coins.json" with { type: "json" };
const groups = {
  lifeEvents: events.filter((e) => e.group !== "career"),
  careerEvents: events.filter((e) => e.group === "career"),
  fallbacks,
  activities,
  jobs,
  education,
  assets,
  achievements,
  stories,
  titles,
  medals,
  investments,
  apkEvents,
  apkJobs,
  apkEducation,
  apkCoins,
};
const manifest = {
  contentVersion: CONTENT_VERSION,
  sourceKind: "mixed",
  counts: validateContent(),
  status: "verified",
  note: "Tách nội dung tự viết và bản dịch APK. verified xác nhận schema, tham chiếu và fixture; chưa xác nhận toàn bộ runtime Android, công thức native hoặc QA điện thoại vật lý.",
  entries: Object.entries(groups).flatMap(([kind, list]) =>
    list.map((item) => ({
      id: item.id,
      kind,
      sourceKind: kind.startsWith("apk") ? "apk_translation" : "original_web",
      version: CONTENT_VERSION,
      status: "verified",
      verification: kind.startsWith("apk")
        ? "tests/apk-port.test.ts"
        : kind === "stories"
          ? "tests/systems.test.ts"
          : kind === "jobs"
            ? "tests/systems.test.ts"
            : kind === "titles"
              ? "tests/content.test.ts"
              : "tests/catalog-flows.test.ts",
    })),
  ),
};
writeFileSync(
  "src/content/manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
mkdirSync("docs/content", { recursive: true });
const graph = [
  "# Đồ thị nội dung v1.2",
  "",
  `Có ${events.length} sự kiện trong pool, ${fallbacks.length} dự phòng và ${investments.length} sản phẩm đầu tư khởi đầu. Các nhánh khó đạt được kiểm bằng fixture; bot mô phỏng không bảo đảm gặp hết nghề.`,
  "",
  "## Chuỗi đời thường",
  "",
  "```mermaid",
  "flowchart LR",
];
function transitions(id: string, choices: Choice[]) {
  for (const c of choices)
    for (const o of expandCases(c)) {
      if (o.nextEvent) graph.push(`  ${id} -->|cùng năm| ${o.nextEvent}`);
      if (o.schedule)
        graph.push(
          `  ${id} -->|sau ${o.schedule.afterYears} năm| ${o.schedule.eventId}`,
        );
      if (o.choices) transitions(id, o.choices);
    }
}
for (const e of events) transitions(e.id, e.choices);
graph.push("```");
const stats = branchStats();
writeFileSync(
  "docs/content/branch-trees.json",
  JSON.stringify(stats, null, 2) + "\n",
);
graph.push(
  "",
  `Có ${stats.chains} chuỗi, trung bình ${stats.averageLeaves} lá/sự kiện, ${stats.nestedPercent}% sự kiện có lựa chọn lồng.`,
  "",
  "Kiểm tra điều kiện bất khả thi bao phủ mâu thuẫn cờ, xuất thân và khoảng số trực tiếp. Không phải chứng minh SAT cho mọi tổ hợp any/not. Báo cáo nhánh chưa gặp và nhánh hiếm nằm trong docs/qa/branch-coverage.json.",
);
for (const e of events) {
  graph.push("", `## ${e.id}`, "", "```mermaid", "flowchart TD");
  let serial = 0;
  function tree(choices: Choice[], parent: string) {
    for (const c of choices) {
      const choice = `n${serial++}`;
      graph.push(`  ${parent} --> ${choice}["${c.id}"]`);
      expandCases(c).forEach((o, index) => {
        const node = `n${serial++}`;
        graph.push(
          `  ${choice} --> ${node}["case ${index}; trọng số ${o.weight}${o.choices ? "" : "; kết thúc"}"]`,
        );
        if (o.choices) tree(o.choices, node);
      });
    }
  }
  tree(e.choices, "root");
  graph.push("```");
}
for (const story of stories) {
  graph.push("", `## ${story.name}`, "", "```mermaid", "flowchart LR");
  for (const node of story.nodes) {
    graph.push(`  ${node.id}["${node.ending?.name ?? node.id}"]`);
    for (const c of node.choices) graph.push(`  ${node.id} --> ${c.next}`);
  }
  graph.push("```");
}
writeFileSync("docs/content/graph.md", graph.join("\n") + "\n");
console.log(
  JSON.stringify(
    { entries: manifest.entries.length, storyNodes: 60, endings: 15 },
    null,
    2,
  ),
);
