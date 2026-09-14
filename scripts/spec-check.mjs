#!/usr/bin/env node
/**
 * `pnpm spec:check` — valida el front-matter y las tablas de cada
 * `src/features/<nombre>/SPEC.md` contra las reglas de CLAUDE.md §16, y con
 * `--write` regenera `docs/SPEC-INDEX.md`. Sin dependencias nuevas: el
 * front-matter de `docs/_plantilla-feature/SPEC.md` es deliberadamente
 * simple (escalares y arreglos planos, sin anidamiento), así que se parsea
 * a mano en vez de instalar un parser YAML completo — no es un parser YAML
 * general, y si una línea no encaja en esa forma, es un fallo SC-01, no una
 * adivinanza.
 *
 * Reglas, con su id corto (se citan así en cada hallazgo):
 *   SC-01 front-matter existe y parsea
 *   SC-02 estado ∈ {ANDAMIAJE, EN_CURSO, IMPLEMENTADA, BLOQUEADA}
 *   SC-03 cada ruta de `rutas` existe literalmente en app/router/routes.ts
 *   SC-04 cada archivo de la tabla "Estado de implementación" (§7) existe en disco
 *   SC-05 `backlog` no está vacío
 *
 * Que una feature de `src/features/` no tenga `SPEC.md` NO es un error: es
 * una fila del reporte marcada "sin spec" (trabajo legítimo pendiente).
 *
 * Acumula todos los hallazgos y los reporta juntos al final, sin abortar en
 * el primero (mismo patrón que `.github/scripts/pr_policy.py` de Paula).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FEATURES_DIR = path.join(ROOT, 'src', 'features');
const ROUTES_FILE = path.join(ROOT, 'src', 'app', 'router', 'routes.ts');
const INDEX_FILE = path.join(ROOT, 'docs', 'SPEC-INDEX.md');

const VALID_STATES = ['ANDAMIAJE', 'EN_CURSO', 'IMPLEMENTADA', 'BLOQUEADA'];

const WRITE_MODE = process.argv.includes('--write');

/** Quita comillas simples o dobles que envuelven un valor escalar, si las tiene. */
function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Parser mínimo del front-matter conocido: líneas `clave: valor`, arreglo
 * en línea `[a, b]` (o `[]`), o arreglo en bloque con `- item` en las
 * líneas siguientes a una clave sin valor. Lanza si una línea no encaja —
 * eso es exactamente SC-01 fallando por "no parsea".
 */
function parseFrontMatter(raw) {
  const lines = raw.split(/\r?\n/);
  const data = {};
  let currentListKey = null;

  for (const line of lines) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const blockItemMatch = line.match(/^\s*-\s*(.*)$/);
    if (blockItemMatch && currentListKey) {
      data[currentListKey].push(stripQuotes(blockItemMatch[1].trim()));
      continue;
    }

    const kvMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kvMatch) {
      throw new Error(`línea no reconocida: "${line}"`);
    }

    const [, key, rawValue] = kvMatch;
    currentListKey = null;
    const value = rawValue.trim();

    if (value === '') {
      data[key] = [];
      currentListKey = key;
    } else if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner === '' ? [] : inner.split(',').map((item) => stripQuotes(item.trim()));
    } else {
      data[key] = stripQuotes(value);
    }
  }

  return data;
}

/** Extrae el texto entre el primer par de líneas `---` del archivo, o `null` si no hay. */
function extractFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

/**
 * Lee la sección "## 7. Estado de implementación" y devuelve, por fila de
 * su tabla, todos los tokens entre backticks de ambas columnas (`Archivo` y
 * `Prueba`) — sin descartar en silencio los que no parecen una ruta; eso lo
 * decide el llamador (ver SC-04 y la lista de "no verificable").
 */
function extractImplementationTokens(content) {
  const sectionMatch = content.match(/## 7\. Estado de implementación([\s\S]*?)(\n## |\n*$)/);
  if (!sectionMatch) return [];

  const tableLines = sectionMatch[1].split(/\r?\n/).filter((line) => line.trim().startsWith('|'));
  const dataLines = tableLines.slice(2); // encabezado + separador, no son datos

  const tokens = [];
  for (const line of dataLines) {
    for (const match of line.matchAll(/`([^`]+)`/g)) {
      tokens.push(match[1]);
    }
  }
  return [...new Set(tokens)];
}

function listFeatureDirs() {
  return readdirSync(FEATURES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function checkFeature(featureName, routesSource) {
  const errors = [];
  const notVerifiable = [];
  const specPath = path.join(FEATURES_DIR, featureName, 'SPEC.md');

  if (!existsSync(specPath)) {
    return { feature: featureName, hasSpec: false, errors, notVerifiable, data: null };
  }

  const content = readFileSync(specPath, 'utf8');
  const rawFrontMatter = extractFrontMatter(content);

  if (rawFrontMatter === null) {
    errors.push({
      rule: 'SC-01 front-matter',
      expected: 'bloque --- ... --- al inicio del archivo',
      found: 'sin front-matter',
    });
    return { feature: featureName, hasSpec: true, errors, notVerifiable, data: null };
  }

  let data;
  try {
    data = parseFrontMatter(rawFrontMatter);
  } catch (parseError) {
    errors.push({
      rule: 'SC-01 front-matter',
      expected: 'YAML válido (escalares y arreglos planos, sin anidar)',
      found: parseError.message,
    });
    return { feature: featureName, hasSpec: true, errors, notVerifiable, data: null };
  }

  // SC-02 — estado
  if (!VALID_STATES.includes(data.estado)) {
    errors.push({
      rule: 'SC-02 estado',
      expected: VALID_STATES.join(' | '),
      found: String(data.estado ?? '(vacío)'),
    });
  }

  // SC-03 — rutas: deben aparecer literalmente citadas (entre comillas) en
  // routes.ts. Cubre tanto ROUTES (paths estáticos) como ROUTE_PATTERNS
  // (paths con ":param", que es donde vive literalmente "/perfiles/:id/editar").
  const rutas = Array.isArray(data.rutas) ? data.rutas : [];
  for (const ruta of rutas) {
    const apareceLiteral = routesSource.includes(`'${ruta}'`) || routesSource.includes(`"${ruta}"`);
    if (!apareceLiteral) {
      errors.push({
        rule: 'SC-03 rutas',
        expected: `"${ruta}" literal en app/router/routes.ts`,
        found: 'no aparece',
      });
    }
  }

  // SC-04 — archivos de la tabla de implementación (§7). Un token sin "/"
  // no se descarta en silencio: se avisa aparte para que quien escriba la
  // spec use la ruta relativa completa, no un nombre suelto.
  const tokens = extractImplementationTokens(content);
  for (const token of tokens) {
    if (!token.includes('/')) {
      notVerifiable.push({
        rule: 'SC-04 archivos',
        expected: 'ruta relativa completa (con "/")',
        found: `"${token}" — no verificable, falta ruta completa`,
      });
      continue;
    }
    if (!existsSync(path.join(ROOT, token))) {
      errors.push({
        rule: 'SC-04 archivos',
        expected: `${token} existe en disco`,
        found: 'no existe',
      });
    }
  }

  // SC-05 — backlog no vacío
  if (!data.backlog || String(data.backlog).trim() === '') {
    errors.push({ rule: 'SC-05 backlog', expected: 'no vacío', found: 'vacío' });
  }

  return { feature: featureName, hasSpec: true, errors, notVerifiable, data };
}

function formatList(value) {
  if (!Array.isArray(value) || value.length === 0) return '—';
  return value.join(', ');
}

/** Regenera el contenido completo de docs/SPEC-INDEX.md a partir de los resultados. */
function buildIndex(results) {
  const rows = results.map(({ feature, hasSpec, data }) => {
    if (!hasSpec || !data) {
      return `| \`${feature}\` | — (sin SPEC.md) | — | — | — | — |`;
    }
    return (
      `| \`${feature}\` | ${data.estado ?? '—'} | ${formatList(data.hu)} | ` +
      `${formatList(data.prt)} | ${formatList(data.jira)} | ${data.revisado ?? '—'} |`
    );
  });

  const generatedAt = new Date().toISOString();

  return `# Índice de especificaciones de feature

<!-- Generado automáticamente por \`pnpm spec:check --write\`. NO SE EDITA A MANO: -->
<!-- cualquier cambio manual se pierde en la siguiente corrida. -->

| Feature | Estado | HU | PRT | Jira | Última revisión |
| ------- | ------ | --- | --- | ---- | ---------------- |
${rows.join('\n')}

_Generado automáticamente el ${generatedAt} con \`pnpm spec:check --write\`. No se edita a mano._
`;
}

function main() {
  const routesSource = readFileSync(ROUTES_FILE, 'utf8');
  const features = listFeatureDirs();
  const results = features.map((feature) => checkFeature(feature, routesSource));

  let totalErrors = 0;
  let totalNotVerifiable = 0;
  const withSpec = [];
  const withoutSpec = [];

  for (const result of results) {
    if (!result.hasSpec) {
      withoutSpec.push(result.feature);
      continue;
    }
    withSpec.push(result.feature);

    for (const error of result.errors) {
      totalErrors += 1;
      console.log(
        `[${result.feature}] ${error.rule}: esperado "${error.expected}" — encontrado: ${error.found}`,
      );
    }
    for (const item of result.notVerifiable) {
      totalNotVerifiable += 1;
      console.log(
        `[${result.feature}] ${item.rule}: esperado "${item.expected}" — encontrado: ${item.found}`,
      );
    }
  }

  console.log('');
  console.log(`Features con SPEC.md: ${withSpec.length} (${withSpec.join(', ') || '—'})`);
  console.log(
    `Features sin SPEC.md (no es error, trabajo pendiente): ${withoutSpec.length} (${withoutSpec.join(', ') || '—'})`,
  );
  console.log(`Hallazgos no verificables (SC-04, no cuentan como error): ${totalNotVerifiable}`);
  console.log(`Errores: ${totalErrors}`);

  if (WRITE_MODE) {
    writeFileSync(INDEX_FILE, buildIndex(results), 'utf8');
    console.log('\ndocs/SPEC-INDEX.md regenerado.');
  }

  process.exitCode = totalErrors > 0 ? 1 : 0;
}

main();
