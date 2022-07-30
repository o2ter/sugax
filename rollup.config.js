import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import dts from 'rollup-plugin-dts';

const packageJson = require('./package.json');

const rollupPlugins = [
    typescript(),
    babel({
        babelrc: false,
        exclude: 'node_modules/**',
        babelHelpers: 'bundled',
    }),
    commonjs(),
];

const rollupConfig = {
    input: 'src/index',
    external: [
        /node_modules/
    ],
};

export default [
    {
        ...rollupConfig,
        output: [
            {
              file: packageJson.main + '.js',
              format: 'cjs',
              sourcemap: true,
            },
            {
              file: packageJson.module + '.js',
              format: 'esm',
              sourcemap: true,
            },
        ],
        plugins: [
            resolve({
                extensions: [
                    /\.(ts|tsx|m?js)?$/i
                ]
            }),
            ...rollupPlugins
        ],
    },
    {
        ...rollupConfig,
        output: [
            {
                file: packageJson.main + '.web.js',
                format: 'cjs',
                sourcemap: true,
            },
            {
              file: packageJson.module + '.web.js',
              format: 'esm',
              sourcemap: true,
            },
        ],
        plugins: [
            resolve({
                extensions: [
                    /\.web\.(ts|tsx|m?js)?$/i,
                    /\.(ts|tsx|m?js)?$/i
                ]
            }),
            ...rollupPlugins
        ],
    },
    {
        input: 'src/index',
        output: [
            {
                file: 'dist/index.d.ts',
                format: 'es',
            },
        ],
        plugins: [dts()],
    },
];