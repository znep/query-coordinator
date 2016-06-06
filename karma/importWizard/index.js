function requireAll(context) {
  context.keys().forEach(context);
}

window.datasetCategories = ['Business', 'Government'];
window.importableTypes = ['text', 'date', 'date', 'number'];
window.enabledModules = ['geospatial', 'esri_integration'];

// Run all the tests
requireAll(require.context('./components', true, /\.js$/));
