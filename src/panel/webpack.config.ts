const webpack = require('webpack');
const path = require("path");

module.exports = {
  entry: {
    "injectPanel": [
      path.resolve(__dirname, "dist/panel/browser/polyfills.js"),
      path.resolve(__dirname, "dist/panel/browser/styles.css"),
      path.resolve(__dirname, "dist/panel/browser/main.js"),
    ],
  },
  output: { filename: "[name].js", path: path.resolve(__dirname, "../../build") },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    })
  ]
};
