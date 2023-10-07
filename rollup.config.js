import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import eslint from '@rbnlffl/rollup-plugin-eslint';
import { terser } from "rollup-plugin-terser";
// import buble from "@rollup/plugin-buble";

const version = process.env.VERSION || require("./package.json").version;
const author = require("./package.json").author;
const license = require("./package.json").license;

const banner = `/*!
      * i2djs
      * (c) ${new Date().getFullYear()} ${author} (narayanaswamy14@gmail.com)
      * @license ${license}
      */`;

export default [
    {
        input: "src/main.js",
        external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream-i2d/blob-stream.js"],
        output: [
            {
                banner,
                file: "dist/i2d.esm.js",
                format: "esm",
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
        ],
    },
    {
        input: "src/main.js",
        // external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream"],
        output: [
            {
                banner,
                file: "dist/i2d.js",
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
        ],
    },
    {
        input: "src/main.js",
        external: ["pdfkit/js/pdfkit.standalone.js", "blob-stream-i2d/blob-stream.js"],
        output: [
            {
                file: "dist/i2d.esm.min.js",
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
                file: "dist/i2d.min.js",
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
        ],
    },
];
