const autoprefixer = require('autoprefixer');
const tailwindcss = require('tailwindcss');
const tailwindConfig = require('./tailwind.config');
const plugin = require('agora-common-libs/presets/postcss-plugin/px-to-vw/index.js');

module.exports = {
  plugins: [autoprefixer(), tailwindcss(tailwindConfig), plugin],
};
