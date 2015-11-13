# Socrata Visualizations

Visualizations that we can share between frontend projects.

## Installation and usage

If you are contributing to this library, run `npm install && bower install` to set up your environment.

To install this library as dependency in another project, run `bower install git@github.com:socrata/frontend-visualizations.git#master --save`. To update, run the same command.

> **NOTE:** Because we are not yet using Git tags in this project, we can't specify semver ranges in the dependencies hash. This also means that a plain `bower install` will not work for this project; the path to this repo's master branch must be explicitly provided! For similar reasons, `bower update` also doesn't work.

This library depends on [frontend-utils](https://github.com/socrata/frontend-utils), [D3](http://d3js.org), [Lodash](https://lodash.com), and [jQuery](https://jquery.com). When using this library as a dependency in another project, you must also include the non-Socrata libraries in your dependencies because they will not be automatically installed by Bower.

To use, add the scripts and stylesheets for the desired functionality via script/link tags or asset pipeline:

* At a minimum, you will need to include `socrata.visualizations.Visualization.js`, upon which all specific instances of visualizations depend, as well as the helper `socrata.utils.js`.
* For each type of visualization you want to use, you will need to include the corresponding script and stylesheet. For example, creating a column chart will require both `socrata.visualizations.ColumnChart.js` and `socrata.visualizations.columnChart.css` to be loaded.
* To support dynamic data queries, you will need to include both `socrata.visualizations.DataProvider.js` and `socrata.visualizations.SoqlDataProvider.js`.

## Testing

* `npm install && bower install && npm test`: Execute the test suite.
* `npm install && bower install && npm run watch`: Automatically run the tests when files change.
* To debug the tests in a browser, run `npm run watch` and open http://localhost:9876/debug.html

## Examples

The `examples` directory contains demos that show how each supported visualization can be consumed.
