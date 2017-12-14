import _ from 'lodash';
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import components from 'common/components';
import { SoqlHelpers } from 'common/visualizations/dataProviders';

window._ = _;
window.React = React;
window.ReactDOM = ReactDOM;
window.components = components;
window.SoqlHelpers = SoqlHelpers;

$(() => {
  let index = 1;
  while ($(`#example-${index}`).length > 0) {
    const script = '    ' + $(`#example-${index}`).text().trim();
    $(`#styleguide-code-example-${index}`).html($('<pre>').append(script));
    index++;
  }
});
