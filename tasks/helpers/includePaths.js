module.exports = () => {
  return [
    ...require('node-bourbon').includePaths,
    ...require('node-neat').includePaths,
    'node_modules/breakpoint-sass/stylesheets',
    'node_modules/modularscale-sass/stylesheets',
    'docs/stylesheets'
  ];
};
