import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import eslint from '@rbnlffl/rollup-plugin-eslint';
import { terser } from "rollup-plugin-terser";
import buble from "@rollup/plugin-buble";

const version = process.env.VERSION || require("./package.json").version;
const author = require("./package.json").author;
const license = require("./package.json").license;

const banner = `/*!
      * i2djs v${version}
      * (c) ${new Date().getFullYear()} ${author} (narayanaswamy14@gmail.com)
      * @license ${license}
      */`;

export default [
    {
        input: "src/main.js",
        external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream/blob-stream.js"],
        output: [
            {
                banner,
                file: "dist/i2d.esm.browser.js",
                format: "esm",
                name: "i2d",
            },
            // {
            //     banner,
            //     file: "dist/i2d.js",
            //     format: "umd",
            //     name: "i2d",
            // },
        ],
        plugins: [
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
        // external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream"],
        output: [
            {
                banner,
                file: "dist/i2d.legacy.js",
                format: "umd",
                name: "i2d",
            },
        ],
        plugins: [
            nodeResolve(),
            commonjs(),
            eslint({
                fix: true,
                throwOnError: true,
            }),
            // buble({
            //     transforms: { 
            //         dangerousForOf: true,
            //         asyncAwait: false,
            //         // forOf: false,
            //         generator: false,
            //         arrow: true,
            //         modules: false
            //     }
            // }),
        ],
    },
    {
        input: "src/main.js",
        external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream/blob-stream.js"],
        output: [
            // {
            //     file: "dist/i2d.min.js",
            //     banner,
            //     format: "umd",
            //     name: "i2d",
            //     compact: true,
            // },
            {
                file: "dist/i2d.esm.browser.min.js",
                banner,
                format: "esm",
                name: "i2d",
                compact: true,
            },
        ],
        plugins: [
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
        // external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream"],
        output: [
            {
                banner,
                file: "dist/i2d.legacy.min.js",
                format: "umd",
                name: "i2d",
            },
        ],
        plugins: [
            nodeResolve(),
            commonjs(),
            terser(),
            eslint({
                fix: true,
                throwOnError: true,
            }),
            // buble({
            //     transforms: { 
            //         asyncAwait: false,
            //         // forOf: false,
            //         dangerousForOf: true,
            //         generator: false,
            //         arrow: true,
            //         modules: false
            //     }
            // }),
        ],
    },
];
