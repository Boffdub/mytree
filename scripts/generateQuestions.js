#!/usr/bin/env node
'use strict';

/**
 * Climate trivia question generator.
 * Uses Claude + web search to create sourced, action-oriented questions.
 *
 * Usage:
 *   node scripts/generateQuestions.js
 *   node scripts/generateQuestions.js --category energy --difficulty Medium --count 3
 *   node scripts/generateQuestions.js --category solutions --balanced        (1 Easy + 1 Medium + 1 Hard)
 *   node scripts/generateQuestions.js --category energy --balanced --count 2 (2 per difficulty = 6 total)
 *
 * Requires: ANTHROPIC_API_KEY env var
 * Output: scripts/staged_questions.json (appended, not overwritten)
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CATEGORIES = ['energy', 'transportation', 'foodAgriculture', 'carbonRemoval', 'solutions'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const STAGED_FILE = path.join(__dirname, 'staged_questions.json');
const QUESTIONS_FILE = path.join(__dirname, '../data/questions.js');
const MAX_COUNT = 10;
const MAX_AGENT_ITERATIONS = 10;

const CATEGORY_CONTEXT = {
  energy:
    'renewable energy adoption, fossil fuel phase-out, electricity generation mix, ' +
    'solar/wind cost declines, energy storage breakthroughs, grid demand patterns, energy poverty',
  transportation:
    'electric vehicle adoption milestones, aviation emissions, sustainable aviation fuel, ' +
    'public transit carbon savings, shipping decarbonization, cycling and walkability',
  foodAgriculture:
    'livestock emissions, food waste impact, regenerative agriculture wins, ' +
    'plant-based diet benefits, supply chain emissions, food miles vs production choices',
  carbonRemoval:
    'ocean carbon sink data, wetland sequestration, forest carbon credits, direct air capture ' +
    'progress, soil carbon farming, blue carbon ecosystems, nature-based solution funding',
  solutions:
    'high-impact individual actions (diet, transport, home energy, voting), policy wins ' +
    'and clean energy legislation, corporate net-zero commitments, clean tech cost curves, ' +
    'community solar programs, EV incentives, heat pump rebates, climate career paths',
};

// Rough cost estimate per question (Opus + web search)
const COST_PER_QUESTION_LOW = 0.15;
const COST_PER_QUESTION_HIGH = 0.50;

function ask(rl, prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function getParams() {
  const args = process.argv.slice(2);
  const params = { balanced: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--category') params.category = args[++i];
    else if (args[i] === '--difficulty') params.difficulty = args[++i];
    else if (args[i] === '--count') params.count = parseInt(args[++i]);
    else if (args[i] === '--balanced') params.balanced = true;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  if (!params.category) {
    let cat;
    do {
      cat = (await ask(rl, `Category (${CATEGORIES.join(' / ')}): `)).trim();
    } while (!CATEGORIES.includes(cat));
    params.category = cat;
  }

  if (!params.balanced && !params.difficulty) {
    let diff;
    do {
      const raw = (await ask(rl, 'Difficulty (Easy / Medium / Hard) or "balanced" for all three: ')).trim();
      if (raw.toLowerCase() === 'balanced') { params.balanced = true; break; }
      diff = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    } while (!DIFFICULTIES.includes(diff));
    if (!params.balanced) params.difficulty = diff;
  }

  if (!params.count) {
    const raw = (await ask(rl, params.balanced ? 'How many per difficulty? [1]: ' : 'How many questions? [3]: ')).trim();
    params.count = parseInt(raw) || (params.balanced ? 1 : 3);
  }

  rl.close();
  return params;
}

function clampCount(count) {
  if (!Number.isFinite(count) || count < 1) return 1;
  if (count > MAX_COUNT) {
    console.warn(`  count capped at ${MAX_COUNT} (requested ${count})`);
    return MAX_COUNT;
  }
  return count;
}

function getExistingQuestions(category) {
  const content = fs.readFileSync(QUESTIONS_FILE, 'utf8');
  const catMarker = `  ${category}: [`;
  const catStart = content.indexOf(catMarker);
  if (catStart === -1) return [];

  const nextCatPattern = /\n  [a-zA-Z]+: \[/g;
  nextCatPattern.lastIndex = catStart + catMarker.length;
  const nextMatch = nextCatPattern.exec(content);
  const catEnd = nextMatch ? nextMatch.index : content.indexOf('\n};');

  const section = content.slice(catStart, catEnd);
  return [...section.matchAll(/question:\s*"([^"]+)"/g)].map(m => m[1]);
}

function extractJsonArray(text) {
  // Find the LAST [...] block in the response to avoid matching preamble lists
  let lastStart = -1;
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\' && inString) { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '[') {
      if (depth === 0) lastStart = i;
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0 && lastStart !== -1) {
        const candidate = text.slice(lastStart, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question) {
            return parsed;
          }
        } catch {
          // not valid JSON, keep scanning
        }
        lastStart = -1;
      }
    }
  }
  return null;
}

async function runGeneratorAgent(client, system, userMessage) {
  const messages = [{ role: 'user', content: userMessage }];
  let iterations = 0;

  while (iterations < MAX_AGENT_ITERATIONS) {
    iterations++;

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 8192,
      system,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages,
    });

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text');
      return textBlock?.text ?? '';
    }

    if (response.stop_reason === 'max_tokens') {
      // Try to extract whatever text we have so far
      const textBlock = response.content.find(b => b.type === 'text');
      if (textBlock?.text) return textBlock.text;
      throw new Error('Response hit max_tokens with no usable text');
    }

    if (response.stop_reason === 'tool_use') {
      for (const block of response.content) {
        if (block.type === 'tool_use' && block.name === 'web_search') {
          process.stdout.write(`\n  [search] ${block.input?.query ?? '...'}`);
        }
      }
      messages.push({ role: 'assistant', content: response.content });
      continue;
    }

    // Unknown stop reason — break and return whatever text we have
    const textBlock = response.content.find(b => b.type === 'text');
    return textBlock?.text ?? '';
  }

  throw new Error(`Agent exceeded ${MAX_AGENT_ITERATIONS} iterations without finishing`);
}

function buildSystemPrompt(category, difficulty) {
  return `You are a climate science trivia question writer for MyTree, a mobile app helping people learn about climate change and feel inspired to take action.

Core belief of the app: players should leave feeling that climate solutions are real, progress is happening, and their choices matter.

Framing principles:
- PREFER questions that highlight what's working, what's possible, or what people can do
  ("Which individual action has the biggest carbon impact?" beats "What % of emissions come from X?")
- PREFER explanations that end with what users can do or point to real-world solutions or progress
- ALLOW sobering facts — but frame them with agency, not helplessness
- AVOID pure doom statistics with no solution context

Rules for every question:
- Exactly 4 answer options; only one is correct
- Wrong answers must be plausible but clearly incorrect to someone informed
- Explanation: 2–3 sentences. WHY the answer is correct. End with one actionable or hopeful insight.
- Source: cite a SPECIFIC article or data page URL (not a homepage)
- Prefer sources from 2020–2025: IEA, IPCC, Our World in Data, Nature, Science, peer-reviewed research
- Difficulty for these questions: ${difficulty}
    Easy   – common knowledge, major headlines, basic facts any news reader would know
    Medium – requires following climate news or some background knowledge
    Hard   – specific statistics, surprising research findings, nuanced understanding required

After your web research, return ONLY a valid JSON array — no markdown fences, no extra text:
[
  {
    "question": "Question text ending with ?",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "difficulty": "${difficulty}",
    "explanation": "Why correct. What users can do or what progress is happening.",
    "source": "Organization, Year",
    "sourceUrl": "https://specific-article-url.com",
    "infographic": "placeholder.png",
    "category": "${category}"
  }
]`;
}

async function generateBatch(client, category, difficulty, count, existingTitles) {
  const system = buildSystemPrompt(category, difficulty);

  const userPrompt = `Generate ${count} new ${difficulty} difficulty climate trivia questions for the "${category}" category.

Topic areas: ${CATEGORY_CONTEXT[category]}

Use web search to find specific, credible facts with real article URLs.

Existing questions to AVOID duplicating:
${existingTitles || '  (none yet)'}

Return exactly ${count} questions as a JSON array with category="${category}" and difficulty="${difficulty}".`;

  process.stdout.write(`\n\nGenerating ${count} ${difficulty} ${category} question${count > 1 ? 's' : ''}`);

  const responseText = await runGeneratorAgent(client, system, userPrompt);
  process.stdout.write('\n');

  const questions = extractJsonArray(responseText);
  if (!questions) {
    throw new Error(`Could not extract JSON array from response.\nRaw: ${responseText.slice(0, 400)}`);
  }

  if (questions.length < count) {
    console.warn(`  Warning: requested ${count} but got ${questions.length}`);
  }

  return questions;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set');
    process.exit(1);
  }

  const params = await getParams();
  params.count = clampCount(params.count);

  const { category, difficulty, count, balanced } = params;

  // Cost estimate
  const totalQuestions = balanced ? count * 3 : count;
  const estLow = (totalQuestions * COST_PER_QUESTION_LOW).toFixed(2);
  const estHigh = (totalQuestions * COST_PER_QUESTION_HIGH).toFixed(2);

  const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await ask(
    rl2,
    `\nGenerating ${totalQuestions} question${totalQuestions > 1 ? 's' : ''} with claude-opus-4-8 + web search.\nEstimated cost: ~$${estLow}–$${estHigh}. Continue? [Y/n]: `
  );
  rl2.close();
  if (confirm.trim().toLowerCase() === 'n') {
    console.log('Aborted.');
    process.exit(0);
  }

  const client = new Anthropic();

  const existingQuestions = getExistingQuestions(category);
  const existingTitles = existingQuestions.length
    ? existingQuestions.map(q => `  - "${q}"`).join('\n')
    : '';

  let allGenerated = [];

  try {
    if (balanced) {
      for (const diff of DIFFICULTIES) {
        const batch = await generateBatch(client, category, diff, count, existingTitles);
        allGenerated.push(...batch);
      }
    } else {
      const batch = await generateBatch(client, category, difficulty, count, existingTitles);
      allGenerated.push(...batch);
    }
  } catch (err) {
    console.error('\nGeneration error:', err.message);
    process.exit(1);
  }

  // Load or initialize staged file safely
  let staged = [];
  if (fs.existsSync(STAGED_FILE)) {
    try {
      staged = JSON.parse(fs.readFileSync(STAGED_FILE, 'utf8'));
    } catch {
      console.error(
        `Warning: staged_questions.json is malformed. Backing it up and starting fresh.\n` +
        `  Backup: ${STAGED_FILE}.bak`
      );
      fs.copyFileSync(STAGED_FILE, STAGED_FILE + '.bak');
      staged = [];
    }
  }

  staged.push(...allGenerated);
  fs.writeFileSync(STAGED_FILE, JSON.stringify(staged, null, 2));

  console.log(`\n✓ Added ${allGenerated.length} questions → scripts/staged_questions.json`);
  console.log(`  Total staged: ${staged.length}`);
  console.log(`\nRun 'node scripts/approveQuestions.js' to review and approve`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
