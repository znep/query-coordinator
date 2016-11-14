# The Visualization Interchange Format (vif)
The current version of vif is 2. All new visualizations should read from version 2 vifs natively, and where they may emit a `SOCRATA_VISUALIZATION_VIF_UPDATED` event, should attach version 2 vifs as the payload to that event.

The `SvgVisualization` base class will automatically migrate version 1 vifs to version 2 internally and expose the migrated version 2 vif back to the visualization implementation inheriting from it.

In some cases, it may be preferable to synthesize a vif at runtime based on user options as opposed to reading from one that has been persisted; in either case be careful to observe that all of the required properties are present. At the present time there may not be runtime assertions against all required properties but omitting them may cause undefined behavior.

An explanation of the version 2 vif format follows.

## Top Level Structure
```
{
  configuration: <configuration object (see below)>,
  createdAt: <ISO-8601 timestamp as string>,
  description: <string> or <null>,
  format: <format object (see below)>,
  series: <series array (see below)>,
  title: <string> or <null>
}
```

The `createdAt` field should be filled out with the datetime of the artifact's creation. If it is already set in a persisted vif, it should not be updated; if changes are made to the vif at runtime it should be considered the creation of a new vif, not the update of an existing one.

If the `description` or `title` properties are strings, they will be rendered automatically by the `SvgVisualization` base class; if they are null they will not be rendered. The `SvgVisualization` base class will furthermore automatically adjust the size of the container provided to the visualization implementation based on the presence or absence of a description or title.

### The `configuration` Object
The configuration object is used as an unstructured key-value store with the exception of the required `axisLabels` field.

*NOTE: One of the goals of a vif 2 -> vif 3 transition will be to standardize the naming of these properties. As such, they are liable to change over the long term. Any change in vif version will be accompanied by an automatic migration mapping the old property names to the new ones.*

The following list of configuration properties is presented in alphabetical order.

##### `axisLabels`
`axisLabels` controls whether or not to render axis labels on the chart. It is of type `<object>` This object has four optional properties:

* `top` controls the rendering of the top axis label. It is of type `<string>` or `<null>`. If it is of type `<string>`, the `SvgVisualization` base class will render the top axis label with the provided value.

* `right` controls the rendering of the right axis label. It is of type `<string>` or `<null>`. If it is of type `<string>`, the `SvgVisualization` base class will render the top axis label with the provided value.

* `bottom` controls the rendering of the bottom axis label. It is of type `<string>` or `<null>`. If it is of type `<string>`, the `SvgVisualization` base class will render the top axis label with the provided value.

* `left` controls the rendering of the left axis label. It is of type `<string>` or `<null>`. If it is of type `<string>`, the `SvgVisualization` base class will render the top axis label with the provided value.

The following example would cause left and bottom axis labels to be drawn and the top and right axis labels to not be drawn:

```
{
  configuration: {
    axisLabels: {
      top: null,
      right: null,
      bottom: 'Bottom Axis Label',
      left: 'Left Axis Label'
    }
  }
}
```

Required |Optional
:-------:|:----------------------------------------------------------------------:
    -    |Column Chart, Feature Map, Histogram, Region Map, Table, Timeline Chart

##### `measureAxisMinValue`
`measureAxisMinValue` sets minimum value for measure axis. Overrides configuration.yAxisScalingMode.showZero as false.

Required |Optional
:-------:|:----------------------:
    -    |Column Chart, Timeline Chart, Histogram, Bar Chart

##### `measureAxisMaxValue`
`measureAxisMaxValue` sets maximum value for measure axis. Overrides configuration.yAxisScalingMode.showZero as false.

Required |Optional
:-------:|:----------------------:
    -    |Column Chart, Timeline Chart, Histogram, Bar Chart

##### `baseLayerOpacity`
`baseLayerOpacity` is the value that will be used as the css `opacity` value for map tiles. Its type is `<number>` and it must be in the range [0, 1].

Required |Optional
:-------:|:----------------------:
    -    |Feature Map, Region Map

##### `baseLayerUrl`
`baseLayerUrl` is a URL template that the mapping library will use to generate the `src` attribute for base layer tile `<img>` elements. Its type is `<string>` and it should be templatized in the standard format: for Leaflet (the mapping library currently used by this project) documentation on the URL template can be found at: http://leafletjs.com/reference.html#tilelayer.

If this property is omitted, the Feature Map and Region Map will use the following base layer url by default:

```
'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png'
```

Required |Optional
:-------:|:----------------------:
    -    |Feature Map, Region Map

##### `bucketType`
`bucketType` overrides logic in the implementation of the Histogram that determines an appropriate bucketing strategy based on features of the data. Its type is `<string>`.

Accepted values are `'linear'` and `'logarithmic'`; currently queries requesting logarithmic buckets will actually cause buckets to be created in a way that is similar to, but not actually, logarithmic bucketing. As such, only the `'linear'` bucket type should be considered to be fully supported.

Required  |Optional
:--------:|:-------:
Histogram |    -

##### `computedColumnName`
`computedColumnName` is the name of the georegion-encoded column in the dataset specified by the first series in the vif that should be used to map values to regions. Its type is `<string>` and it must be the name of a 'computed' column in the current dataset. 

Required   |Optional
:---------:|:-------:
Region Map |    -

##### `legend`
`legend` overrides default rendering options for the Region Map legend. Its type is `object`. This object must have the following properties:

* The `positiveColor` property controls the color to which the maximum value in the data is mapped. Its type is `<string>` and it must be a valid CSS color declaration (e.g. `#ff0000`, `rgb(255, 0, 0)` or `rgba(255, 0, 0, 1.0)`).

* The `negativeColor` property controls the color to which the minimum value in the data is mapped. Its type is `<string>` and it must be a valid CSS color declaration (e.g. `#ff0000`, `rgb(255, 0, 0)` or `rgba(255, 0, 0, 1.0)`).

* The `type` property controls the variant of legend to be rendered. Its type is `<string>`. Accepted values are `'continuous'` or `'discrete'`.

* The `zeroColor` property controls the color to which 0 is mapped. Its type is `<string>` and it must be a valid CSS color declaration (e.g. `#ff0000`, `rgb(255, 0, 0)` or `rgba(255, 0, 0, 1.0)`).

Required |Optional
:-------:|:---------:
    -    |Region Map

##### `locateUser`
`locateUser` enables or disables the 'locate me' button on Feature Maps and Region Maps. Its type is `<boolean>`. If set to true, the 'locate me' button will be rendered and functional. If omitted or set to `false`, the 'locate me' button will not be rendered.

Required |Optional
:-------:|:----------------------:
    -    |Feature Map, Region Map

##### `order`
`order` defines the initial column to be sorted in a Table. Its type is `<array>` and it must have at least one order declaration of type `<object>`. This object must have the following properties:

* The `columnName` property, of type `<string>`, specifies which column should be used in the order clause of the query. It must be the name of a column in the current dataset.

* The `ascending` property, of type `<boolean>`, specifies whether the ordering should be ascending or descending.

Required |Optional
:-------:|:-------:
Table    |    -

##### `panAndZoom`
`panAndZoom` enables or disables panning and zooming of maps. Its type is `<boolean>`. If omitted or set to `true`, the map will be pannable and zoomable using input events and the default map controls. If set to `false`, the map will not be pannable and zoomable and the default controls will not be rendered.

Required |Optional
:-------:|:----------------------:
    -    |Feature Map, Region Map

##### `pointOpacity`
`pointOpacity` controls the opacity of individual points rendered by the Feature Map. Its type is `<number>` and it must be in the range [0, 1].

Required |Optional
:-------:|:----------:
    -    |Feature Map
    
##### `pointSize`
`pointSize` controls the size of individual points rendered by the Feature Map by multiplying minimum size. Its type is `<number>` and it must be in the range [1, 3.2]. Defaults to 1.

Required |Optional
:-------:|:----------:
    -    |Feature Map

##### `precision`
`precision` overrides the automatic bucketing of dates for Timeline Charts. Its type is `<string>`.

Accepted values are `'DAY'`, `'MONTH'` and `'YEAR'`. If present, the Timeline Chart will use the specified precision as opposed to computing a precision based on the distance between the earliest and latest date in the dataset.

Required |Optional
:-------:|:-------------:
    -    |Timeline Chart

*NOTE: The Timeline Chart currently does not respect this property, but will be amended to do so in the near future.*

##### `mapCenterAndZoom`
`mapCenterAndZoom` is how the default viewport for a map is specified. Its type is `object`. This object must have the following properties:

* The `center` property controls the geographic point upon which the map is centered. Its type is `<object>` and it must have `lat` (latitude) and `lng` (longitude) properties, both of type `<number>`. The `lat` property must be in the range [-90, 90] and the `lng` property must be in the range [-180, 180].

* The `zoom` proper property must be of type `<number>`, and it must additionally be an integer in the range [1, 18].

The following example would cause Region and Feature Maps to show the map coordinate (12.345, 67.890) with a zoom level of 18.

```
{
  configuration: {
  ...
  mapCenterAndZoom: {
    center: {
      lat: 12.345,
      lng: 67.890
    },
    zoom: 18
  }
}
```

Required |Optional
:-------:|:----------------------:
    -    |Feature Map, Region Map

*NOTE: Zoom levels decrease the size of the visible geographic area as they increase, so a zoom level of 1 is 'zoomed all the way out' and a zoom level of 18 is 'zoomed all the way in'.*

##### `maxRowInspectorDensity`
`maxRowInspectorDensity` controls the maximum number of individual points within a selection radius for which the row inspector will be allowed to launch. Its type is `<number>`. If there are more than the specified number of points in a selection radius, a message will be shown to the user communicating that in order to launch the row inspector they must zoom in or apply filters to reduce the number of points within the selection radius.

Required |Optional
:-------:|:----------:
    -    |Feature Map

##### `maxTileDensity`
`maxTileDensity` controls the maxiumum number of individual points that will be drawn, per tile, by the Feature Map. Its type is `<number>` and it must be in the range [0, 65,536].

Required |Optional
:-------:|:----------:
    -    |Feature Map

##### `rowInspectorTitleColumnName`
`rowInspectorTitleColumnName` controls which value in a row is used as the 'title' of the row inspector flyout. Its type is `<string>` and it must be the name of a column in the current dataset.

Required |Optional
:-------:|:----------:
    -    |Feature Map

##### `shapefile`
`shapefile` is how the GeoJSON shape file that is paired with row data to render a Region Map is specified. Its type is `<object>`. This object must have the following properties:

* The `geometryLabel` is the column in the shapefile that should be used as the human-readable name of the region. Its type is `<string>`.

* The `primaryKey` is the column in the shapefile that is referenced by a computed column. Its type is `<string>`.

* The `uid` is the Socrata four-by-four identifier for the shapefile. Its type is `<string>`.

All three properties are required if `shapefile` is required.

The following example shows a valid `shapefile` object:
```
{
  configuration: {
    ...
    shapefile: {
      geometryLabel: 'region_name',
      primaryKey: 'primary_key',
      uid: 'abcd-1234'
    }
  }
}
```

Required   |Optional
:---------:|:-------:
Region Map |    -

##### `tableColumnWidths`
`tableColumnWidths` controls the rendered widths of individual columns in a table. Its type is `<object>`; its keys, of type `<string>`, are column names and its values, of type `<number>`, represent the intended width of the column in pixels.

The following example would cause a table to render all columns 100 pixels wide except for `id`, which would be rendered 50 pixesl wide:

```
{
  configuration: {
    ...
    tableColumnWidths: {
      id: 50,
      firstName: 100,
      middleName: 100,
      lastName: 100
    }
  }
}
```

Required |Optional
:-------:|:-------:
    -    |Table

##### `treatNullValuesAsZero`
`treatNullValuesAsZero` controls the rendering behavior of null values. Its type is `<boolean>`.

If a value is absent or would otherwise ordinarily be treated as null, setting this property to true will cause it to be rendered as if the value were zero instead.

If this property is absent it will be considered false.

```
{
  configuration: {
    ...
    treatNullValuesAsZero: true
  }
}
```

Required |Optional
:-------:|:-------------:
    -    |Timeline Chart

##### `viewSourceDataLink`
`viewSourceLink` controls whether or not to display the "View source data" link in the info bar of the visualization. Its type is `<boolean>`. If omitted or set to `true`, the "View source data" link will be rendered. If set to `false` the "View source data" link will not be rendered.

Required |Optional
:-------:|:----------------------------------------------------------------------:
    -    |Column Chart, Feature Map, Histogram, Region Map, Table, Timeline Chart

##### `xAxisDataLabels`
`xAxisDataLabels` controls whether or not to display column labels on Column Charts. Its type is `<boolean>`. If omitted or set to `true`, column labels will be rendered. If set to `false`, column labels will not be rendered.

Required |Optional
:-------:|:-----------:
    -    |Column Chart

##### `xAxisScalingMode`
`xAxisScalingMode` controls the horizontal scaling of rendered data in Column Charts and Timeline Charts. Its type is `<string>`. Accepted values are `pan` and `fit`. If set to `pan`, the visualization will not attempt to fit all rendered values within the viewport. If set to `fit`, the visualization will attempt to fit all rendered values within the viewport and may render an error if the number of rows in the query response exceeds a certain threshold.

Required |Optional
:-------:|:---------------------------:
    -    |Column Chart, Timeline Chart

##### `showOtherCategory`
`showOtherCategory` controls whether grouping data above specified limit into `(other)` category. 
Default limit in Pie Chart is 12 and `showOtherCategory` is true by default.
There isn't a default limit in Bar Chart and Column Chart. `showOtherCategory` is false by default.

Required |Optional
:-------:|:---------------------------:
    -    |Bar Chart, Pie Chart, Column Chart

### The `format` Object
The format object specifies the format and version of the vif. It is of type `<object>`. This object must have the following properties:

* The `type` property specifies that this is a Visualization Interchange Format object. It is of type `<string>` and its value must be `visualization_interchange_format`.

* The `version` property specifies the version of vif in use. It is of type `<number>`. The current latest version of vif is `2`.

The following example shows a valid format object for a version 2 vif:

```
{
  format: {
    type: 'visualization_interchange_format',
    verison: 2
  }
}
```

### The `series` Array
Vif 2 supports multiple series in a visualization by default. As such, the `series` property is of type `<array>` and contains one or more series objects (see next section).

### The `series` Object
The series object specifies a data source and directs how data from that source should be rendered.

#### Required Properties

##### `dataSource`
`dataSource` specifies how data should be retrieved for rendering. It is of type `<object>`. It must have the following properties:

* The `type` property specifies what type of data source is represented. It is of type `<string>`. At the time of writing (9/1/2016) all current visualizations accept data sources of type `'socrata.soql'`, but only the sample chart also accepts data sources of type `'socrata.sample'`. The addition of new data providers, accompanied by work to teach individual visualization wrappers about new types, will allow more visualizations to take advantage of more data sources.

If `type` is `'socrata.soql'`, the following properties are also required:

* The `datasetUid` property specifies the Socrata four-by-four identifier of the dataset against which to make data queries. Its type is `<string>` and it must be a valid four-by-four.

* The `dimension` property specifies the column to use as the dimension of the chart, and any aggregation function to apply to that column. Its type is `<object>`. This object must have the following properties:

   * `columnName` specifies the column in the dataset to use as the dimension of the chart or map. Its type is `<string>` and it must be a column in the dataset specified by the `datasetUid` property of the parent `dataSource` object.

   * `aggregationFunction` specifies the aggregation function to apply to values in the column in question. Its type is `<string>` or `<null>`. If it is of type `<string>`, accepted values are `'sum'` and `'count'`.

* The `domain` property specifies the domain against which to make data queries. It is of type `<string>` and should specify only the domain, not the protocol, path or query string (e.g. `opendata.socrata.com`, not `http://opendata.socrata.com` or `opendata.socrata.com/api`).

* The `measure` property specifies the column to use as the measure of the chart, and any aggregation function to apply to that column. Its type is `<object>`. This object must have the following properties:

   * `columnName` specifies the column in the dataset to use as the measure of the chart or map. Its type is `<string>` and it must be a column in the dataset specified by the `datasetUid` property of the parent `dataSource` object.

   * `aggregationFunction` specifies the aggregation function to apply to values in the column in question. Its type is `<string>` or `<null>`. If it is of type `<string>`, accepted values are `'sum'` and `'count'`.

* The `filters` property specifies which filters, if any, to use when constructing a where clause for a data query. It is of type `<array>`, and may be empty. If not empty, each item must be a valid SoQL filter object (see below).

If `type` is `'socrata.sample'`, the following properties are also required:

* The `data` property specifies data stored inline in the vif. Its type is `<object>` and it must adhere to the standard tabular data format (see API.md).

##### `label`
`label` specifies the human-readable name of the series. It is of type `<string>`.

For example, a chart rendering a comparison of budgeted amounts against actual amounts would include two series, one with a label of `'budgeted'` and one with a label of `'actual'`.

##### `type`
`type` specifies what type of chart or map to render. It is of type `<string>`.

Values of `type` map to visualization implementations. Accepted values are:

* `columnChart`

* `featureMap`

* `histogram`

* `regionMap`

* `table`

* `timelineChart`

Some chart types allow for specifying optional variants. Accepted variants are:

* `timelineChart.line` will cause the timeline chart to render a line but not fill in the area beneath it.

#### Optional Properties

##### `color`
`color` controls the color of rendered marks. It is of type `<object>`. This object may have the following properties:

* The `primary` property specifies the primary, or dominant, color to be used when rendering the chart or map. Its type is `<string>` and it must be a valid CSS color declaration (e.g. `#ff0000`, `rgb(255, 0, 0)` or `rgba(255, 0, 0, 1.0)`).

* The `secondary` property specifies the secondary, or accent, color to be used when rendering the chart or map. Its type is `<string>` and it must be a valid CSS color declaration (e.g. `#ff0000`, `rgb(255, 0, 0)` or `rgba(255, 0, 0, 1.0)`).

* The `highlight` property specifies the primary, or dominant, color to be used when rendering highlights on individual data (e.g. when the user moves the mouse over a column in a Column Chart). Its type is `<string>` and it must be a valid CSS color declaration (e.g. `#ff0000`, `rgb(255, 0, 0)` or `rgba(255, 0, 0, 1.0)`).

* The `palette` property sets color palette. It's type is `<string>`. Accepted values are `paired`, `set1`, `set2` , `dark2`.

If any of these properties is omitted, defaults will be used instead.

The following example would cause the series in question to be rendered primarily in red, with green accents and blue highlights:

```
{
  series: [
    {
      color: {
        primary: '#ff0000',
        secondary: '#00ff00',
        highlight: '#0000ff'
      },
      ...
    }
  ]
}
```

##### `unit`
`unit` specifies the human-readable unit of the underlying data (e.g. 'dollars' or 'reports'). Its type is `<object>`. This object may have the following properties:

* The `one` property specifies the name for one unit of the described data. It is of type `<string>`. In English, this should be the singular form of the noun.

* The `other` property specifies the name for quantities of the described data other than one. It is of type `<string>`. In English, this should be the plural form of the noun. Values of 0 will use this name (e.g. '0 reports').

If either of these properties is omitted, defaults will be used instead.

The following example would cause a column in a Column Chart with a value of 1 to be annotated as `1 dollar`, and a column with a value of 0 or 2 to be annotated as `0 dollars` or `2 dollars`, respectively:

```
{
  series: [
    {
      ...
      unit: {
        one: 'dollar',
        other: 'dollars'
      }
    }
  ]
}
```

##### `limit`
`limit` specifies maximum columns/bars/slices can be displayed on chart.

```
{
  series: [
    {
      ...
      limit: 10
    }
  ]
}
```
 
 Required |Optional
 :-------:|:---------------------------:
     -    |Bar Chart, Pie Chart, Column Chart

### Appendix: SoQL Filter Objects

Currently, five types of filters are supported for `socrata.soql` data sources:

##### `binaryOperator`
A `binaryOperator` filter performs one or more logical comparisons. It is of type `<object>`. This object must have the following properties:

* The `arguments` property specifies the comparison(s) to be made. It is of type `<object>`. If one comparison should be made, or of type `<array>` if more than one comparison should be made. If it is of type `<array>` it must contain one or more objects identical to the format expected if only one comparison is to be made; specifically, a comparison is specified by an object with two properties:

   * The `operator` property specifies the type of comparison. It is of type `<string>`. Accepted values are: `'='`, `'!='`, `'<'`, `'<='`, `'>'`, `'>='`.

   * The `operand` property specifies the value to compare against. It is of type `<string>`, `<number>` or `<boolean>`.

* The `columnName` property specifies the column against which the comparison should be made. It is of type `<string>` and it must be a column in the dataset specified by the parent `dataSource` object.

* The `function` property specifies the desired filtering function. Its type is `<string>` and it must be `binaryOperator`.

The following example would result in the where clause...
```
WHERE
  `natural_numbers_less_than_10` = 2 OR
  `natural_numbers_less_than_10` = 3 OR
  `natural_numbers_less_than_10` = 5 OR
  `natural_numbers_less_than_10` = 7
```
...being generated as a where clause for a SoQL data query:

```
{
  arguments: [
    {
      operator: '=',
      operand: 2
    },
    {
      operator: '=',
      operand: 3
    },
    {
      operator: '=',
      operand: 5
    },
    {
      operator: '=',
      operand: 7
    },
  ],
  columnName: 'natural_numbers_less_than_10',
  function: 'binaryOperator'
}
```

##### `binaryGeoregionOperator`
A `binaryGeoregionOperator` filter is a variant of the `binaryOperator` filter that applies the filter operators and operands to a georegion column that has been computed from a source column. It requires the same properties as the `binaryOperator` filter with the addition:

* The `computedColumnName` property specifies the computed column that, when paired with a source column, describes how individual rows are mapped to georegions in a shapefile. Its type is `<string>` and it must be a computed column in the dataset specified by the parent `dataSource` object.

The `function` property must be `binaryGeoregionOperator`.

The following example would result in the where clause...
```
WHERE `:@computed_column` = 2 OR `:@computed_column` = 3
```
...being generated as a where clause for a SoQL data query:

```
{
  arguments: [
    {
      operator: '=',
      operand: 2
    },
    {
      operator: '=',
      operand: 3
    }
  ],
  columnName: 'location',
  computedColumnName: :@computed_column'
  function: 'binaryGeoregionOperator'
}
```

##### `isNull`
The `isNull` filter describes an equality comparison for the value `null`. It is of type `<object>`. This object must have the following properties:

* The `arguments` property specifies the comparison to be made. It is of type `<object>`. It must contain one property:

   * The `isNull` property specifies whether to accept or reject null values. It is of type `<boolean>`.

* The `columnName` property specifies the column against which the comparison should be made. It is of type `<string>` and it must be a column in the dataset specified by the parent `dataSource` object.

* The `function` property specifies the desired filtering function. Its type is `<string>` and it must be `isNull`.

The following example would result in the where clause...
```
WHERE `some_null_values` IS NOT NULL
```
...being generated as a where clause for a SoQL data query:

```
{
  arguments: {
    isNull: false
  },
  columnName: 'some_null_values',
  function: 'isNull'
}
```

##### `timeRange`
The `timeRange` filter describes a partitioning of the set of all rows into those that fall into the specified date range and those that fall outside of it. It is of type `<object>`. This object must have the following properties:

* The `arguments` property specifies the the range with which to partition the data. It is of type `<object>`. It must contain two properties:

   * The `start` property specifies the start of the range. It is of type `<string>` and it must be an ISO-8601 format floating timestamp (e.g. without timezone information). This value is an *inclusive* boundary.

   * The `end` property specifies the end of the range. It is of type `<string>` and it must be an ISO-8601 format floating timestamp (e.g. without timezone information). This value is an *exclusive* boundary.

* The `columnName` property specifies the column against which the partition should be applied. It is of type `<string>` and it must be a column in the dataset specified by the parent `dataSource` object.

* The `function` property specifies the desired filtering function. Its type is `<string>` and it must be `dateRange`.

The following example would result in the where clause...
```
WHERE
  `date_column` >= '2001-01-01T00:00:00' AND
  `date_column` < '2002-01-01T00:00:00'
```
...being generated as a where clause for a SoQL data query:

```
{
  arguments: {
    start: '2001-01-01T00:00:00',
    end: '2002-01-01T00:00:00'
  },
  columnName: 'date_column',
  function: 'timeRange'
}
```

##### `valueRange`
The `timeRange` filter describes a partitioning of the set of all rows into those that fall into the specified value range and those that fall outside of it. It is of type `<object>`. This object must have the following properties:

* The `arguments` property specifies the the range with which to partition the data. It is of type `<object>`. It must contain two properties:

   * The `start` property specifies the start of the range. It is of type `<number>`. This value is an *inclusive* boundary.

   * The `end` property specifies the end of the range. It is of type `<number>`. This value is an *exclusive* boundary.

* The `columnName` property specifies the column against which the partition should be applied. It is of type `<string>` and it must be a column in the dataset specified by the parent `dataSource` object.

* The `function` property specifies the desired filtering function. Its type is `<string>` and it must be `valueRange`.

The following example would result in the where clause...
```
WHERE `number_column` >= 0 AND `number_column` < 128
```
...being generated as a where clause for a SoQL data query:

```
{
  arguments: {
    start: 0,
    end: 128
  },
  columnName: 'number_column',
  function: 'valueRange'
}
```
