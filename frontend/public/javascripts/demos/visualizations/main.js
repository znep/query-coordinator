// The visualization examples started life as plain HTML files that pulled in static javascript.
// However, this arrangement lives outside of how the rest of the platform manages javascript assets,
// so the examples were pulled into frontend to alleviate maintenance costs.
//
// When we have some time, we should move the javascript that exists as inline <script> tags
// in app/views/demos/visualizations into .js files in this folder. Currently, the inlined
// example javascript cannot be linted or use ES6 features such as imports or arrow functions.
//
// The current purpose of this file is to provide a compatibility shim between our ES6-world
// and the environment the example pages expect.

// Compatibility shim for example page's inability to import packages for itself.
require('demos/visualizations/sample-vifs');
window._ = require('lodash');
window.socrata = window.socrata || {};
window.socrata.visualizations = require('common/visualizations');
window.socrata.AuthoringWorkflow = require('common/authoring_workflow');
window.socrata.generateEmbedCode = require('visualization_embed/embedCodeGenerator').default; //eslint-disable-line dot-notation

// These two are just for visualization_component.html.erb
window.react = window.React = require('react');
window['react-dom'] = window.ReactDOM = require('react-dom');
