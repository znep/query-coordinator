# The Socrata Visualizations API

## Nomenclature
For the sake of brevity, the following terms will be used below in place of more fully-descriptive signifiers:

* `Wrapper` - The public interface for a visualization. To facilitate using the visualization implementations in multiple contexts, this public interface is standardized on the outside but may communicate with the individual visualization implementations in specialized ways; currently wrappers in this project are all presented as jQuery plugins in order to take advantage of its widespread use and lack of significant infrastruture requirements. Wrappers can be found in the root-level `src/` directory.

   Wrappers typically handle constructing queries based on properties in the vif, dispatching those queries to the appropriate data sources and consolidating the results into a format that can be utilized by the underlying visualization implementation, in addition to setting up event handlers for the Socrata Visualizations Event API and user actions.

* `Visualization` - The implementation of the visualization, which may make use of d3 or Leaflet (or neither). These implementations can be found in the `src/views/` directory. Except in the case of maps, visualization implementations do not directly query for data and instead remain agnostic about its source--this separation of concerns is intended to make it easier to use existing visualizations with new or changing sources of data.

* `Data Provider` - Typically a wrapper will combine a visualization with one or more data providers, which exist to provide a structured way to access data from a particular source. In addition to the `SoqlDataProvider`, which can be used to construct queries against Socrata-backed data sources, there currently exist several *Meta*data providers that can be used to query metadata properties of various Socrata assets. Data providers can be found in the `src/dataProviders` directory.

*NOTE: Many files in this project are prefixed by `Svg`. This is a temporary measure meant to distinguish them from other, soon-to-be-deprecated implementations of similar charts. If there are both non-prefixed and prefixed versions of a file, the `Svg`-prefixed version should be considered the canonical implementation. These prefixes will be removed in the near future.*

## The Visualization Interchange Format (vif)
All configuration of Socrata Visualizations is handled using objects conforming to the Visualization Interchange Format (vif). A vif is often one of two arguments passed to public methods exposed by the various components that constitute a Socrata Visualization.

Please refer to `VIF.md` for a detailed explanation of a vif's structure and meaning.

## Utilizing Existing Visualizations
Utilizing existing visualizations is straightforward: either synthesize a vif or retrieve a previously-created one and then pass it to one of the jQuery plugin wrappers like this:

`$('.my-visualization').socrataSvgColumnChart(vif)`

Optionally listen to events emitted by the wrapper or trigger your own events on it. The events to which a visualization must respond (and those which it may emit) are described below.

The example pages (`/examples/*.html`) show usage patterns for various visualization types in greater detail.

Alternatively, use the `VisualizationRenderer` to handle rendering a visualization based on the visualization type provided in its VIF:

`new VisualizationRenderer(vif, element)`

An instance of the `VisualizationRenderer` exposes `update` and `destroy` functions, but the rendered visualization also responds to the same events as a visualization instantiated through one of the jQuery plugin wrappers.

There is also a simple React wrapper available for the `VisualizationRenderer`:

```
const Visualization = socrata.visualizations.components.Visualization;

return <Visualization vif={vif} />;
```

## Implementing a New Visualization
Before implementing a new visualization with the intent to integrate it back into this project, please read the following to understand our overall design. Once you understand how the pieces of this project fit together, you can find annotated implementations of each component in the following locations:

1. Wrapper: `/src/SampleChart.js`

2. Visualization: `/src/views/SampleChart.js`

3. Data Provider: `/src/dataProviders/SampleDataProvider.js`

Copying these files and modifying them to do what you want will be a good way to keep your contributions consistent with the rest of the project.

### Composition of Capabilities
New visualizations will be composed of several parts:

1. A visualization implementation, which should inherit from the `SvgVisualization` base class.

2. One or more data providers, which should inherit from the `DataProvider` base class.

3. A wrapper combining the above and adhering the standard Socrata Visualizations API (configuration controlled by vif objects and runtime behaviors controlled by the Event API described below).

#### The `SvgVisualization` Base Class (`/src/views/SvgVisualization.js`)
Visualization implementations should inherit from the `SvgVisualization` base class, which provides a variety of helper methods for dealing vif lifecycles, reading configuration properties and rendering UI elements common to all visualizations such as titles, descriptions and busy indicators.

The inheritence should use loadash's `extend` method as below, where `$element` is a jQuery-wrapped DOM node into which the visualization should be rendered and `vif` is the initial vif to be rendered:

`_.extend(this, new SvgVisualization($element, vif));`

Upon instantiation, the `SvgVisualization` base class will conditionally render a title, description, axis titles and info bar content based on the relevant properties in the `vif` argument passed to the constructor.

*Both the `$element` and `vif` arguments to the constructor are required.*

##### Public methods provided by the `SvgVisualization` base class


###### `<visualization>.getVif()`
This method returns the current vif.

###### `<visualization>.updateVif(newVif)`
Calling this method will cause the current vif to be replaced with `newVif`. In cases where `newVif` is not the latest version of vif supported by the `SvgVisualization` base class, `newVif` will be automatically migrated to that latest version. Calling this method will also cause the visualization's title, description, axis titles and info bar content to be updated with the values in `newVif`.

*The `newVif` argument is required.*

###### `<visualization>.renderError(message)`
Calling this method will cause the visualization to immediately replace any rendered data with an error message. If the `message` argument is omitted a generic error message will be displayed.

###### `<visualization>.clearError()`
Calling this method will cause the visualization to immediately hide any error messages that have been rendered. Typically one will want to call this method when inside the `renderData` function of a visualization implementation.

###### `<visualization>.showBusyIndicator()`
Calling this method will show the 'busy' indicator. Typically one will want to call this method at the start of a data update cycle in a wrapper.

###### `<visualization>.hideBusyIndicator()`
Calling this method will hide the 'busy' indicator. Typically one will want to call this method at the end of a data update cycle in a wrapper.

###### `<visualization>.showPanningNotice()`
Calling this method will show the 'click and drag to pan the chart' notice. Typically one will want to call this method when using d3 to render a chart that does not fit entirely in the viewport, requiring the ability to pan it horizontally. In order to avoid letting the visualizations become too stateful we choose instead to measure whether to allow or disable panning every time the relevant render function is called; as such it is easiest to call this or `<visualization>.hidePanningNotice()` based on the current state at render time rather than to try to remember whether it should be called or not based on the results of the last render.

###### `<visualization>.hidePanningNotice()`
Calling this method will hide the 'click and drag to pan the chart' notice. Typically one will want to call this method when using d3 to render a chart that does fit entirely in the viewport. In order to avoid letting the visualizations become too stateful we choose instead to measure whether to allow or disable panning every time the relevant render function is called; as such it is easiest to call this or `<visualization>.showPanningNotice()` based on the current state at render time rather than to try to remember whether it should be called or not based on the results of the last render.

###### `<visualization>.isMobile()`
Calling this method will return `true` if the current browser has mobile-like characteristics, or `false` if it does not.

###### `<visualization>.getSeriesIndexByLabel(label)`
This method will return the series index of the first series for which the label property matches the `label` argument.

###### `<visualization>.getTypeVariantBySeriesIndex(seriesIndex)`
###### `<visualization>.getUnitOneBySeriesIndex(seriesIndex)`
###### `<visualization>.getUnitOtherBySeriesIndex(seriesIndex)`
###### `<visualization>.getHighlightColorBySeriesIndex(seriesIndex)`
These methods all retrieve specific configuration values from the current vif. Since all of these properties can vary by series, the `seriesIndex` argument is required.

#### The `DataProvider` Base Class (`/src/dataProviders/DataProvider.js`)
Data Provider implementations should inherit from the `DataProvider` base class; although the functionality of that base class is less heavily used than that of `SvgVisualization`, we may find opportunities in the future to extract common behaviors and provide them through the `DataProvider` base class.

As with `SvgVisualization`, the inheritence should use lodash's `extend` method as below, where `this` is the context of the data provider implementation in question.

`_.extend(this, new DataProvider());`

### Public Methods on Wrappers
After instantiation, all communication with wrappers should be done through the Socrata Visualization Event API described below.

### Public Methods on Visualization Implementations
All visualization implementations must expose the following methods with the described behaviors; if there is a great need for functionality not provided by the base `SvgVisualization` class visualization implementations may optionally expose additional public methods to provide that specialized functionality. These methods are intended to be called by the wrapper to control the behavior of the visualization implementation in response events received from the parent application.

*None of these methods return values*.

###### `<visualization>.render(vifToRender, dataToRender)`
When this method is called the visualization must immediately re-render itself, taking into account any relevant configuration values in `vifToRender` and the updated data in `dataToRender`. The exact structure of `dataToRender` varies with the individual implementation, but will typically take the form of the standard tabular data format with additional properties added as necessary.

###### `<visualization>.invalidateSize()`
When this method is called the visualization must immediately re-render itself, taking into account the dimensions of its container at the time the method is called. Wrappers call this method in response to the `SOCRATA_VISUALIZATIONS_INVALIDATE_SIZE` event, which is how the host application tells the visualization that the size of its container has changed. This method takes no arguments and will implicitly re-render the most recently-rendered data. If this method is called before any data has been rendered, it must do nothing.

###### `<visualization>.destroy()`
When this method is called the visualization must immediately detach any event handlers that have been previously attached and then remove any DOM nodes that it has added. The behavior of the other public methods exposed by a visualization after `<visualization>.destroy()` has been called is undefined and may have unpredictable results.

### Public Methods on Data Providers

Public methods exposed by data providers may vary by purpose and need. These are left to the discretion of the individual doing the implementation.

## The Socrata Visualization Event API
New visualizations must adhere to the Socrata Visualizations Event API described above and in more detail here.

#### Incoming Events
All jQuery plugins must respond to the following events (note that where `event` is used it refers to the native event object; if using jQuery-backed events the actual path from the passed event object will be `event.originalEvent`):

###### `SOCRATA_VISUALIZATION_RENDER_VIF`
The wrapper must take the following actions in the order presented:

1. Verify that the vif provided at the path `event.detail` (or `event.originalEvent.detail` if using jQuery-backed events) is a vif of the correct type (e.g. the `SvgColumnChart` wrapper must verify that the provided vif is of the `columnChart` type). If the new vif's type differes from that that can be handled by the wrapper, it should call `<visualization>.renderError()` with a user-facing error message and then raise an exception to the host application.

2. If the new vif is of the correct type, the wrapper must then make the relevant data requests and call `<visualization>.render()` on the underlying visualization with the new vif and the new data in the format that the visualization expects. While the formats of data that visualizations expect may vary slightly due to implementation requirements, they should all be an object, and at minimum contain `columns` and `rows` properties. Any additional information that should be passed to the visualization should exist as additional properties on that root object.

###### `SOCRATA_VISUALIZATION_INVALIDATE_SIZE`
* If the visualization has successfully rendered data at the time this event is received, it should immediately re-render itself to respond to changes in the size of its container.

* If the visualization has not yet successfully rendered data at the time this event is received, it should ignore this event.

###### `SOCRATA_VISUALIZATION_DESTROY`
The wrapper must first take the following actions in the order presented:

1. Call the `<visualization>.destroy()` method on the underlying visualization.

2. Detach any event handlers the wrapper itself has attached.

3. Destroy any DOM elements that the wrapper has added to the `div.socrata-visualization-container` element.

#### Outgoing Events
The purpose of these events is to cause state changes in the host application. Their payloads should be located at `event.detail` (or `event.originalEvent.detail` if using jQuery-backed events), but the format of the payload varies by event type.

###### `SOCRATA_VISUALIZATION_FLYOUT`
* The wrapper should emit this event to the host application whenever a user action causes additional information to be shown to the user (e.g. when the user moves the mouse over a column in a column chart, a flyout should appear above that column with additional information about it).

* The payload of this event should consist of an object conforming to the requirements of the FlyoutRenderer (see next section). Importantly, visualizations themselves should never emit events directly; rather, they should use their own namespaced events (e.g. `SOCRATA_VISUALIZATION_COLUMN_CHART_FLYOUT`) to communicate with their wrappers. The wrappers themselves are solely responsible for emitting events in line with this API; this is because there may be internal state changes that need to be communicated to the wrapper that are independent of user-facing effects; in such cases the wrapper should call the relevant methods on the event to prevent its bubbling higher up the DOM.

###### `SOCRATA_VISUALIZATION_VIF_UPDATED`
* Although many current visualizations do not communicate state changes back to the host application this event exists to do exactly that. At the time of writing (9/1/2016) the only visualization that emits this event is the Table. It will do so when the user changes the widths of columns so that the new column widths, which are stored in the configuration subtree of the vif, can be persisted for the user. The payload of this event should be a complete, valid vif reflecting the new desired state.

###### `SOCRATA_VISUALIZATION_DATA_LOAD_START` & `SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE`
* These two events should be emitted by the wrapper at the start and finish of a data update operation respectively. The payload of both of these events should be `null`.

## Appendix: Standard Tabular Data Format

All data providers should return data in the standard tabular format used throughout the project. This format consists of an `<object>` with two required properties:

* The `columns` property provides identifiers for each column. It is of type `<array>`. Each element of `columns` is of type `<string>`, and their order is significant. These values may correspond to the column names from the source dataset, if applicable, or more commonly to the `measure` and `dimension` of a visualization.

* The `rows` property contains the actual row data. It is of type `<array>`. Each element of `rows` is itself of type `<array>` and has a length that is equal to the length of `columns`. Elements in a row belong to the column specified at the same index in the `columns` array. Elements in a row may be of type `<string>`, `<number>`, `<boolean>` or `<null>`.

The following example illustrates a simple data table in the standard format:

```
{
  columns: ['name', 'color'],
  rows: [
    ['apple', 'red'],
    ['orange', 'orange'],
    ['banana', 'yellow']
  ]
}
```

It may be occasionally necessary to augment the standard tabular data format with additional information required by the underlying visualization implementation. In these cases it may be appropriate to, at runtime, add additional properties to the root of the standard tabular data object.

## Appendix: The FlyoutRenderer
The FlyoutRenderer should be instantiated by the host application to handle all flyout events originating from Socrata Visualizations on the page. Wrappers emitting the `SOCRATA_VISUALIZATION_FLYOUT` event, which the FlyoutRenderer will bind to when it is instantiated, should provide payload with the following properties:

```
{
  /** If the element property is present, the FlyoutRenderer will automatically
   * render the flyout horizontally centered and directly above the element in
   * question. This should be a raw DOM element, not a jQuery-wrapped one.
   */
  element: <HTMLElement>,
  /**
   * The jQuery DOM fragment referenced below should consist of a jQuery-
   * wrapped table with one or more rows; it should be of the following
   * format:
   *
   *   <table class="socrata-flyout-table">
   *     <tr class="socrata-flyout-title" colspan="2">Title</tr>
   *     <tr class="socrata-flyout-row">
   *       <td class="socrata-flyout-cell">Label</td>
   *       <td class="socrata-flyout-cell">Value</td>
   *     </tr>
   *   </table>
   */
  content: <jQuery DOM fragment>,
  /**
   * If the flyout should be rendered with the hint arrow on the right side,
   * and with the flyout positioned to the right and vertically centered on the
   * element instead of the default above-and-horizontally-centered behavior,
   * then rightSideHint should be set to true instead. Leave false for the
   * default behavior.
   */
  rightSideHint: false,
  /**
   * If the flyout should be positioned below the target element instead of
   * above it, then belowTarget should be set to true instead. Leave false for
   * the default behavior.
   */
  belowTarget: false,
  /**
   * In order to maintain a consistent visual language across the Socrata
   * Visualizations project, all flyouts should set dark to true.
   */
  dark: true
}
```

## Appendix: The Palette class
Built-in and custom palettes are handled centrally by the private `Palette` class and its internal helper
classes `StandardPalette` and `CustomPalette`. They understand how to look up custom colors based on measure
names or grouping values, and encapsulate color rotation schemes.

## Appendix: The Measure class
Each SvgVisualization uses instances of the private `Measure` class to keep track of the measures to be
displayed. Along with `getMeasures()`, this centralizes coloration schemes, palette selection and label
formatting.
