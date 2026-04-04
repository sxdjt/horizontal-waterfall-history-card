import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';


export default {
  input: 'src/waterfall-history-card.ts',
  output: {
    file: 'dist/horizontal-waterfall-history-card.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true,
    banner: `/* Waterfall History Card v4.3.0-beta.2 */`,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      declaration: false,
    }),
    json(),
    terser({
      format: {
        comments: /^!/,
        preamble: `/* Waterfall History Card v4.3.0-beta.2 */`,
      },
    }),
  ],
};
