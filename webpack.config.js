var webpack = require('webpack')
var path = require('path')
// var PROD = JSON.parse(process.env.PROD_ENV || '0')

var ESClientConfig = {
  entry: './src/renderer.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'i2d.esm.js',
    library: 'i2d',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
        options: {
          // eslint options (if necessary)
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  }
}

var ClientConfig = {
  entry: './src/renderer.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'i2d.js',
    library: 'i2d',
    libraryTarget: 'umd',
    umdNamedDefine: true
  }
}

var ClientMinConfig = {
  entry: './src/renderer.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'i2d.min.js',
    library: 'i2d',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      minimize: true
    })
  ]
}

module.exports = [ESClientConfig, ClientConfig, ClientMinConfig]

// {
//   entry: './src/renderer.js',
//   output: {
//     path: path.resolve(__dirname, 'dist'),
//     filename: 'i2d.min.js',
//     library: 'i2d',
//     libraryTarget: 'umd',
//     umdNamedDefine: true
//   },
//   module: {
//     rules: [
//       {
//         test: /\.js$/,
//         exclude: /node_modules/,
//         use: {
//           loader: 'babel-loader',
//           options: {
//             presets: ['env']
//           }
//         }
//       }
//     ]
//   },
//   plugins: [
//     new webpack.optimize.UglifyJsPlugin({
//       minimize: true
//     })
//   ]
// }
