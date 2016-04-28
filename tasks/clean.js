var gulp = require('gulp');
var rimraf = require('rimraf').sync;

module.exports = () => rimraf('dist');
