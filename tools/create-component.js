require('shelljs/global');
var path = require('path');
var _ = require('lodash');

var componentName = _.upperFirst(process.argv[2]);
var componentNameKebabCase = _.kebabCase(componentName);
var componentNameSnakeCase = _.snakeCase(componentName);
var componentPath = `${__dirname}/../src/js/components/${componentName}`;
var relativePath = path.relative(`${__dirname}/..`, componentPath);
var guideMenuPath = 'pages/_guide_menu.erb';
var componentsPath = 'pages/components.html.erb';

var mustaches = /{{([\s\S]+?)}}/g;
var templateToken = '<!-- TEMPLATE_TOKEN (Don\'t remove this. Like seriously.) -->';
var templateTokenEscaped = '<!-- TEMPLATE_TOKEN \\(Don\'t remove this\\. Like seriously\\.\\) -->';

// Set interpolation to mustache templating.
_.templateSettings.evaluate = mustaches;
_.templateSettings.interpolate = mustaches;

function buildJSComponentFile() {
  var componentTemplate = _.template(cat(`${__dirname}/templates/component.template`));
  var component = componentTemplate({ name: componentName });

  component.to(`${componentPath}/index.js`);
}

function buildStylesFile() {
  var stylesTemplate = _.template(cat(`${__dirname}/templates/styles.template`));
  var styles = stylesTemplate({ name: componentNameKebabCase });

  styles.to(`${componentPath}/index.scss`);
}

function buildTestFile() {
  var testTemplate = _.template(cat(`${__dirname}/templates/test.template`));
  var spec = testTemplate({ name: componentName });

  spec.to(`test/js/components/${componentName}Test.js`);
}

function buildDocFiles() {
  var componentBaseTemplate = _.template(cat(`${__dirname}/templates/component-pages.template`));
  var componentSkeletonTemplate = _.template(cat(`${__dirname}/templates/component-skeleton-pages.template`));

  var componentBase = componentBaseTemplate({
    kebabCase: componentNameKebabCase
  });

  var componentSkeleton = componentSkeletonTemplate({
    name: componentName,
    kebabCase: componentNameKebabCase
  });

  componentBase.to(`pages/components/_${componentNameSnakeCase}.erb`);
  componentSkeleton.to(`pages/components/skeletons/_${componentNameSnakeCase}.erb`);
}

function addToGuideMenu() {
  var guideMenuListItemTemplate = _.template(cat(`${__dirname}/templates/guide-menu-list-item.template`));
  var guideMenuListItem = guideMenuListItemTemplate({
    name: componentName,
    id: componentNameKebabCase
  });

  var guideMenu = cat(`${__dirname}/../${guideMenuPath}`);
  var guideMenuRegExp = new RegExp(`(\\s*)${templateTokenEscaped}`);

  var lines = guideMenu.split('\n');
  var index = _.findIndex(lines, (line) => guideMenuRegExp.test(line));
  var indentation = lines[index].match(guideMenuRegExp)[1];

  guideMenuListItem = _.chain(guideMenuListItem).
    split('\n').
    filter((line) => line.length > 0).
    map((line) => indentation + line).
    join('\n').
    value();

  lines.
    splice(index, 0, guideMenuListItem);

  lines.
    join('\n').
    to(guideMenuPath);
}

function addToComponents() {
  var componentsTemplate = _.template(cat(`${__dirname}/templates/components.template`));
  var components = componentsTemplate({
    name: componentName,
    id: componentNameKebabCase,
    partial: componentNameSnakeCase
  });

  var componentsHtml = cat(`${__dirname}/../${componentsPath}`);
  var componentsHtmlRegExp = new RegExp(`(\\s*)${templateTokenEscaped}`);

  var lines = componentsHtml.split('\n');
  var index = _.findIndex(lines, (line) => componentsHtmlRegExp.test(line));
  var indentation = lines[index].match(componentsHtmlRegExp)[1];

  components = _.chain(components).
    split('\n').
    filter((line) => line.length > 0).
    map((line) => indentation + line).
    join('\n').
    value();

  lines.
    splice(index, 0, components + '\n');

  lines.
    join('\n').
    to(componentsPath);
}

echo(`Creating component ${componentName} at ${relativePath}`);

if (test('-d', 'src/js/components/' + componentName)) {
  echo('Error! Component already exists 💣');
  exit(1);
}

mkdir('-p', componentPath);
mkdir('-p', `${__dirname}/../test/js/components`);

buildJSComponentFile();
buildStylesFile();
buildTestFile();
buildDocFiles();
addToGuideMenu();
addToComponents();

echo('Success 👍');
