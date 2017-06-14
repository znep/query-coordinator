import _ from 'lodash';
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import components from 'common/components';

window._ = _;
window.React = React;
window.ReactDOM = ReactDOM;
window.components = components;

$(() => {
  let index = 1;
  while ($(`#example-${index}`).length > 0) {
    const script = '    ' + $(`#example-${index}`).text().trim();
    $(`#styleguide-code-example-${index}`).html($('<pre>').append(script));
    index++;
  }
});
