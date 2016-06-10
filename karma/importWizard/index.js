function requireAll(context) {
  context.keys().forEach(context);
}

window.datasetCategories = ['Business', 'Government'];
window.importableTypes = ['text', 'date', 'date', 'number'];
window.enabledModules = ['geospatial', 'esri_integration'];
window.I18n = require('mockTranslations');

// Run all the tests
requireAll(require.context('./components', true, /\.js$/));
