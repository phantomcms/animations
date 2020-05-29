import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'shift',
  taskQueue: 'async',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      copy: [{ src: '../readme.md' }, { src: '../package.json' }],
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
};
