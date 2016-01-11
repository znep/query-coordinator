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
//= require moment/moment
//= require d3/d3
//= require socrata-utils/socrata.utils
//= require vector-tile/dist/vectortile
//= require leaflet/dist/leaflet
//= require editor/storytellerUtils
//= require editor/Constants
//= require editor/Actions
//= require editor/init

//= require socrata-visualizations/dist/socrata-visualizations

//TODO We really need to pull these files out of editor/ and into some
//common directory.
//= require editor/componentBase
//= require editor/withLayoutHeightFromComponentData
//= require editor/storytellerJQueryUtils
//= require editor/block-component-renderers/componentSocrataVisualizationColumnChart
//= require editor/block-component-renderers/componentSocrataVisualizationTimelineChart
//= require editor/block-component-renderers/componentSocrataVisualizationFeatureMap
//= require editor/block-component-renderers/componentSocrataVisualizationClassic

// Store setup
//= require editor/SimpleEventEmitter.js
//= require editor/stores/Store.js
//= require editor/stores/WindowSizeBreakpointStore.js
