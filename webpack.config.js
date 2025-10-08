const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/background.js',
  output: {
    filename: 'background.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  optimization: {
    minimize: true
  },
  devtool: false,
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'action.html', to: 'action.html' },
        { from: 'options.js', to: 'options.js' },
        { from: 'styles.css', to: 'styles.css' },
        { from: 'openpims.png', to: 'openpims.png' },
      ],
    }),
  ],
};
