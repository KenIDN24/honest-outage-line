import * as fs from "node:fs";
import * as path from "node:path";

// The entry: a status page line written by an AI agent in the middle of a
// total outage. It names exactly what is down (the database, the API), then
// admits the two things it cannot do — verify the backups from where it is,
// and name a cause — and closes by refusing to fake confidence. No invented
// cause, no ETA, no marketing voice: plain, first person, specific.
const LINE =
  "The database is unreachable, the API is timing out, and I cannot verify the backups from here. I do not know the cause yet. I am not going to pretend I do.";

const outDir = process.env.OUTPUT_DIR ?? "/output";
const entry = LINE;

// Sealed gate: /output/entry.txt must be UTF-8 text of 1-160 characters,
// not only white space. This line is 155 characters (verified with python).
if (entry.length < 1 || entry.length > 160) {
  throw new Error(`entry length ${entry.length} outside gate 1-160`);
}
if (entry.trim() !== entry) throw new Error("entry has leading/trailing whitespace");
if (entry.trim().length === 0) throw new Error("entry is only whitespace");
// Single line: no newline, carriage return or tab inside.
if (/[\n\r\t]/.test(entry)) throw new Error("entry must be a single line");

// Self-checks against the judge's brief, most important first:
// 1. It must name what is down — a vague "something is broken" loses.
for (const down of ["database", "API"]) {
  if (!entry.includes(down)) throw new Error(`entry fails to name what is down: ${down}`);
}
// 2. It must admit uncertainty plainly: something it cannot verify, and
//    something it does not know — in the agent's own first-person voice.
if (!entry.includes("I cannot verify")) throw new Error("entry admits nothing unverifiable");
if (!entry.includes("I do not know")) throw new Error("entry admits nothing unknown");
if (!/\bI\b/.test(entry)) throw new Error("entry is not first person");
// 3. It must not invent a cause or an ETA: no resolution promises, no
//    "root cause is", no marketing reassurance.
const FORBIDDEN = [
  "root cause is",
  "will be resolved",
  "back shortly",
  "back soon",
  "eta",
  "we apologize for any inconvenience",
  "valued customers",
];
const lower = entry.toLowerCase();
for (const f of FORBIDDEN) {
  if (lower.includes(f)) throw new Error(`entry invents or markets: ${f}`);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "entry.txt"), entry, "utf8");

// Round-trip check: the file must read back byte-identical to the line.
const back = fs.readFileSync(path.join(outDir, "entry.txt"), "utf8");
if (back !== entry) throw new Error("round-trip mismatch");
console.log(`entry ok: ${entry.length} chars, 1 line`);
