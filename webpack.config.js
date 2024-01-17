const webpackMerge = require('webpack-merge');
const path = require('path');
const baseConfig = require('agora-common-libs/presets/webpack.config.base.js');
const packConfig = require('agora-common-libs/presets/webpack.config.pack.js');
const webpack = require('webpack');
const ROOT_PATH = path.resolve(__dirname, './');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const target = process.env.BUNDLE_TARGET || '';
const entry = {};
if (target.includes('classroom')) {
  entry['edu_widget'] = {
    import: './src/classroom.tsx',
    chunkLoading: false,
  };
}
if (target.includes('proctor')) {
  entry['proctor_widget'] = {
    import: './src/proctor.tsx',
    chunkLoading: false,
  };
}
if (target.includes('scene')) {
  entry['scene_widget'] = {
    import: './src/scene.tsx',
    chunkLoading: false,
  };
}

const config = {
  entry: entry,
  output: {
    path: path.resolve(ROOT_PATH, 'lib'),
    publicPath: './',
    filename: '[name].bundle.js',
    libraryTarget: 'umd',
    // clean: true,
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
      '@components': 'fcr-ui-kit/src/components',
      '@ui-kit-utils': 'fcr-ui-kit/src/utils',
    },
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    // new BundleAnalyzerPlugin(),
  ],
};
const mergedConfig = webpackMerge.merge(baseConfig, packConfig, config);

module.exports = mergedConfig;
