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

//= require socrata-visualizations/socrata.visualizations.DataProvider
//= require socrata-visualizations/socrata.visualizations.SoqlDataProvider
//= require socrata-visualizations/socrata.visualizations.GeospaceDataProvider
//= require socrata-visualizations/socrata.visualizations.MetadataProvider
//= require socrata-visualizations/socrata.visualizations.TileserverDataProvider

//= require socrata-visualizations/socrata.visualizations.Visualization
//= require socrata-visualizations/socrata.visualizations.pbf
//= require socrata-visualizations/socrata.visualizations.VectorTileManager
//= require socrata-visualizations/socrata.visualizations.ColumnChart
//= require socrata-visualizations/socrata.visualizations.TimelineChart
//= require socrata-visualizations/socrata.visualizations.FeatureMap

//= require socrata-visualizations/socrata.visualizations.FlyoutRenderer
//= require socrata-visualizations/socrata.visualizations.RowInspector

//= require socrata-visualizations/components/SocrataColumnChart
//= require socrata-visualizations/components/SocrataTimelineChart
//= require socrata-visualizations/components/SocrataFeatureMap

//= require editor/componentEditButton
//= require editor/block-component-renderers/componentSocrataVisualizationColumnChart
//= require editor/block-component-renderers/componentSocrataVisualizationTimelineChart
//= require editor/block-component-renderers/componentSocrataVisualizationFeatureMap
//= require editor/block-component-renderers/componentSocrataVisualizationClassic

// Store setup
//= require editor/SimpleEventEmitter.js
//= require editor/stores/Store.js
//= require editor/stores/WindowSizeBreakpointStore.js
