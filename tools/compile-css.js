var path = require('path');
var fs = require('fs');
var sass = require('node-sass');
var chokidar = require('chokidar');
var autoprefixer = require('autoprefixer');
var postcss = require('postcss');

var styleDir = __dirname + '/../src/views/styles/';

function prependStyleDir(filename) {
  return styleDir + filename;
}

function isScss(filename) {
  return /\.scss$/.test(filename);
}

function readFile(filename) {
  return fs.readFileSync(filename, 'utf8');
}

function compileCSS() {
  var scss = fs.readdirSync(styleDir).
    map(prependStyleDir).
    filter(isScss).
    map(readFile).
    join('');

  var result = sass.renderSync({
    data: scss,
    outputStyle: 'compressed',
    includePaths: [__dirname + '/../node_modules']
  });

  postcss([autoprefixer]).process(result.css).then(function(result) {
    result.warnings().forEach(function(warn) {
      console.warn(warn.toString());
    });

    fs.writeFileSync(__dirname + '/../dist/socrata-visualizations.css', result.css);
  });
}

var shouldWatch = process.argv.some(function(arg) {
  return arg === '--watch'
});

if (shouldWatch) {
  var styles = path.join(__dirname, '..', 'src/views/styles/**/*.scss');
  var watcher = chokidar.watch(styles, {persistent: true});

  watcher.
    on('change', function(file) {
      try {
        console.log('File changed: ' + file);
        compileCSS();
        console.log('Compiled successfully!');
      } catch (error) {
        console.log('Compilation failed!');
        console.error(error);
      }
    });
} else {
  compileCSS();
}
