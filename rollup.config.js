import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import eslint from '@rollup/plugin-eslint';
import terser from "@rollup/plugin-terser";
import cleanup from 'rollup-plugin-cleanup';
import packageJson from './package.json' assert { type: "json" };
const version = process.env.VERSION || packageJson.version;

const author = packageJson.author;
const license = packageJson.license;

const banner = `/*!
      * i2djs
      * (c) ${new Date().getFullYear()} ${author} (narayanaswamy14@gmail.com)
      * @license ${license}
      */`;

export default [
    {
        input: "src/main.js",
        external: ['stackblur-canvas', 'blob-stream-i2d', '@juggle/resize-observer'],
        output: [
            {
                banner,
                file: "dist/i2d.esm.js",
                format: "es",
                name: "i2d",
            },
        ],
        plugins: [
            cleanup(),
            nodeResolve(),
            commonjs({
                dynamicRequireTargets: [ 'node_modules/pdfkit/js/pdfkit.standalone.js'],
                inlineDynamicImports: true,
                sourceMap: false,
                transformMixedEsModules: true
            }),
            eslint({
                fix: true,
                throwOnError: true,
            }),
        ],
    },
    {
        input: "src/main.js",
        output: [
            {
                banner,
                file: "dist/i2d.js",
                format: "umd",
                name: "i2d"
            },
        ],
        plugins: [
            cleanup(),
            nodeResolve(),
            commonjs({
                dynamicRequireTargets: ['node_modules/pdfkit/js/pdfkit.standalone.js'],
                inlineDynamicImports: true,
                sourceMap: false,
                transformMixedEsModules: true
            }),
            eslint({
                fix: true,
                throwOnError: true,
            }),
        ],
    },
    {
        input: "src/main.js",
        external: ['stackblur-canvas', 'blob-stream-i2d', '@juggle/resize-observer'],
        output: [
            {
                file: "dist/i2d.esm.min.js",
                banner,
                format: "es",
                name: "i2d",
                compact: true,
            },
        ],
        plugins: [
            cleanup(),
            nodeResolve(),
            commonjs({
                dynamicRequireTargets: [ 'node_modules/pdfkit/js/pdfkit.standalone.js'],
                inlineDynamicImports: true,
                sourceMap: false,
                transformMixedEsModules: true
            }),
            terser(),
            eslint({
                fix: true,
                throwOnError: true,
            }),
        ],
    },
    {
        input: "src/main.js",
        output: [
            {
                banner,
                file: "dist/i2d.min.js",
                format: "umd",
                name: "i2d",
                compact: true
            },
        ],
        plugins: [
            cleanup(),
            nodeResolve(),
            commonjs({
                dynamicRequireTargets: ['node_modules/pdfkit/js/pdfkit.standalone.js'],
                inlineDynamicImports: true,
                sourceMap: false,
                transformMixedEsModules: true
            }),
            terser(),
            eslint({
                fix: true,
                throwOnError: true,
            }),
        ],
    },
];
