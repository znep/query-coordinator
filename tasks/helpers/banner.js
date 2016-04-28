var package = require('../../package.json');

module.exports = () => {
  return [
    '/*!',
    ` * Socrata Styleguide v${package.version}`,
    ` * Copyright 2015-${(new Date).getFullYear()} ${package.author}`,
    ` * Licensed under ${package.license}`,
    ' */\n\n'
  ].join('\n');
};
