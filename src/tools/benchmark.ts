import { performance } from "node:perf_hooks";
import { cpus, platform } from "node:os";
import { newLife, reduce } from "../engine/game";
import { addLog, makePerson, createAsset } from "../engine/helpers";
const s = newLife({
  name: "An",
  gender: "other",
  hometown: "Huế",
  birthDate: "2000-01-01",
  seed: 42,
});
s.age = 35;
s.money = 100000000000;
for (let i = 0; i < 1000; i++)
  addLog(s, "Một dòng nhật ký đủ dài để đo trường hợp lịch sử nhiều năm.");
for (let i = 0; i < 100; i++) s.relations.push(makePerson(s, "friend", 35));
for (let i = 0; i < 40; i++) createAsset(s, "asset_xe_01");
const times: number[] = [];
for (let i = 0; i < 300; i++) {
  const start = performance.now();
  reduce(s, { type: "age" });
  times.push(performance.now() - start);
}
times.sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      platform: platform(),
      cpu: cpus()[0].model,
      runtime: process.version,
      iterations: times.length,
      log: s.log.length,
      relations: s.relations.length,
      assets: s.assets.length,
      p50Ms: times[150],
      p95Ms: times[285],
      maxMs: times.at(-1),
      note: "Engine chạy trong Node trên máy Windows này; không thay phép đo tương tác trên điện thoại.",
    },
    null,
    2,
  ),
);
