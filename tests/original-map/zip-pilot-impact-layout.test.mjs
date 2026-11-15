import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../../src/modules/mission-control/impactPractice.css', import.meta.url), 'utf8');
const codex = readFileSync(new URL('../../src/modules/mission-control/ScienceCodex.tsx', import.meta.url), 'utf8');

function firstRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Missing CSS rule for ${selector}`);
  return match[1];
}

test('the codex scroll pane owns vertical scrolling without a nested practice trap', () => {
  const panel = firstRule('.impact-practice');
  assert.doesNotMatch(panel, /overflow-y:\s*auto/);
  assert.doesNotMatch(panel, /overscroll-behavior:\s*contain/);
  assert.ok(codex.includes('className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] overflow-y-auto md:grid-cols-'));
});

test('practice panel and codex grid have shrink-safe responsive layout constraints', () => {
  const panel = firstRule('.impact-practice');
  assert.match(panel, /container-type:\s*inline-size/);
  assert.match(panel, /width:\s*100%/);
  assert.match(panel, /min-width:\s*0/);
  assert.match(panel, /max-width:\s*100%/);

  const columns = firstRule('.impact-practice__columns');
  assert.match(columns, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  const wideContainer = css.match(/@container impact-practice \(min-width:\s*640px\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(wideContainer, 'two-column practice layout has an explicit container-width threshold');
  assert.match(wideContainer[1], /\.impact-practice__columns\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.doesNotMatch(css.replace(wideContainer[0], ''), /\.impact-practice__columns\s*\{[^}]*grid-template-columns:\s*repeat\(2/);

  const header = firstRule('.impact-practice__header');
  assert.match(header, /display:\s*grid/);
  assert.match(header, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(firstRule('.impact-practice__exit'), /width:\s*max-content/);

  const record = css.match(/\.impact-practice__signal,\s*\.impact-practice__frame\s*\{([^}]*)\}/);
  assert.ok(record, 'record buttons share a responsive grid rule');
  assert.match(record[1], /grid-template-columns:\s*max-content\s+minmax\(0,\s*1fr\)/);
  assert.match(firstRule('.impact-practice__record-copy'), /min-width:\s*0/);
  assert.match(firstRule('.impact-practice__record-copy'), /font-size:\s*16px/);
  assert.match(firstRule('.impact-practice__check'), /grid-area:\s*check/);
  assert.doesNotMatch(firstRule('.impact-practice__check'), /position:\s*absolute/);
  assert.doesNotMatch(css, /overflow(?:-x)?\s*:\s*(?:hidden|clip)/);

  assert.match(codex, /<section[^>]*role="dialog"[^>]*className="[^"]*min-w-0/);
  assert.match(codex, /grid-cols-\[minmax\(0,1fr\)\][^\"]*md:grid-cols-\[minmax\(14rem,\.75fr\)_minmax\(0,1\.25fr\)\]/);
  assert.match(codex, /<nav[^>]*className="[^"]*min-w-0[^"]*max-w-full[^"]*"/);
  assert.match(codex, /<article[^>]*className="[^"]*min-w-0[^"]*max-w-full[^"]*"/);
});
