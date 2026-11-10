import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.resolve(projectRoot, 'src');

console.log('🛡️  Running Hallmark & Impeccable Anti-AI Slop Quality Linter...');

const FORBIDDEN_PATTERNS = [
  {
    name: 'Unconstrained Transition (transition: all)',
    regex: /transition:\s*all/gi,
    severity: 'ERROR',
    advice: 'Explicitly specify transitioned properties (e.g., transition: opacity 0.2s, transform 0.2s) to maintain 60 FPS.'
  },
  {
    name: 'Generic AI Purple/Indigo Slop Gradient',
    regex: /from-purple-[4-7]00\s+to-indigo-[4-7]00|#7928ca|#8b5cf6/gi,
    severity: 'WARN',
    advice: 'Use Mars-authentic design tokens (var(--color-mars-rust), var(--color-visor-cyan)) from hallmark-tokens.css.'
  },
  {
    name: 'Inline Pure Black Background (#000000)',
    regex: /background(-color)?:\s*(#000000|black)\b(?![^;]*var\()/gi,
    severity: 'WARN',
    advice: 'Use rich obsidian surface tokens (var(--color-obsidian-900)) rather than raw harsh pitch black.'
  }
];

function scanDirectory(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        scanDirectory(fullPath, fileList);
      }
    } else if (/\.(tsx|ts|css)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = scanDirectory(srcDir);
let errorCount = 0;
let warnCount = 0;
const findings = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(projectRoot, file).replace(/\\/g, '/');

  lines.forEach((line, lineIndex) => {
    for (const rule of FORBIDDEN_PATTERNS) {
      if (rule.regex.test(line)) {
        if (rule.severity === 'ERROR') errorCount++;
        else warnCount++;

        findings.push({
          file: relativePath,
          line: lineIndex + 1,
          rule: rule.name,
          severity: rule.severity,
          advice: rule.advice,
          snippet: line.trim()
        });
      }
    }
  });
}

console.log(`\n🔍 Scanned ${files.length} source files.`);

if (findings.length === 0) {
  console.log('✅ PASS: Zero AI-slop tropes detected. Hallmark design floor respected!\n');
  process.exit(0);
} else {
  console.log(`⚠️ Found ${errorCount} Errors and ${warnCount} Warnings:\n`);
  findings.forEach((f) => {
    const badge = f.severity === 'ERROR' ? '❌ [ERROR]' : '⚠️ [WARN] ';
    console.log(`${badge} ${f.file}:${f.line} - ${f.rule}`);
    console.log(`    Code  : ${f.snippet}`);
    console.log(`    Advice: ${f.advice}\n`);
  });

  if (errorCount > 0) {
    console.error(`💥 Anti-Slop Lint FAILED with ${errorCount} blocking errors.`);
    process.exit(1);
  } else {
    console.log('✨ Anti-Slop Lint PASSED with minor warnings.');
    process.exit(0);
  }
}
