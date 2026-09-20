import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
const root = resolve(import.meta.dirname, "../..");
const source = resolve(
  process.env.BIOSCAPE_MEDIA_OUTPUT || "/tmp/bioscape-media",
);
const destination = join(root, "public/media");
const ffmpeg = process.env.BIOSCAPE_FFMPEG || "ffmpeg";
mkdirSync(destination, { recursive: true });
const shots = readdirSync(source)
  .filter((name) => /^\d{2}-.+\.json$/.test(name))
  .sort()
  .map((name) => JSON.parse(readFileSync(join(source, name), "utf8")));
if (shots.length !== 11)
  throw new Error(`Expected 11 complete shots; found ${shots.length}`);
function run(args) {
  const result = spawnSync(
    ffmpeg,
    ["-hide_banner", "-loglevel", "warning", "-y", ...args],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status) throw new Error(`FFmpeg exited ${result.status}`);
}
for (const lang of ["en", "zh"]) {
  for (const shot of shots) {
    console.log(`Encoding ${shot.id}`);
    run([
      "-framerate",
      String(shot.fps),
      "-i",
      join(source, `${shot.id}-${lang}-frame-%05d.jpg`),
      "-frames:v",
      String(shot.frames),
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "17",
      "-pix_fmt",
      "yuv420p",
      "-an",
      join(source, `${shot.id}-${lang}.mp4`),
    ]);
  }
  const dissolve = 0.4;
  let duration = shots[0].frames / shots[0].fps;
  let previous = "0:v";
  const filters = [];
  for (let i = 1; i < shots.length; i++) {
    const next = `v${i}`;
    filters.push(
      `[${previous}][${i}:v]xfade=transition=fade:duration=${dissolve}:offset=${(duration - dissolve).toFixed(3)}[${next}]`,
    );
    duration += shots[i].frames / shots[i].fps - dissolve;
    previous = next;
  }
  filters.push(
    `[${shots.length}:a]atrim=duration=${duration.toFixed(3)},asetpts=PTS-STARTPTS,loudnorm=I=-20:TP=-2:LRA=8,afade=t=in:st=0:d=1.5,afade=t=out:st=${(duration - 3).toFixed(3)}:d=3[a]`,
  );
  console.log(`Finishing ${duration.toFixed(1)} second film`);
  run([
    ...shots.flatMap((shot) => ["-i", join(source, `${shot.id}-${lang}.mp4`)]),
    "-i",
    join(source, "score.wav"),
    "-filter_complex_threads",
    "2",
    "-filter_complex",
    filters.join(";"),
    "-map",
    `[${previous}]`,
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "21",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "30",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    "-metadata",
    "title=BioScape — A closer look at life.",
    "-metadata",
    "artist=Kun Qian",
    "-metadata",
    "copyright=2026 Kun Qian; BioScape Noncommercial License 1.0",
    join(destination, `bioscape-${lang}.mp4`),
  ]);
  writeFileSync(
    join(source, `film-${lang}-manifest.json`),
    JSON.stringify(
      {
        language: lang,
        duration,
        width: 1920,
        height: 1080,
        fps: 30,
        dissolve,
        shots,
      },
      null,
      2,
    ),
  );
  console.log(`Saved ${join(destination, `bioscape-${lang}.mp4`)}`);
}
