module.exports = {
  context: __dirname,
  devtool: 'eval', // eval is faster than source-map
  entry: `${__dirname}/src/js/index.js`,
  externals: {
    'react': {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react',
    },
    'tether-shepherd': {
      root: 'Shepherd',
      commonjs2: 'tether-shepherd',
      commonjs: 'tether-shepherd',
      amd: 'tether-shepherd'
    },
    jquery: true
  },
  output: {
    path: `${__dirname}/dist/js`,
    filename: 'styleguide.js',
    libraryTarget: 'umd',
    library: 'styleguide'
  },
  resolve: {
    modulesDirectories: ['node_modules']
  },
  module: {
    loaders: [
      {
        loader: 'babel?cacheDirectory',
        test: /\.js$/,
        exclude: /node_modules/
      }
    ]
  },
  plugins: []
};
