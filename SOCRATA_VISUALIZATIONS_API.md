# In order for a visualization component (jQuery or otherwise) to conform to the Socrata Visualizations API it must:

## Respond to the following events

1. `SOCRATA_VISUALIZATION_INVALIDATE_SIZE` (no payload): This tells the visualization to re-render itself to take up all avaliable space in its container element.

2. `SOCRATA_VISUALIZATION_RENDER_VIF` (the new VIF should be located at: `event.originalEvent.detail` if using jQuery and `event.detail` if using plain DOM events): This tells the visualization to re-render itself according to the column, filters and other options in the supplied VIF object.

## Emit the following events

1. `SOCRATA_VISUALIZATION_<TYPE>_FLYOUT` (the flyout payload containing relevant details about the datum should be located at: `event.originalEvent.detail` if using jQuery and `event.detail` if using plain DOM events): This tells the parent application to render a flyout using `FlyoutRenderer.js` and the flyout payload supplied by the event.

2. `SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE` (the row inspector paylaod containing relevant details about the datum should be located at: `event.originalEvent.detail` if using jQuery and `event.detail` if using plain DOM events): This tells the parent application to render or update a row inspector using `RowInspector.js` and the row inspector payload supplied by the event.

3. `SOCRATA_VISUALIZATION_VIF_UPDATED` (the new VIF should be located at: `event.originalEvent.detail` if using jQuery and `event.detail` if using plain DOM events): This tells the parent application that some kind of selection occurred which might affect the way the visualization is rendered. For example, clicking on a column in a Data Lens column chart should filter on that column. The new VIF payload should reflect whatever changes to filters will result in the visualization being rendered in the filtered state. NOTE: It is expected that this event will only ever be emitted in response to a user action (e.g. clicking on a column in a column chart). If the visualization is not interactively-filterable (Data Lens visualizations may be clicked to cause a filter and as such are interactively-filterable) then there is no need to emit this event at all.

## Moving forward

We should probably collapse the different flyout events into a single `SOCRATA_VISUALIZATION_FLYOUT` event.
