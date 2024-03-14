import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import eslint from '@rollup/plugin-eslint';
import terser from "@rollup/plugin-terser";
import cleanup from 'rollup-plugin-cleanup';
import packageJson from './package.json' assert { type: "json" };
import nodePolyfills from 'rollup-plugin-polyfill-node';
import replace from '@rollup/plugin-replace';
import inject from '@rollup/plugin-inject';
const version = process.env.VERSION || packageJson.version;
import alias from '@rollup/plugin-alias';

const author = packageJson.author;
const license = packageJson.license;

let __dirname = new URL('.', import.meta.url);

const banner = `/*!
      * i2djs
      * (c) ${new Date().getFullYear()} ${author} (narayanaswamy14@gmail.com)
      * @license ${license}
      */`;

export default [
    {
        input: "src/main.js",
        output: [
            {
                banner,
                dir: "dist",
                format: "es",
                name: "i2d",
                entryFileNames: "i2d.esm.js",
                chunkFileNames: "[name]-bundle-esm.js",
                manualChunks(id) {
                    if (id.includes('node_modules')) {
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
                    if (id.includes('node_modules')) {
                        return 'dependencies';
                    }
                }
            },
            {
                banner,
                dir: "dist",
                format: "cjs",
                name: "i2d",
                entryFileNames: "i2d.cjs"
            }
        ],
        plugins: [
            cleanup(),
            replace({
                preventAssignment: true,
                '__dirname': JSON.stringify(''),
            }),
            alias({
                  entries: [
                    { find: 'inherits', replacement: 'inherits/inherits_browser' },
                    { find: 'fs', replacement: 'pdfkit/js/virtual-fs.js' },
                    { find: 'buffer', replacement: 'buffer/'},
                    { find: 'util', replacement: 'util'},
                    { find: 'events', replacement: 'events'},
                    { find: 'assert', replacement: 'assert'},
                    { find: 'stream', replacement: 'stream-browserify'},
                    { find: 'zlib', replacement: 'browserify-zlib'},
                  ]
                }),
            nodeResolve({
                preferBuiltins: false,
            }),
            commonjs({
                sourceMap: true,
                transformMixedEsModules: true
            }),
            inject({
                process: "process/browser",
                Buffer: ['buffer', 'Buffer'],
                baseDir: true
            }),
            eslint({
                fix: true,
                throwOnError: true,
            })
        ],
    },
    // {
    //     input: "src/main.js",
    //     output: [
    //         {
    //             banner,
    //             file: "dist/i2d.cjs",
    //             format: "cjs",
    //             name: "i2d",
    //         }
    //     ],
    //     plugins: [
    //         cleanup(),
    //         alias({
    //               entries: [
    //                 { find: 'pdfkit', replacement: 'pdfkit/js/pdfkit.standalone.js' },
    //                 { find: './../../data/static-fonts.js', replacement: __dirname.pathname + 'src/data/dumy-static-fonts.js' },
    //               ]
    //             }),
    //         nodeResolve({
    //         }),
    //         commonjs({
    //         }),
    //         eslint({
    //             fix: true,
    //             throwOnError: true,
    //         }),
    //     ],
    // }
];
