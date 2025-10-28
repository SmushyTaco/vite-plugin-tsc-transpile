# Vite Plugin Tsc Transpile

This Vite plugin makes it so the official TypeScript compiler is used instead of esbuild!

## Installation

If you don't need declaration files you'd do:

```shell
$ npm install vite-plugin-tsc-transpile typescript --save-dev
```

If you do need declaration files you'd do:

```shell
$ npm install vite-plugin-tsc-transpile vite-plugin-dts typescript --save-dev
```

## Usage

If you don't need declaration files you'd do:

```ts
import { defineConfig } from 'vite';
import viteTscPlugin from 'vite-plugin-tsc-transpile';

export default defineConfig({
  plugins: [viteTscPlugin()]
});
```

If you do need declaration files you'd do:

```ts
import { defineConfig } from 'vite';
import viteTscPlugin from 'vite-plugin-tsc-transpile';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [viteTscPlugin(), dts()]
});
```

## Options

```ts
viteTscPlugin({ tsConfigPath: './tsconfig.json' });
```

- `tsConfigPath` is an optional parameter that specifies the path of the tsconfig you'd like to use.
