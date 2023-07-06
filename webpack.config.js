const webpackMerge = require('webpack-merge');
const path = require('path');
const baseConfig = require('agora-common-libs/presets/webpack.config.base.js');
const packConfig = require('agora-common-libs/presets/webpack.config.pack.js');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const webpack = require('webpack');
const ROOT_PATH = path.resolve(__dirname, './');
console.log(webpack.version);
const config = {
  entry: {
    onlineclass: {
      import: './src/onlineclass.tsx',
      chunkLoading: false,
    },
    classroom: {
      import: './src/classroom.tsx',
      chunkLoading: false,
    },
    proctor: {
      import: './src/proctor.tsx',
      chunkLoading: false,
    },
  },
  output: {
    path: path.resolve(ROOT_PATH, 'lib'),
    publicPath: './',
    filename: '[name].widget.js',
    libraryTarget: 'umd',
    clean: true,
    chunkLoading: false,
  },
  optimization: {
    splitChunks: false,
  },
  module: {
    parser: {
      javascript: {
        dynamicImportMode: 'eager',
      },
    },
  },
  resolve: {
    alias: {
      '@components': 'agora-scenario-ui-kit/src/components',
      '@ui-kit-utils': 'agora-scenario-ui-kit/src/utils',
    },
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
};
const mergedConfig = webpackMerge.merge(baseConfig, packConfig, config);

module.exports = mergedConfig;
