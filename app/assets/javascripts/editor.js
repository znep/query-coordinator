// This is a manifest file that'll be compiled into editor.js, which will include all the files
// under the editor directory.
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
//= require squire-rte/build/squire
//= require eventEmitter/EventEmitter
//= require eventie/eventie
//= require unipointer/unipointer
//= require unidragger/unidragger
//= require jQuery-sidebar/src/jquery.sidebar
//= require socrata-utils/socrata.utils
//= require vector-tile/dist/vectortile
//= require leaflet/dist/leaflet

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

//= require editor/init
//= require editor/storytellerUtils
//= require editor/SimpleEventEmitter
//= require editor/stores/Store
//= require_tree ./editor
