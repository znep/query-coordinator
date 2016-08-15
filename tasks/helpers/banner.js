var packageJson = require('../../package.json');

module.exports = () => [
  '/*!',
  ` * Socrata Styleguide v${packageJson.version}`,
  ` * Copyright 2015-${(new Date).getFullYear()} ${packageJson.author}`,
  ` * Licensed under ${packageJson.license}`,
  ' */\n\n'
].join('\n');
