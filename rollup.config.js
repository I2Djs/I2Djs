import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import { eslint } from 'rollup-plugin-eslint';
import { terser } from 'rollup-plugin-terser';
import buble from '@rollup/plugin-buble';

const version = process.env.VERSION || require('./package.json').version;
const author = require('./package.json').author;
const license = require('./package.json').license;

const banner =
	`/*!
      * i2djs v${version}
      * (c) ${new Date().getFullYear()} ${author} (narayanaswamy14@gmail.com)
      * @license ${license}
      */`;

export default [{
	input: 'src/main.js',
	output: [{
		banner,
		file: 'dist/i2d.esm.browser.js',
		format: 'esm',
		name: 'i2d'
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
			fix: true,
			throwOnError: true
		}),
		buble()
	]
}, {
	input: 'src/main.js',
	output: [{
		file: 'dist/i2d.min.js',
		banner,
		format: 'umd',
		name: 'i2d',
		compact: true
	}, {
		file: 'dist/i2d.esm.browser.min.js',
		banner,
		format: 'esm',
		name: 'i2d',
		compact: true
	}],
	plugins: [
		resolve(),
		commonjs(),
		terser(),
		eslint({
			fix: true,
			throwOnError: true
		})]
}, {
	input: 'src/main.js',
	output: [{
		banner,
		file: 'dist/i2d.legacy.min.js',
		format: 'umd',
		name: 'i2d'
	}],
	plugins: [
		resolve(),
		commonjs(),
		eslint({
			fix: true,
			throwOnError: true
		}),
		buble(),
		terser()
	]
}];
