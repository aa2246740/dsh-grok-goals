import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { isBuiltin } from 'node:module'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'
import { build } from 'tsdown'

const root = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(root, '..')
const PACKAGE_ID = 'dsh-grok-goals'
const CLIENT_ENTRY = 'src/client/index.tsx'
const HOST_ENTRY = 'src/dsh-grok-goals.ts'

/** Official DSH 0.1.5-rc.2 shared browser platform modules. */
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

const CSS_MODULE_PREFIX = '\0dshx-css-module:'
const CSS_GLOBAL_PREFIX = '\0dshx-css-global:'
const CSS_INLINE_PREFIX = '\0dshx-css-inline:'
const VIRTUAL_SUFFIX = '.mjs'
const INLINE_QUERY = '?inline'
const INLINE_SAFE = /^@deepseek-ai\/dsh-(host-apiproxy|file-reference|session|llm|tools|brand|util-workspace-path)(\/|$)/
const VENDORED_LIBRARY = /^@deepseek-ai\/(cosmokit|schemastery)(\/|$)/
const GENERATED_REMOTE = /^@deepseek-ai\/dsh-[a-z0-9]+(?:-[a-z0-9]+)*\/remote$/

function escapeSpecifier(name) {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function packagePatterns(manifest) {
  const names = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ])
  return [...names].sort().map(name => new RegExp(`^${escapeSpecifier(name)}(/|$)`))
}

function matches(patterns, specifier) {
  return patterns.some(pattern => pattern.test(specifier))
}

function clientDefines(environment) {
  const mode = environment.NODE_ENV ?? 'production'
  const values = {
    'process.env': '{}',
    'process.env.NODE_ENV': JSON.stringify(mode),
    'import.meta.env.MODE': JSON.stringify(mode),
    'import.meta.env': JSON.stringify({ MODE: mode }),
  }
  for (const [name, value] of Object.entries(environment)) {
    if (!name.startsWith('DSH_CLIENT_') || value === undefined) continue
    values[`process.env.${name}`] = JSON.stringify(value)
  }
  return values
}

function styleModule(id, path, css, classMap) {
  const tagId = `${id}/${basename(path)}`
  const source = [
    `const css = ${JSON.stringify(css)};`,
    `const tagId = ${JSON.stringify(tagId)};`,
    "if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {",
    "  const tag = document.createElement('style');",
    `  tag.dataset.plugin = ${JSON.stringify(id)};`,
    '  tag.dataset.pluginCss = tagId;',
    '  tag.textContent = css;',
    '  document.head.appendChild(tag);',
    '}',
  ]
  source.push(classMap === undefined ? 'export {};' : `export default ${JSON.stringify(classMap)};`)
  return source.join('\n')
}

function assetPath(source, importer) {
  return importer === undefined ? source : resolve(dirname(importer), source)
}

const portableOutput = {
  name: 'dsh-grok-goals-portable-output',
  generateBundle(_options, output) {
    const client = output['client.js']
    if (client?.type !== 'chunk') this.error('client.js was not emitted')
    client.code = client.code.replace(
      /^([ \t]*\/\/#region \\0dshx-css-module:).*[\\/]([^/\\\r\n]+\.module\.css\.mjs)(\r?)$/gmu,
      '$1$2$3',
    )
    if (/^.*\/\/#region \\0dshx-css-module:.*[\\/].*$/mu.test(client.code)) {
      this.error('client.js contains a non-portable CSS module path')
    }
  },
}

function cssPlugins(id, requested) {
  return [{
    name: 'dsh-client-bundle-purity',
    resolveId(source) {
      if (!source.startsWith('@deepseek-ai/')) return null
      if (requested.has(source)) return null
      if (VENDORED_LIBRARY.test(source) || INLINE_SAFE.test(source) || GENERATED_REMOTE.test(source)) return null
      throw new Error(
        `client bundle purity: ${JSON.stringify(source)} is not a shared baseline; `
        + 'use a Cordis service/slot, a type-only import, or declare dsh.client.external',
      )
    },
  }, {
    name: 'dsh-css-modules',
    resolveId(source, importer) {
      if (!source.endsWith('.module.css')) return null
      return CSS_MODULE_PREFIX + assetPath(source, importer) + VIRTUAL_SUFFIX
    },
    async load(virtualId) {
      if (!virtualId.startsWith(CSS_MODULE_PREFIX)) return null
      const path = virtualId.slice(CSS_MODULE_PREFIX.length, -VIRTUAL_SUFFIX.length)
      this.addWatchFile(path)
      const source = await readFile(path)
      const { code, exports: cssExports } = transform({
        filename: path,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })
      const classMap = {}
      for (const [local, value] of Object.entries(cssExports ?? {}).sort(([left], [right]) => left.localeCompare(right))) {
        classMap[local] = value.name
      }
      return styleModule(id, path, code.toString(), classMap)
    },
  }, {
    name: 'dsh-css-inline',
    resolveId(source, importer) {
      if (!source.endsWith(`.css${INLINE_QUERY}`)) return null
      const stylesheet = source.slice(0, -INLINE_QUERY.length)
      return CSS_INLINE_PREFIX + assetPath(stylesheet, importer) + VIRTUAL_SUFFIX
    },
    async load(virtualId) {
      if (!virtualId.startsWith(CSS_INLINE_PREFIX)) return null
      const path = virtualId.slice(CSS_INLINE_PREFIX.length, -VIRTUAL_SUFFIX.length)
      this.addWatchFile(path)
      const source = await readFile(path)
      const { code } = transform({ filename: path, code: source, minify: true })
      return `export default ${JSON.stringify(code.toString())};`
    },
  }, {
    name: 'dsh-css-global',
    resolveId(source, importer) {
      if (!source.endsWith('.css') || source.endsWith('.module.css')) return null
      return CSS_GLOBAL_PREFIX + assetPath(source, importer) + VIRTUAL_SUFFIX
    },
    async load(virtualId) {
      if (!virtualId.startsWith(CSS_GLOBAL_PREFIX)) return null
      const path = virtualId.slice(CSS_GLOBAL_PREFIX.length, -VIRTUAL_SUFFIX.length)
      this.addWatchFile(path)
      const source = await readFile(path)
      const { code } = transform({ filename: path, code: source, minify: true })
      return styleModule(id, path, code.toString())
    },
  }]
}

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const requested = new Set([
  ...PLATFORM_MODULES,
  ...(manifest.dsh?.client?.external ?? []),
])
const production = packagePatterns(manifest)

/** Self-contained Host + lazy-CJS client for stock `dsh plugin add`. Does not use DSHX. */
await build({
  cwd: packageRoot,
  config: false,
  name: PACKAGE_ID,
  entry: [HOST_ENTRY],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: specifier => isBuiltin(specifier) || matches(production, specifier),
    alwaysBundle: specifier => !isBuiltin(specifier) && !matches(production, specifier),
  },
})

await build({
  cwd: packageRoot,
  config: false,
  name: `${PACKAGE_ID}/client`,
  entry: { client: CLIENT_ENTRY },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2024',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: specifier => requested.has(specifier),
    alwaysBundle: specifier => !requested.has(specifier),
  },
  define: clientDefines(process.env),
  plugins: [...cssPlugins(PACKAGE_ID, requested), portableOutput],
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})
