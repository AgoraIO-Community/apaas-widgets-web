const webpackMerge = require('webpack-merge');
const path = require('path');
const baseConfig = require('agora-common-libs/presets/webpack.config.base.js');
const ROOT_PATH = path.resolve(__dirname, './');

const config = {
  entry: {
    onlineclass: './src/onlineclass.tsx',
    classroom: './src/classroom.tsx',
    proctor: './src/proctor.tsx',
  },
  output: {
    path: path.resolve(ROOT_PATH, 'lib'),
    publicPath: './',
    filename: '[name].widget.js',
    libraryTarget: 'umd',
    clean: true,
  },
  resolve: {
    alias: {
      '@components': path.resolve(ROOT_PATH, '../agora-scenario-ui-kit/src/components'),
      '@ui-kit-utils': path.resolve(ROOT_PATH, '../agora-scenario-ui-kit/src/utils'),
    },
  },
};
const mergedConfig = webpackMerge.merge(baseConfig, config);
module.exports = mergedConfig;
