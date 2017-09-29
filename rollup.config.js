import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
// import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default [
  {
    input: 'src/index.js',
    output: [
      {file: pkg.main, format: 'cjs'},
      {file: pkg.module, format: 'es'},
    ],
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      /*
      json({
        // All JSON files will be parsed by default,
        // but you can also specifically include/exclude files
        include: 'node_modules/**',
        // exclude: ['node_modules/foo/**', 'node_modules/bar/**'],

        // for tree-shaking, properties will be declared as
        // variables, using either `var` or `const`
        preferConst: true, // Default: false

        // specify indentation for the generated default export —
        // defaults to '\t'
        indent: '  ',
      }),
      */
      babel({
        // include: ['**/*.js'],
        exclude: 'node_modules/**', // only transpile our source code
        plugins: ['external-helpers'],
      }),
    ],
    external: [
    ],
  },
];
