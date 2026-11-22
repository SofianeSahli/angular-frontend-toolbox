// Theme compiler CLI (spec 002, REQ-3.5, REQ-3.6, REQ-7.4). Node 24 runs this file directly.
//   node shared/ui/tokens/compiler/cli.ts defaults [--check]
//   node shared/ui/tokens/compiler/cli.ts theme <theme-dir> [--check]
// Without --check it writes the generated files. With --check it writes nothing and fails
// if the input is invalid, a contrast pair fails, or a committed file differs from fresh output.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileDefaults, compileTheme, parseContract } from './compile.ts';
import { checkContrast, describeFailure, parsePairs } from './contrast.ts';

const tokensRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));
const lf = (s: string) => s.replace(/\r\n/g, '\n');

function emit(files: Array<[string, string]>, check: boolean): string[] {
  const problems: string[] = [];
  for (const [file, content] of files) {
    const shown = relative(process.cwd(), file);
    if (!check) {
      writeFileSync(file, content);
      console.log(`wrote ${shown}`);
    } else if (!existsSync(file)) {
      problems.push(`${shown} is missing; run the compile-tokens target`);
    } else if (lf(readFileSync(file, 'utf8')) !== content) {
      problems.push(`${shown} is out of date with its source; run the compile-tokens target`);
    }
  }
  return problems;
}

function main(argv: string[]): number {
  const check = argv.includes('--check');
  const [command, dir] = argv.filter((a) => a !== '--check');
  const contract = parseContract(readJson(join(tokensRoot, 'contract.json')));
  let problems: string[];

  if (command === 'defaults') {
    problems = emit([[join(tokensRoot, 'src/styles/defaults.generated.css'), compileDefaults(contract)]], check);
  } else if (command === 'theme' && dir) {
    const themeDir = resolve(dir);
    const theme = compileTheme(readJson(join(themeDir, 'tokens.json')), contract);
    const failures = checkContrast(theme.colors, parsePairs(readJson(join(themeDir, 'contrast-pairs.json'))));
    problems = failures.map((f) => `contrast: ${describeFailure(f)}`);
    if (problems.length === 0) {
      problems = emit(
        [
          [join(themeDir, `src/${theme.slug}.generated.css`), theme.css],
          [join(themeDir, `src/${theme.slug}.generated.ts`), theme.ts],
        ],
        check,
      );
    }
  } else {
    console.error('usage: cli.ts defaults [--check] | cli.ts theme <theme-dir> [--check]');
    return 2;
  }

  for (const p of problems) console.error(p);
  return problems.length ? 1 : 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
}
