const autoprefixer = require('autoprefixer');
const tailwindcss = require('tailwindcss');
const tailwindConfig = require('./tailwind.config');
const plugin = require('agora-common-libs/presets/postcss-plugin/px-to-vw/index.js');

module.exports = {
  plugins: [
    tailwindcss(tailwindConfig),
    plugin({
      viewportWidth: 375,
      unitPrecision: 5,
      viewportUnit: 'vw',
      fontViewportUnit: 'vw',
      include: [/\/mobile\//, /\.mobile\./],
      exclude: [/\/node_modules\//i],
      landscape: true, // 是否处理横屏情况
      landscapeUnit: 'vw', // (String) 横屏时使用的单位
      landscapeWidth: 812, // (Number) 横屏时使用的视口宽度
      landscapeHeight: 375, // (Number) 横屏时使用的视口宽度
    }),
    autoprefixer(),
  ],
};
