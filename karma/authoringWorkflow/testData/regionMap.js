export default () => ({
  "format": {
    "type": "visualization_interchange_format",
    "version": 2
  },
  "configuration": {
    "baseLayerUrl": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    "baseLayerOpacity": 0.3,
    "computedColumnName": ":@computed_region_w797_miex",
    "legend": {
      "type": "continuous",
      "negativeColor": "#c8c8c8",
      "zeroColor": "#bdbdbd",
      "positiveColor": "#2c2c2c"
    },
    "shapefile": {
      "geometryLabel": "s_hood",
      "primaryKey": "objectid",
      "uid": "w797-miex"
    },
    "viewSourceDataLink": true
  },
  "description": "I know where I want to go",
  "series": [
    {
      "color": {},
      "dataSource": {
        "datasetUid": "k6cs-ww27",
        "dimension": {
          "columnName": "incident_location",
          "aggregationFunction": null
        },
        "domain": "vertex-stories.test-socrata.com",
        "measure": {
          "columnName": null,
          "aggregationFunction": "count"
        },
        "type": "socrata.soql",
        "filters": []
      },
      "label": null,
      "type": "regionMap",
      "unit": {
        "one": "Home",
        "other": "Homes"
      }
    }
  ],
  "title": "First Day of My Life"
});