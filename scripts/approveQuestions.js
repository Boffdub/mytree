#!/usr/bin/env node
'use strict';

/**
 * Climate trivia question approver.
 * Reads staged_questions.json, shows an AI quality review for each question,
 * then lets you approve / edit / reject before writing to data/questions.js.
 *
 * Usage:
 *   node scripts/approveQuestions.js
 *
 * Requires: ANTHROPIC_API_KEY env var
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const STAGED_FILE = path.join(__dirname, 'staged_questions.json');
const QUESTIONS_FILE = path.join(__dirname, '../data/questions.js');
const CATEGORIES_ORDER = ['energy', 'transportation', 'foodAgriculture', 'carbonRemoval', 'solutions'];

function ask(rl, prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

// ─── Display ────────────────────────────────────────────────────────────────

function displayQuestion(q, index, total) {
  const letters = ['A', 'B', 'C', 'D'];
  const options = q.options
    .map((opt, i) => `  ${i === q.correct ? '✓' : ' '} ${letters[i]}) ${opt}`)
    .join('\n');

  console.log(`
Question ${index + 1}/${total} [${q.category} · ${q.difficulty}]
${'─'.repeat(55)}

Q: ${q.question}

${options}

Explanation: ${q.explanation}
Source: ${q.source}
URL:    ${q.sourceUrl}`);
}

// ─── AI review ──────────────────────────────────────────────────────────────

async function getAIReview(client, question) {
  const prompt = `Review this climate trivia question for quality, accuracy, and mission alignment:

${JSON.stringify(question, null, 2)}

Check all five:
1. Is the question clear and unambiguous?
2. Is the marked correct answer (index ${question.correct} = "${question.options[question.correct]}") likely to be factually accurate?
3. Are the wrong answers plausible but clearly incorrect?
4. Is the difficulty "${question.difficulty}" appropriate?
5. Action & framing: Does the explanation end with something actionable or hopeful? Is the framing agency-building rather than doom-inducing? Flag any explanation that's a pure doom stat with no solution context.

Give a brief assessment (2–4 sentences). Lead with "✓ Looks good —" or "⚠ Concern: " depending on your assessment.`;

  const messages = [{ role: 'user', content: prompt }];

  let response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages,
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock?.text ?? 'Unable to review.';
}

// ─── Edit flow ───────────────────────────────────────────────────────────────

async function editQuestion(rl, client, question) {
  console.log('\nWhat would you like to change?');
  console.log('  q  – question text');
  console.log('  o  – options / correct answer index');
  console.log('  e  – explanation');
  console.log('  d  – difficulty');
  console.log('  s  – source / URL');
  console.log('  ai – let AI suggest improvements');
  console.log('  c  – cancel');

  const choice = (await ask(rl, 'Choice: ')).trim().toLowerCase();

  switch (choice) {
    case 'q': {
      const v = (await ask(rl, `Question text [Enter to keep]: `)).trim();
      if (v) question.question = v;
      break;
    }
    case 'o': {
      console.log('Current options:');
      question.options.forEach((opt, i) =>
        console.log(`  ${i}: ${i === question.correct ? '✓' : ' '} ${opt}`)
      );
      for (let i = 0; i < 4; i++) {
        const v = (await ask(rl, `Option ${i} [Enter to keep]: `)).trim();
        if (v) question.options[i] = v;
      }
      const idx = (await ask(rl, `Correct index (0–3) [Enter to keep]: `)).trim();
      const parsed = parseInt(idx);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) question.correct = parsed;
      break;
    }
    case 'e': {
      const v = (await ask(rl, 'Explanation [Enter to keep]: ')).trim();
      if (v) question.explanation = v;
      break;
    }
    case 'd': {
      const v = (await ask(rl, 'Difficulty (Easy/Medium/Hard): ')).trim();
      const d = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
      if (['Easy', 'Medium', 'Hard'].includes(d)) question.difficulty = d;
      break;
    }
    case 's': {
      const src = (await ask(rl, 'Source [Enter to keep]: ')).trim();
      if (src) question.source = src;
      const url = (await ask(rl, 'URL [Enter to keep]: ')).trim();
      if (url) question.sourceUrl = url;
      break;
    }
    case 'ai': {
      process.stdout.write('Getting AI revision... ');
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content:
            'Improve this climate trivia question. Return ONLY the revised JSON object, no extra text:\n' +
            JSON.stringify(question, null, 2),
        }],
      });
      const text = response.content.find(b => b.type === 'text')?.text ?? '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const revised = JSON.parse(match[0]);
          // Only overwrite safe fields; preserve category
          const safe = ['question', 'options', 'correct', 'difficulty', 'explanation', 'source', 'sourceUrl'];
          for (const key of safe) {
            if (revised[key] !== undefined) question[key] = revised[key];
          }
          console.log('Applied.');
        } catch {
          console.log('Could not parse AI suggestion.');
        }
      } else {
        console.log('No JSON found in AI response.');
      }
      break;
    }
    default:
      break;
  }

  return question;
}

// ─── File writing ────────────────────────────────────────────────────────────

function getNextId(category) {
  const content = fs.readFileSync(QUESTIONS_FILE, 'utf8');
  const catStart = content.indexOf(`  ${category}: [`);
  if (catStart === -1) return 1;

  const nextCatPattern = /\n  [a-zA-Z]+: \[/g;
  nextCatPattern.lastIndex = catStart + category.length + 5;
  const nextMatch = nextCatPattern.exec(content);
  const catEnd = nextMatch ? nextMatch.index : content.indexOf('\n};');

  const section = content.slice(catStart, catEnd);
  const ids = [...section.matchAll(/\bid:\s*(\d+)/g)].map(m => parseInt(m[1]));
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

function esc(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatQuestionObject(q) {
  return [
    '    {',
    `      id: ${q.id},`,
    `      question: "${esc(q.question)}",`,
    `      options: [${q.options.map(o => `"${esc(o)}"`).join(', ')}],`,
    `      correct: ${q.correct},`,
    `      difficulty: "${esc(q.difficulty)}",`,
    `      explanation: "${esc(q.explanation)}",`,
    `      source: "${esc(q.source)}",`,
    `      sourceUrl: "${esc(q.sourceUrl)}",`,
    `      infographic: "${esc(q.infographic || 'placeholder.png')}",`,
    `      category: "${esc(q.category)}"`,
    '    }',
  ].join('\n');
}

function appendToQuestionsFile(question) {
  let content = fs.readFileSync(QUESTIONS_FILE, 'utf8');
  const { category } = question;

  const catIdx = CATEGORIES_ORDER.indexOf(category);
  if (catIdx === -1) throw new Error(`Unknown category: ${category}`);

  const catMarker = `  ${category}: [`;
  const catStart = content.indexOf(catMarker);
  if (catStart === -1) throw new Error(`Category "${category}" not found in questions.js`);

  let catEnd;
  if (catIdx < CATEGORIES_ORDER.length - 1) {
    catEnd = content.indexOf(`  ${CATEGORIES_ORDER[catIdx + 1]}: [`, catStart);
  } else {
    catEnd = content.indexOf('\n};', catStart) + 1;
  }

  const section = content.slice(catStart, catEnd);

  // Find the last closing brace of a question object (4-space indent)
  const closePattern = /\n    \}(,?)/g;
  let lastClose = null;
  let m;
  while ((m = closePattern.exec(section)) !== null) {
    lastClose = m;
  }

  if (!lastClose) throw new Error(`Could not find insertion point in ${category}`);

  // absolutePos = index in content of the char immediately after the `}`
  const absolutePos = catStart + lastClose.index + '\n    }'.length;
  const hasTrailingComma = lastClose[1] === ',';
  const questionStr = formatQuestionObject(question);

  if (hasTrailingComma) {
    // Insert after the existing trailing comma
    content =
      content.slice(0, absolutePos + 1) +
      '\n' + questionStr + ',' +
      content.slice(absolutePos + 1);
  } else {
    // Add comma to previous question, then insert new one
    content =
      content.slice(0, absolutePos) +
      ',\n' + questionStr +
      content.slice(absolutePos);
  }

  // Write atomically: temp file → rename (prevents corruption on crash)
  const tmpFile = QUESTIONS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, content);
  fs.renameSync(tmpFile, QUESTIONS_FILE);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set');
    process.exit(1);
  }

  if (!fs.existsSync(STAGED_FILE)) {
    console.log('No staged questions found. Run generateQuestions.js first.');
    process.exit(0);
  }

  let staged;
  try {
    staged = JSON.parse(fs.readFileSync(STAGED_FILE, 'utf8'));
  } catch {
    console.error(
      'staged_questions.json is malformed. Delete it or restore from staged_questions.json.bak and try again.'
    );
    process.exit(1);
  }
  if (staged.length === 0) {
    console.log('staged_questions.json is empty.');
    process.exit(0);
  }

  const client = new Anthropic();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const approved = [];
  const rejected = [];
  const skipped = [];
  const failed = [];

  console.log(`\n=== Question Approver ===`);
  console.log(`${staged.length} questions to review\n`);

  for (let i = 0; i < staged.length; i++) {
    let question = { ...staged[i] };

    displayQuestion(question, i, staged.length);

    process.stdout.write('\nGetting AI review... ');
    let review;
    try {
      review = await getAIReview(client, question);
    } catch (err) {
      review = `(review failed: ${err.message})`;
    }
    console.log(`\n\nAI Review: ${review}\n`);

    let action = '';
    while (!['a', 'r', 's'].includes(action)) {
      const raw = (await ask(rl, '[a]pprove / [e]dit / [r]eject / [s]kip: ')).trim().toLowerCase();

      if (raw === 'e') {
        question = await editQuestion(rl, client, question);
        displayQuestion(question, i, staged.length);
        // Re-review after edit
        process.stdout.write('\nRe-reviewing... ');
        try {
          review = await getAIReview(client, question);
        } catch {
          review = '(review unavailable)';
        }
        console.log(`\n\nAI Review: ${review}\n`);
      } else {
        action = raw;
      }
    }

    if (action === 'a') {
      const id = getNextId(question.category);
      const full = { id, ...question };
      try {
        appendToQuestionsFile(full);
        approved.push(full);
        console.log(`  ✓ Added as id ${id} in ${question.category}\n`);
      } catch (err) {
        console.error(`  ✗ Write failed: ${err.message}`);
        console.error(`    Question kept in staged_questions.json for retry.\n`);
        failed.push(question);
      }
    } else if (action === 'r') {
      rejected.push(question);
      console.log('  ✗ Rejected\n');
    } else {
      skipped.push(question);
      console.log('  → Skipped\n');
    }
  }

  rl.close();

  // Update staged file: keep skipped + failed (both can be retried)
  const remaining = [...skipped, ...failed];
  if (remaining.length === 0) {
    fs.unlinkSync(STAGED_FILE);
  } else {
    fs.writeFileSync(STAGED_FILE, JSON.stringify(remaining, null, 2));
  }

  console.log('=== Summary ═══════════════════════════════════');
  console.log(`  Approved: ${approved.length}`);
  console.log(`  Rejected: ${rejected.length}`);
  console.log(`  Skipped:  ${skipped.length}`);
  if (failed.length > 0) console.log(`  Failed (write error, kept for retry): ${failed.length}`);
  if (remaining.length > 0) {
    console.log(`\n  ${remaining.length} question(s) remain in staged_questions.json`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
