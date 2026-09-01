import { readFileSync } from 'fs';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

// Read the version from package.json so the bundle banner cannot drift out of
// date the way a hardcoded string does (it sat at v4.9.0 across two releases).
const { version: packageVersion } = JSON.parse(readFileSync('./package.json', 'utf8'));


export default {
  input: 'src/waterfall-history-card.ts',
  output: {
    file: 'dist/horizontal-waterfall-history-card.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true,
    banner: `/* Waterfall History Card v${packageVersion} */`,
    // Defines the CARD_VERSION referenced by the console banner in the card
    // source, which is declared but never assigned there.
    intro: `const CARD_VERSION = ${JSON.stringify(packageVersion)};`,
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
