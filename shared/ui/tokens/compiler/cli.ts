import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileDefaults, compileTheme, parseContract } from './compile.ts';
import { findPairsBelowMinimum, describeFailure, parsePairs } from './contrast.ts';

const USAGE = 'usage: cli.ts defaults [--check] | cli.ts theme <theme-dir> [--check]';
const tokensLibraryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

type GeneratedFile = [path: string, content: string];

const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));
const withoutCarriageReturns = (text: string) => text.replace(/\r\n/g, '\n');

function writeGeneratedFiles(files: GeneratedFile[]): string[] {
  for (const [path, content] of files) {
    writeFileSync(path, content);
    console.log(`wrote ${relative(process.cwd(), path)}`);
  }
  return [];
}

function findStaleGeneratedFiles(files: GeneratedFile[]): string[] {
  return files.flatMap(([path, content]) => {
    const shown = relative(process.cwd(), path);
    if (!existsSync(path)) return [`${shown} is missing; run the compile-tokens target`];
    if (withoutCarriageReturns(readFileSync(path, 'utf8')) !== content) return [`${shown} is out of date with its source; run the compile-tokens target`];
    return [];
  });
}

function compileThemeDirectory(themeDirectory: string, checkOnly: boolean): string[] {
  const contract = parseContract(readJson(join(tokensLibraryRoot, 'contract.json')));
  const theme = compileTheme(readJson(join(themeDirectory, 'tokens.json')), contract);
  const contrastFailures = findPairsBelowMinimum(theme.colorsAsWritten, parsePairs(readJson(join(themeDirectory, 'contrast-pairs.json'))));
  if (contrastFailures.length) return contrastFailures.map((f) => `contrast: ${describeFailure(f)}`);
  const files: GeneratedFile[] = [
    [join(themeDirectory, `src/${theme.slug}.generated.css`), theme.css],
    [join(themeDirectory, `src/${theme.slug}.generated.ts`), theme.ts],
  ];
  return checkOnly ? findStaleGeneratedFiles(files) : writeGeneratedFiles(files);
}

function compileContractDefaults(checkOnly: boolean): string[] {
  const contract = parseContract(readJson(join(tokensLibraryRoot, 'contract.json')));
  const files: GeneratedFile[] = [[join(tokensLibraryRoot, 'src/styles/defaults.generated.css'), compileDefaults(contract)]];
  return checkOnly ? findStaleGeneratedFiles(files) : writeGeneratedFiles(files);
}

function run(args: string[]): number {
  const checkOnly = args.includes('--check');
  const [command, themeDirectory] = args.filter((a) => a !== '--check');
  let problems: string[];
  if (command === 'defaults') problems = compileContractDefaults(checkOnly);
  else if (command === 'theme' && themeDirectory) problems = compileThemeDirectory(resolve(themeDirectory), checkOnly);
  else {
    console.error(USAGE);
    return 2;
  }
  problems.forEach((p) => console.error(p));
  return problems.length ? 1 : 0;
}

try {
  process.exitCode = run(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
