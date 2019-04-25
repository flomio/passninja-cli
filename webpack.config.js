const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
// const NodemonPlugin = require('nodemon-webpack-plugin')
// const HtmlWebpackPlugin = require('html-webpack-plugin')
// const CopyWebpackPlugin = require('copy-webpack-plugin')

const ENV = process.env.NODE_ENV || 'development'
const PROD = ENV === 'production'

module.exports = () => {
  const config = {
    mode: PROD ? 'production' : 'development',
    entry: './bin/pn.ts',
    target: 'node',
    output: {
      filename: 'pn.js',
      path: path.resolve(__dirname, 'dist')
    },
    resolve: {
      extensions: ['.js', '.ts', '.json'],
      modules: ['node_modules']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true
              }
            }
          ]
        },
        { test: /.*/, loader: 'shebang-loader' }
      ]
    },
    plugins: [new CleanWebpackPlugin(), new ForkTsCheckerWebpackPlugin()]
  }

  if (!PROD) {
    config.devtool = 'source-map'
  }

  return config
}
