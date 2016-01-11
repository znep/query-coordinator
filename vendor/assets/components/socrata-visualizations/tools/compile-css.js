var fs = require('fs');
var sass = require('node-sass');

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

var scss = fs.readdirSync(styleDir).
  map(prependStyleDir).
  filter(isScss).
  map(readFile).
  join('');

var result = sass.renderSync({
  data: scss,
  outputStyle: 'compressed'
});

fs.writeFileSync(__dirname + '/../dist/socrata-visualizations.css', result.css);
