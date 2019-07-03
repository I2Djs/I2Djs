import resolve from 'rollup-plugin-node-resolve'
import { eslint } from 'rollup-plugin-eslint'
import { terser } from 'rollup-plugin-terser'

export default [{
  input: 'src/main.js',
  output: [{
    file: 'dist/i2d.esm.js',
    format: 'esm'
  }, {
    file: 'dist/i2d.js',
    format: 'umd',
    name: 'i2d'
  }],
  plugins: [
    resolve(),
    eslint({
      /* your options */
      fix: true,
      throwOnError: true
    }) ]
}, {
  input: 'src/main.js',
  output: [{
    file: 'dist/i2d.min.js',
    format: 'umd',
    name: 'i2d',
    compact: true
  }],
  plugins: [
    resolve(),
    terser(),
    eslint({
      /* your options */
      fix: true,
      throwOnError: true
    }) ]
}]
