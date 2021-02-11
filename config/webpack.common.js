var path = require("path"),
  webpack = require("webpack"),
  nodeExternals = require("webpack-node-externals"),
  MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  transformCssModuleBabelPlugin = require("./plugins/transform-css-module.babel");

var htmlTemplate = `<!DOCTYPE html>
<html <%- helmet.htmlAttributes.toString() %> >
  <head>
    <%- helmet.title.toString() %>
    <%- helmet.meta.toString() %>
    <%- helmet.link.toString() %>
  </head>
  <body <%- helmet.bodyAttributes.toString() %> >
    <div id="root"><%- content %></div>
  </body>
  <script>
    window.__PRERENDER_INIT_PAGE_PROPS__ = "<%- initPageProps %>";
  </script>
</html>
`;

/**
 * @type {import("webpack").Configuration}
 */
var serverConfig = {
  mode: process.env.NODE_ENV,
  target: "node",
  entry: {
    server: path.resolve("./src/server.ts"),
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  module: {
    rules: [
      {
        test: (path) => !/\.module\.css$/.test(path) && /\.css$/.test(path),
        use: "ignore-loader",
      },
      {
        test: /module\.css$/,
        use: [
          {
            loader: "css-loader",
            options: {
              modules: true,
            },
          },
          // "postcss-loader",
        ],
      },
      {
        test: /\.(js|jsx|ts|tsx)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    node: "14.15.4",
                  },
                },
              ],
              "@babel/preset-typescript",
              "@babel/preset-react",
            ],
            plugins: [
              ["@babel/plugin-proposal-decorators", { legacy: true }],
              "@babel/plugin-proposal-class-properties",
              transformCssModuleBabelPlugin,
            ],
          },
        },
      },
    ],
  },
  output: {
    path: path.resolve("./build/server"),
  },
  externals: [nodeExternals({ allowlist: ["react"] })],
  plugins: [
    new webpack.CleanPlugin(),
    new webpack.DefinePlugin({
      STATIC_FILE_PATH: String("'../client/static'"),
      ENALBE_SERVER_CLUSTER:
        String(process.env.ENALBE_SERVER_CLUSTER).toLowerCase() === "true",
      SERVER_PORT: Number(process.env.SERVER_PORT),
    }),
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js", "jsx"],
    alias: {
      "@": path.resolve("./src"),
    },
  },
  devtool: false,
  stats: "minimal",
};

/**
 * @type {import("webpack").Configuration}
 */
var clientConfig = {
  mode: process.env.NODE_ENV,
  target: "web",
  entry: {
    index: path.resolve("./src/index.tsx"),
  },
  output: {
    path: path.resolve("./build/client"),
    filename: "static/js/[name].js",
    publicPath: "/",
  },
  plugins: [
    new webpack.CleanPlugin(),
    new MiniCssExtractPlugin({
      filename: "static/css/[name]_[hash].css",
      chunkFilename: "static/css/[id]_[hash].css",
    }),
    new HtmlWebpackPlugin({
      templateContent: htmlTemplate,
      filename: "index.html",
    }),
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js", "jsx"],
    alias: {
      "@": path.resolve("./src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: "> 0.25%, not dead",
                },
              ],
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
            plugins: [
              ["@babel/plugin-proposal-decorators", { legacy: true }],
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-transform-runtime",
            ],
          },
        },
      },
      {
        test: (path) => !/\.module\.css$/.test(path) && /\.css$/.test(path),
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
      {
        test: /module\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: true,
            },
          },
          "postcss-loader",
        ],
      },
    ],
  },
  devtool: false,
  stats: "minimal",
};

module.exports = {
  commonServerConfig: serverConfig,
  commonClientConfig: clientConfig,
};