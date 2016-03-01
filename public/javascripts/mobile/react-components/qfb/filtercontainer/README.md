# QFB Filter Container
__Filter container__ is the upper most container component for __filter bar__. It encapsulates the dropdown for possible filters, selected __filter items__ and button to clear selected filters.

![QFB Nested Component Overview](https://github.com/socrata/realtime-pilot-frontend/blob/develop/app/assets/javascripts/components/docs/imgs/qfb_components_diagram_1.png "QFB Filters Overview")

## QFB Components
- [Filter Container](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/filtercontainer)
	- [FilterItem Container](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/filteritem)
		- [Filter: Boolean Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/booleanfilter)
		- [Filter: Number Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/numberfilter)
		- [Filter: Autocomplete Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/autocompletefilter)

![QFB React Component Overview](https://github.com/socrata/realtime-pilot-frontend/blob/develop/app/assets/javascripts/components/docs/imgs/qfb_components_diagram_2.jpg "QFB Filters Overview")

### Component Files
- __FilterContainer.js__
- __filtercontainer.scss__

### Dependencies
- __Twitter Bootstrap__

##FilterContainer.js

### States
- __filterOps(:array) :__ Array of filter options that appear in dropdown menu.
- __filters(:array) :__ Array of selected filters by user.

### LifeCycle Events
- __componentWillMount:__ React lifecycle event triggered before the component mounts.
- __componentDidMount:__ React lifecycle event triggered once the component is mounted and ready for user interaction.
- __componentDidUpdate:__ React lifecycle event triggered as soon as a state change occurs.

### Utility Functions
- __findIndexOfFilterFromArrayById(filterId, array):__ Given a filter id, this functions finds the position of the filter in a given array.

### Events
- __onClickNewFilter():__ Triggered when user clicks a filter from dropdown and a new __filter item component__ is created.
- __onClickClearAllFilters():__ Triggered when user clicks on __clear all__ button and clears the __selected filters__.

### Handlers
- __handleFilterAddition(filterId, dataObject):__ Handles the addition of a new filter. Triggered when a __filteritem__ is __applied__.
- __handleFilterDeletion(filterId):__ Handles the deletion of a filter. Triggered when a __filteritem__ is __deleted__.

### Renderers
- __render():__ Renders the component.

##filtercontainer.scss

- __#qfb-container__ upper most container
- __#qfb-dropdown__ dropdown element that holds the filter options
- __#qfb-filters__ container for __filter item__s
- __#qfb-filters-btndelete__ Button with label __clear all__.