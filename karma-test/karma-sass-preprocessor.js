var util = require('util');
var spawn = require('child_process').spawn;

var escapeContent = function(content) {
  return content.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\r?\n/g, '\\n\' +\n    \'');
};

var TEMPLATE = 'angular.module(\'%s\', []).run(function() {\n' +
      'var name = \'%s\';\n' +
      'var style = $("style.sass#" + name);\n' +
      'if (style.length == 0) {\n' +
        '$("head").append("<style id=\'" + name + "\' class=\'sass\'>" + \'%s\' + "</style>");\n' +
      '}\n' +
    '});';


console.log("Processing SASS. This might take a bit...");

var createSassPreprocessor = function(logger, basePath) {
  config = typeof config === 'object' ? config : {};

  var log = logger.create('preprocessor.sass');

  return function(content, file, done) {
    log.debug('Processing "%s".', file.originalPath);
    var dir = file.originalPath.split("/").slice(0,-2).join("/")+"/";
    var htmlPath = file.originalPath.replace(basePath + '/', '').replace('app/styles/', '');
    var sassId = htmlPath.replace(/[/.]/g, '-');

    var child = spawn("bundle", ["exec", "sass", "-C", "-I", dir]);
    child.stdin.setEncoding = 'utf-8';
    child.stdin.write('@import sass-common\n' + content);

    var data = '';
    child.stdout.on('data', function(buff) {
      data += buff.toString();
    });
    child.stderr.on('data', function(buff) {
      log.error(buff.toString);
    });
    child.on('close', function(code, signal) {
      log.debug('Finished "%s".', file.originalPath);
      done(util.format(TEMPLATE, htmlPath, sassId, escapeContent(data)));
    });
    child.stdin.end();
  };
};

createSassPreprocessor.$inject = ['logger', 'config.basePath'];


module.exports = {
  'preprocessor:sass': ['factory', createSassPreprocessor]
}
