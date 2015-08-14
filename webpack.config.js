module.exports = {
  entry: './src/driver.js',
  resolve: {
    extensions: ['', '.js']
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: 'babel',
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  output: {
    path: './dist',
    filename: 'cycle-router5.js',
    sourceMapFilename: 'cycle-router5.js.map'
  }
};
