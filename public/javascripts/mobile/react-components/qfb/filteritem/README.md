# QFB FilterItem Container
__FilterItem__ component is a wrapper component for each filter user selects and interacts with.

![QFB Nested Component Overview](https://github.com/socrata/realtime-pilot-frontend/blob/develop/app/assets/javascripts/components/docs/imgs/qfb_components_diagram_1.png "QFB Filters Overview")

## QFB Components
- [Filter Container](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/filtercontainer)
	- [FilterItem Container](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/filteritem)
		- [Filter: Boolean Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/booleanfilter)
		- [Filter: Number Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/numberfilter)
		- [Filter: Autocomplete Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/autocompletefilter)

![QFB React Component Overview](https://github.com/socrata/realtime-pilot-frontend/blob/develop/app/assets/javascripts/components/docs/imgs/qfb_components_diagram_2.jpg "QFB Filters Overview")

### Component Files
- __FilterItem.js__
- __filteritem.scss__

### Dependencies
- __Twitter Bootstrap__

## FilterItem.js

### States
- __label(:string)__ The representation of filter data coming from wrapped filter.
- __pendingLabel(:string)__ The string label value for
- __pendingData(:object)__ Filter data object that will be sent to FilterContainer
- __isApplicable(:bool)__ Boolean value that determines whether the __Apply__ button will be enabled or not.
- __isCorrect(:bool)__ Boolean value that determines whether to show warning or not.

### Props
- __key(:string)__ is the unique identifier for React.
- __filter(:object)__ is the filter object that holds all the data for given filter.
- __deletionHandler(:func)__ the connection function for __FilterContainer__ that sends data about deleting a filter.
- __additionHandler(:func)__ the connection function for __FilterContainer__ that sends data about adding a new filter.


### Events
- __onClickDeleteFilter:__ Triggered when user clicks on Delete filter icon to the left of label.
- __onClickOpenFlannel:__ Triggered when user clicks on the summary presentation part of the filter item and opens the filter flannel.
- __onClickCloseFlannel:__ Triggered when user clicks the close flannel icon to the top right of flannel and closes all the open flannels.
- __onClickCancel:__ Triggered when user clicks the Cancel button.
- __onClickApply:__ Triggered when user clicks Apply button.

### Handlers
- __handleFilterData(:label, :data, :isApplicable, :isCorrect):__ Handles the filter data that comes from the inner filter and sends it to the filtercontainer.

### Renderers
- __render():__ Renders the component.

## filterItem.scss





