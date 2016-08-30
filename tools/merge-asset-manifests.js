var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var buildDir = path.resolve(__dirname, '../public/javascripts/build');

function getManifestPath(webpackBundle) {
  return path.resolve(__dirname, '../public/javascripts/build', webpackBundle, 'manifest.json');
}

var manifest = fs.readdirSync(buildDir).
  map(getManifestPath).
  map(_.partial(fs.readFileSync, _, 'utf8')).
  map(JSON.parse).
  reduce(_.merge);

// Write out a top level manifest.json that is the result of merging each individual manifest.
fs.writeFileSync(path.resolve(buildDir, 'manifest.json'), JSON.stringify(manifest));
