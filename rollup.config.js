import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import { eslint } from 'rollup-plugin-eslint';
import { terser } from 'rollup-plugin-terser';
import buble from 'rollup-plugin-buble';

const version = process.env.VERSION || require('./package.json').version;
const author = require('./package.json').author;
const license = require('./package.json').license;
const banner =
	`/*!
      * i2djs v${version}
      * (c) ${new Date().getFullYear()} ${author}
      * @license ${license}
      */`;

export default [{
	input: 'src/main.js',
	output: [{
		banner,
		file: 'dist/i2d.esm.js',
		format: 'esm'
	}, {
		banner,
		file: 'dist/i2d.js',
		format: 'umd',
		name: 'i2d'
	}],
	plugins: [
		resolve(),
		commonjs(),
		eslint({
			/* your options */
			fix: true,
			throwOnError: true
		})]
}, {
	input: 'src/main.js',
	output: [{
		banner,
		file: 'dist/i2d.legacy.js',
		format: 'umd',
		name: 'i2d'
	}],
	plugins: [
		resolve(),
		commonjs(),
		eslint({
			/* your options */
			fix: true,
			throwOnError: true
		}),
		buble()]
}, {
	input: 'src/main.js',
	output: [{
		file: 'dist/i2d.min.js',
		banner,
		format: 'umd',
		name: 'i2d',
		compact: true
	}],
	plugins: [
		resolve(),
		commonjs(),
		terser(),
		eslint({
			/* your options */
			fix: true,
			throwOnError: true
		})]
}];
