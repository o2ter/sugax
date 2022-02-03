import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import dts from 'rollup-plugin-dts';

const packageJson = require('./package.json');

const rollupPlugins = [
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
                extensions: ['.js']
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
                extensions: ['.web.js', '.js']
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