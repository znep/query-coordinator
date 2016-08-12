require('shelljs/global');
var path = require('path');
var _ = require('lodash');

var componentName = _.upperFirst(process.argv[2]);
var componentPath = `${__dirname}/../src/js/components/${componentName}`;
var relativePath = path.relative(`${__dirname}/..`, componentPath);
echo(`Creating component ${componentName} at ${relativePath}`);

if (test('-d', 'src/js/components/' + componentName)) {
  echo('Error! Component already exists 💣');
  exit(1);
}

mkdir('-p', componentPath);
mkdir('-p', `${__dirname}/../test/js/components`);

var componentTemplate = _.template(cat(`${__dirname}/templates/component.template`));
var stylesTemplate = _.template(cat(`${__dirname}/templates/styles.template`));
var testTemplate = _.template(cat(`${__dirname}/templates/test.template`));

var component = componentTemplate({ name: componentName });
var styles = stylesTemplate({ name: _.kebabCase(componentName) });
var spec = testTemplate({ name: componentName });

component.to(`${componentPath}/index.js`);
styles.to(`${componentPath}/index.scss`);
spec.to(`test/js/components/${componentName}Test.js`);

echo('Success 👍');
