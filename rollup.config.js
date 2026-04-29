import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';


export default {
  input: 'src/waterfall-history-card.ts',
  output: {
    file: 'dist/horizontal-waterfall-history-card.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true,
    banner: `/* Waterfall History Card v4.4.1 */`,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      declaration: false,
    }),
    json(),
  ],
};
