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
        external: [ 'stackblur-canvas', '@juggle/resize-observer', 'blob-stream-i2d'],
        output: [
            {
                banner,
                dir: "dist",
                format: "es",
                name: "i2d",
                entryFileNames: "i2d.esm.js",
                chunkFileNames: "[name]-bundle-esm.js",
                manualChunks(id) {
                    if (id.includes('node_modules/pdfkit') || id.includes('node_modules/flubber') || id.includes('node_modules/earcut') || id.includes('node_modules/earcut')) {
                      return 'dependencies';
                    }
                }
            },
            {
                banner,
                dir: "dist",
                format: "es",
                name: "i2d",
                entryFileNames: "i2d.esm.min.js",
                chunkFileNames: "[name]-bundle-esm.js",
                compact: true,
                plugins: [terser()],
                manualChunks(id) {
                    if (id.includes('node_modules/pdfkit') || id.includes('node_modules/flubber') || id.includes('node_modules/earcut')) {
                      return 'dependencies';
                    }
                }
            }
        ],
        plugins: [
            cleanup(),
            nodeResolve(),
            commonjs({
                // dynamicRequireTargets: [ 'node_modules/pdfkit/js/pdfkit.standalone.js'],
                // inlineDynamicImports: true,
                // sourceMap: false,
                // transformMixedEsModules: true
            }),
            eslint({
                fix: true,
                throwOnError: true,
            })
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
];
