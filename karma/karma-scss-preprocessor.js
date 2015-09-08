var util = require('util');
var spawn = require('child_process').spawn;

var escapeContent = function(content) {
  return content.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\r?\n/g, '\\n\' +\n    \'');
};

var TEMPLATE = 'angular.module(\'%s\', []).run(function() {\n' +
      'var name = \'%s\';\n' +
      'var style = $("style.scss#" + name);\n' +
      'if (style.length == 0) {\n' +
        '$("head").append("<style id=\'" + name + "\' class=\'scss\'>" + \'%s\' + "</style>");\n' +
      '}\n' +
    '});';

var createScssPreprocessor = function(logger, basePath) {
  config = typeof config === 'object' ? config : {};

  var log = logger.create('preprocessor.scss');

  return function(content, file, done) {
    log.debug('Processing "%s".', file.originalPath);
    var dir = file.originalPath.replace(/\/app\/styles.*/, '') + '/app/styles';
    var htmlPath = file.originalPath.replace(basePath + '/', '').replace('app/styles/', '');
    var scssId = htmlPath.replace(/[/.]/g, '-');

    var child = spawn("bundle", ["exec", "sass", "--scss", "-C", "-I", dir]);
    child.stdin.setEncoding('utf8');
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdin.write('@import "scss-common";\n' + content);

    var data = '';
    child.stdout.on('data', function(buff) {
      data += buff.toString();
    });
    child.stderr.on('data', function(buff) {
      log.error(buff.toString());
    });
    child.on('close', function(code, signal) {
      log.debug('Finished "%s".', file.originalPath);
      done(util.format(TEMPLATE, htmlPath, scssId, escapeContent(data)));
    });
    child.stdin.end();
  };
};

createScssPreprocessor.$inject = ['logger', 'config.basePath'];

module.exports = {
  'preprocessor:scss': ['factory', createScssPreprocessor]
}
