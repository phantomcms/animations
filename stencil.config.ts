import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'shift',
  taskQueue: 'async',
  tsconfig:
    process.env.NODE_ENV === 'production'
      ? 'tsconfig-prod.json'
      : 'tsconfig.json',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
};
