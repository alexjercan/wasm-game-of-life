const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

module.exports = {
  entry: "./index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "index.html",
    }),
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, "."),
      withTypeScript: true,
    }),
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".wasm"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      },
    ],
  },
  mode: "development",
  experiments: {
    asyncWebAssembly: true,
  },
};
