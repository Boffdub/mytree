// Regenerates data/questions.js from the team's question spreadsheet.
//
// Run with: node scripts/importQuestionsFromCsv.js
//
// Source of truth is "Climate Questions MASTER SHEET - Accumulative.csv" in the
// project root (exported from Google Sheets/Excel as CSV). Re-run this any time
// the sheet is updated - it fully regenerates data/questions.js from the CSV, so
// don't hand-edit that file directly or your edits will be overwritten.
//
// IDs are assigned by CSV row order (1-indexed). Re-running after only adding new
// rows to the bottom of the sheet keeps existing IDs stable; reordering existing
// rows will shift IDs.

const fs = require("fs");
const path = require("path");

const CSV_PATH = path.join(
  __dirname,
  "../Climate Questions MASTER SHEET - Accumulative.csv",
);
const OUTPUT_PATH = path.join(__dirname, "../data/questions.js");

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function normalizeDifficulty(raw) {
  const v = (raw || "").trim().toLowerCase();
  if (v === "easy") return "Easy";
  if (v === "medium") return "Medium";
  if (v === "hard") return "Hard";
  return null; // untagged ("---" or blank)
}

function sourceNameFromUrl(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function jsString(str) {
  return JSON.stringify(str || "");
}

function main() {
  const csv = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCSV(csv);
  const header = rows[0];
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c && c.trim()));

  const col = (name) => header.indexOf(name);
  const idx = {
    question: col("Question"),
    choiceA: col("Choice A"),
    choiceB: col("Choice B"),
    choiceC: col("Choice C"),
    choiceD: col("Choice D"),
    correct: col("Correct choice (0=A, 1=B, 2=C, 3=D)"),
    source: col("Source"),
    categories: col("Categories (use ',' to separate)"),
    difficulty: col("Difficulty (easy, medium, hard)"),
    notes: col("Notes"),
    explanation: col("Brief explanation, Why it matters?"),
    trailing: header.length - 1, // unlabeled last column - occasional stray source URL
  };

  const questions = dataRows.map((r, i) => {
    const options = [
      r[idx.choiceA],
      r[idx.choiceB],
      r[idx.choiceC],
      r[idx.choiceD],
    ].map((s) => (s || "").trim());
    const correctIdx = parseInt((r[idx.correct] || "").trim(), 10);
    const categories = (r[idx.categories] || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const sourceUrl =
      (r[idx.source] || "").trim() || (r[idx.trailing] || "").trim() || null;

    return {
      id: i + 1,
      question: (r[idx.question] || "").trim(),
      options,
      correct: Number.isNaN(correctIdx) ? null : correctIdx,
      categories: categories.length ? categories : ["Uncategorized"],
      difficulty: normalizeDifficulty(r[idx.difficulty]),
      explanation: (r[idx.explanation] || "").trim() || null,
      source: sourceNameFromUrl(sourceUrl),
      sourceUrl,
      infographic: null, // no infographic data in the sheet yet
      notes: (r[idx.notes] || "").trim() || null,
    };
  });

  const incomplete = questions.filter(
    (q) => !q.question || q.options.some((o) => !o) || q.correct === null,
  );
  if (incomplete.length) {
    console.warn(
      `Warning: ${incomplete.length} row(s) missing question text, an option, or a correct-answer index. These were still imported - check the sheet for gaps.`,
    );
  }

  const body = questions
    .map((q) => {
      return `  {
    id: ${q.id},
    question: ${jsString(q.question)},
    options: [${q.options.map(jsString).join(", ")}],
    correct: ${q.correct === null ? "null" : q.correct},
    categories: [${q.categories.map(jsString).join(", ")}],
    difficulty: ${q.difficulty ? jsString(q.difficulty) : "null"},
    explanation: ${q.explanation ? jsString(q.explanation) : "null"},
    source: ${q.source ? jsString(q.source) : "null"},
    sourceUrl: ${q.sourceUrl ? jsString(q.sourceUrl) : "null"},
    infographic: ${q.infographic ? jsString(q.infographic) : "null"},
    notes: ${q.notes ? jsString(q.notes) : "null"},
  }`;
    })
    .join(",\n");

  const fileContents = `// Auto-generated by scripts/importQuestionsFromCsv.js - do not hand-edit.
// Source of truth: "Climate Questions MASTER SHEET - Accumulative.csv"
// Re-run the import script after updating the sheet instead of editing this file directly.

export const questions = [
${body}
];

// ---- Helper functions ----

export const getAllQuestions = () => questions;

export const getQuestionsByDifficulty = (difficulty) =>
  questions.filter((q) => q.difficulty === difficulty);

// Returns { questions, usedFallback }. If there aren't enough tagged questions at the
// requested difficulty, falls back to the full question pool rather than returning too
// few (or zero) questions - usedFallback tells the caller to show a heads-up in the UI.
export const getRandomQuestionsByDifficulty = (difficulty, count) => {
  const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const tagged = getQuestionsByDifficulty(difficulty);
  if (tagged.length >= count) {
    return { questions: shuffle(tagged).slice(0, count), usedFallback: false };
  }
  return { questions: shuffle(questions).slice(0, count), usedFallback: true };
};

export const getQuestionById = (id) => questions.find((q) => q.id === id) || null;

export const getTotalQuestionCount = () => questions.length;

export const getQuestionCountByDifficulty = (difficulty) =>
  getQuestionsByDifficulty(difficulty).length;
`;

  fs.writeFileSync(OUTPUT_PATH, fileContents);
  console.log(
    `Wrote ${questions.length} questions to ${path.relative(process.cwd(), OUTPUT_PATH)}`,
  );

  const byDifficulty = { Easy: 0, Medium: 0, Hard: 0, untagged: 0 };
  questions.forEach((q) => {
    byDifficulty[q.difficulty || "untagged"]++;
  });
  console.log("By difficulty:", byDifficulty);
}

main();
