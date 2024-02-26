import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import eslint from '@rollup/plugin-eslint';
import terser from "@rollup/plugin-terser";
import cleanup from 'rollup-plugin-cleanup';
// import nodePolyfills from 'rollup-plugin-polyfill-node';
// import buble from "@rollup/plugin-buble";
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
    // {
    //     input: "src/main.js",
    //     // external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream-i2d/blob-stream.js"],
    //     output: [
    //         {
    //             banner,
    //             dir: "dist/modules",
    //             format: "es",
    //             name: "i2d",
    //         },
    //     ],
    //     plugins: [
    //         nodeResolve(),
    //         commonjs({
    //             dynamicRequireRoot: "dist/modules",
    //             dynamicRequireTargets: ['flubber','blob-stream-i2d/blob-stream.js', 'pdfkit/js/pdfkit.standalone.js'],
    //             inlineDynamicImports: true,
    //         }),
    //         eslint({
    //             fix: true,
    //             throwOnError: true,
    //         }),
    //     ],
    // },
    {
        input: "src/main.js",
        // external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream-i2d/blob-stream.js"],
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
                dynamicRequireTargets: ['node_modules/blob-stream-i2d/blob-stream.js', 'node_modules/pdfkit/js/pdfkit.standalone.js'],
                inlineDynamicImports: true,
            }),
            eslint({
                fix: true,
                throwOnError: true,
            }),
        ],
    },
    {
        input: "src/main.js",
        // external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream"],
        // external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream-i2d"],
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
            commonjs(),
            eslint({
                fix: true,
                throwOnError: true,
            }),
        ],
    },
    {
        input: "src/main.js",
        // external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream-i2d/blob-stream.js"],
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
            commonjs(),
            terser(),
            eslint({
                fix: true,
                throwOnError: true,
            }),
        ],
    },
    {
        input: "src/main.js",
        // external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream-i2d"],
        output: [
            {
                banner,
                file: "dist/i2d.min.js",
                format: "umd",
                name: "i2d",
            },
        ],
        plugins: [
            cleanup(),
            nodeResolve(),
            commonjs(),
            terser(),
            eslint({
                fix: true,
                throwOnError: true,
            }),
        ],
    },
];
