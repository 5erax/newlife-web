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
} from "../content/catalog";
import titles from "../content/titles.json" with { type: "json" };
import medals from "../content/medals.json" with { type: "json" };
import { CONTENT_VERSION } from "../engine/types";
import { validateContent } from "./content";
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
};
const manifest = {
  contentVersion: CONTENT_VERSION,
  sourceKind: "original_web",
  counts: validateContent(),
  status: "verified",
  note: "Nội dung tự viết; verified là schema, tham chiếu và fixture, không xác nhận dữ liệu Android hoặc QA điện thoại vật lý.",
  entries: Object.entries(groups).flatMap(([kind, list]) =>
    list.map((item) => ({
      id: item.id,
      kind,
      sourceKind: "original_web",
      version: CONTENT_VERSION,
      status: "verified",
      verification:
        kind === "stories"
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
  "# Đồ thị nội dung v1",
  "",
  `Có ${events.length} sự kiện trong pool: 150 thường + 144 nghề. Có ${fallbacks.length} dự phòng, được đếm riêng. Các nhánh khó đạt được kiểm bằng fixture; bot mô phỏng không bảo đảm gặp hết nghề.`,
  "",
  "## Chuỗi đời thường",
  "",
  "```mermaid",
  "flowchart LR",
];
for (const e of events)
  for (const c of e.choices)
    for (const o of c.outcomes) {
      if (o.nextEvent) graph.push(`  ${e.id} -->|cùng năm| ${o.nextEvent}`);
      if (o.schedule)
        graph.push(
          `  ${e.id} -->|sau ${o.schedule.afterYears} năm| ${o.schedule.eventId}`,
        );
    }
graph.push("```");
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
