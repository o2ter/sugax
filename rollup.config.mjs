import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';

const rollupPlugins = [
  typescript(),
  babel({
    babelrc: false,
    exclude: 'node_modules/**',
    babelHelpers: 'bundled',
  }),
  commonjs({
    transformMixedEsModules: true,
  }),
  json(),
];

const rollupTypes = (name) => ({
  input: `src/${name}`,
  external: [
    /node_modules/
  ],
  output: [
    {
      file: `dist/${name}.d.ts`,
      format: 'es',
    },
  ],
  plugins: [
    resolve({
      extensions: ['.ts', '.tsx', '.mjs', '.js']
    }),
    dts()
  ],
});

export default [
  {
    input: {
      index: 'src/index',
      schema: 'src/schema',
    },
    external: [
      /node_modules/
    ],
    output: [
      {
        entryFileNames: '[name].js',
        chunkFileNames: 'internals/[name]-[hash].js',
        dir: './dist',
        format: 'cjs',
        sourcemap: true,
      },
      {
        entryFileNames: '[name].mjs',
        chunkFileNames: 'internals/[name]-[hash].mjs',
        dir: './dist',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve({
        extensions: ['.ts', '.tsx', '.mjs', '.js']
      }),
      ...rollupPlugins
    ],
  },
  rollupTypes('index'),
  rollupTypes('schema'),
];