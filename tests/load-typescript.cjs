const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

// Tests execute the real source with installed dependencies, without a build.
exports.loader = (mocks = {}) => {
  const cache = new Map()
  const root = path.resolve(__dirname, '..')
  function load(filename) {
    const absolute = path.resolve(root, filename)
    if (!absolute.startsWith(root + path.sep)) throw Error('Source outside Manager')
    if (cache.has(absolute)) return cache.get(absolute).exports
    const loadedModule = { exports: {} }
    cache.set(absolute, loadedModule)
    const localRequire = Module.createRequire(absolute)
    const resolve = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name]
      if (name.startsWith('@/') || name.startsWith('.')) {
        const candidate = name.startsWith('@/')
          ? path.join(root, name.slice(2))
          : path.resolve(path.dirname(absolute), name)
        for (const extension of ['', '.ts', '.tsx']) {
          const source = candidate + extension
          if (fs.existsSync(source) && /\.tsx?$/.test(source)) return load(source)
        }
      }
      return localRequire(name)
    }
    const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText
    new Function('require', 'module', 'exports', js)(resolve, loadedModule, loadedModule.exports)
    return loadedModule.exports
  }
  return load
}
