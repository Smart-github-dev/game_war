const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './server.js', // Entry point of your backend code
  target: 'node', // Specify that webpack should build for Node.js environment
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'app.js' // Output file name
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/, // Apply the following rules to .js files
        exclude: /node_modules/, // Exclude node_modules directory
        use: {
          loader: 'babel-loader', // Use babel-loader to transpile ES6 code
          options: {
            presets: ['@babel/preset-env'] // Use @babel/preset-env for transpilation
          }
        }
      }
    ]
  }
};