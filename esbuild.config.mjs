// esbuild.config.js (use .mjs if this does not work)
import { build } from "esbuild"

const nodeModulePlugin = {
    name: 'node-module-plugin',
    setup(build) {
        build.onResolve({ filter: /\.node$/ }, args => { 
            // Return the path to the .node file as an external dependency
            return { path: args.path, external: true };
        });
    }
};

build({
  entryPoints: ['./server/index.ts'],
  bundle: true,
  platform: 'node',
  outdir: 'dist/',
  plugins: [
    nodeModulePlugin,
  ],
}).catch(() => process.exit(1));