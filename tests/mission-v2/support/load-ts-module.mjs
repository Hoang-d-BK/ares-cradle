import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const cache = new Map();
const resolveImport = (specifier, importer) => {
  if (!specifier.startsWith('.')) return specifier;
  const base = new URL(specifier, importer);
  if (!path.extname(base.pathname)) base.pathname += '.ts';
  return base;
};

/** Load a local TypeScript/JSON module and its relative-import closure as data URLs. */
export async function loadTsModule(relativePath, parentUrl) {
  const entry = new URL(relativePath, parentUrl);
  const visit = async (url) => {
    const key = url.href;
    if (cache.has(key)) return cache.get(key);
    const pending = (async () => {
      const source = await readFile(url, 'utf8');
      if (url.pathname.endsWith('.json')) {
        const rewritten = JSON.stringify(JSON.parse(source));
        return `data:text/javascript;base64,${Buffer.from(`export default ${rewritten};`).toString('base64')}`;
      }
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, resolveJsonModule: true },
      });
      const imports = [...outputText.matchAll(/(\bfrom\s*|\bimport\s*)(['"])([^'"]+)\2(\s*(?:(?:assert|with)\s*\{[^}]*\})?)/g)];
      let compiled = outputText;
      for (const match of imports) {
        const child = resolveImport(match[3], url);
        if (child instanceof URL) {
          const childUrl = await visit(child);
          const attributes = child.pathname.endsWith('.json') ? '' : match[4];
          compiled = compiled.replace(match[0], `${match[1]}${match[2]}${childUrl}${match[2]}${attributes}`);
        }
      }
      return `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`;
    })();
    cache.set(key, pending);
    try { return await pending; }
    catch (error) { cache.delete(key); throw error; }
  };
  return import(await visit(entry));
}
