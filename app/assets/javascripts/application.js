// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//

//= require jquery2
//= require lodash
//= require d3/d3
//= require socrata-utils/socrata.utils
//= require editor/storytellerUtils
//= require editor/StringExtensions.js
//= require editor/Constants
//= require editor/Actions
//= require editor/init
//= require socrata-visualizations/socrata.visualizations.DataProvider
//= require socrata-visualizations/socrata.visualizations.SoqlDataProvider
//= require socrata-visualizations/socrata.visualizations.Visualization
//= require socrata-visualizations/socrata.visualizations.ColumnChart
//= require editor/renderers/FlyoutRenderer.js
//= require editor/components/SocrataVisualizationColumnChart.js
//= require editor/block-component-renderers/componentSocrataVisualizationColumnChart.js

// Store setup
//= require editor/SimpleEventEmitter.js
//= require editor/stores/Store.js
//= require editor/stores/WindowSizeBreakpointStore.js

// Finally, intialize
//= require_tree ./view
