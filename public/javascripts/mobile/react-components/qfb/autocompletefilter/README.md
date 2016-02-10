# QFB Autocomplete Filter

__AutocompleteFilter__ is a type of _filter item_ that filters through given set of suggestions and returns selected items from the as an array. The component has a autocomplete feature that enables to filter through the list as the user types values to search field.

![QFB Nested Component Overview](https://github.com/socrata/realtime-pilot-frontend/blob/develop/app/assets/javascripts/components/docs/imgs/qfb_components_diagram_1.png "QFB Filters Overview")

## QFB Components
- [Filter Container](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/filtercontainer)
  - [FilterItem Container](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/filteritem)
    - [Filter: Boolean Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/booleanfilter)
    - [Filter: Number Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/numberfilter)
    - [Filter: Autocomplete Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/autocompletefilter)

![QFB React Component Overview](https://github.com/socrata/realtime-pilot-frontend/blob/develop/app/assets/javascripts/components/docs/imgs/qfb_components_diagram_2.jpg "QFB Filters Overview")

### Component Files
- __react.socrata.autocompletefilter.js__
- __autocompletefilter.scss__

### Dependencies
- __Twitter Bootstrap__

##react.socrata.autocompletefilter.js

### States
- __options(:array):__ Suggestions array.
- __selected(:array):__ Selected array from suggestion array.
- __searchinput(:string)__ Search value.
- __activeIndex(:number)__ Focused suggestion in suggestion list.
- __requestiong(:bool)__ Is true if the user is requesting for a new data.

### Props
- __key(:string)__ Unique identifier for component
- __componentId(:string)__ Unique identifier for component
- __name(:string)__ Filter display name
- __dataHandler(:func)__ Handler responsible to report filter data to __FilterItem__ component.

### LifeCycle Events
- __componentDidMount:__ React lifecycle event triggered once the component is mounted and ready for user interaction.

### Utility Functions
- __formattedLabel()__ Function to make a representation version of filter data that will be displayed inside __FilterItem__ component.
- __fetchSuggestions(:text)__ Get new data from backend based on __text__ value.
- __getArrayItemIndexByText(:object, :array)__ Returns the index value of an object from a given array.
- __checkActive(:number)__ Check if activeIndex is the same as __number__
- __makeItemActive(:number)__ Make item active with current __number__

### Events
- __onChangeSearchInput()__ Triggered as user changes the value in search field.
- __onClickClearSearchInput()__ Triggered when user clicks the __clear__ button icon of search field.
- __onClickSuggestion(:object)__ Triggered when user clicks to add a suggestion item to selected array.
- __onClickDeleteSelected(:object)__ Triggered when user clicks a selected items __Delete__ button icon to remove that from __selected filters__ array.

### Handlers
- __handleKeyboardEvents()__ Handles keyboard events for component.

### Renderers
- __render()__ Renders the component.

## autocompletefilter.scss
### Scrollbar
- __.mod-socrata-autocomplete-lists-suggestions-list::-webkit-scrollbar__
- __.mod-socrata-autocomplete-lists-suggestions-list::-webkit-scrollbar-track__
- __.mod-socrata-autocomplete-lists-suggestions-list::-webkit-scrollbar-thumb__

### SearchField
- __.mod-socrata-autocomplete-searchfield__ wrapper element for search field
- __.search-icon__
- __.search-icon.is-active-focus__
- __input__
- __.clearSuggestion__

### Message
- __.mod-socrata-autocomplete-message__

### Selected List
- __.mod-socrata-autocomplete-lists__ wrapper element
- __.mod-socrata-autocomplete-lists-filter-title__
- __.mod-socrata-autocomplete-lists-filter-list__
- __.mod-socrata-autocomplete-lists-filter-listitem__
  - __&:last-child__
  - __&:hover__
  - __.fa-times-circle__ delete selection from selected array
    - __&:hover__
  - __.fa-filter__ filter icon

### Suggestion List
- __.mod-socrata-autocomplete-lists-suggestions-list__
- __.mod-socrata-autocomplete-lists-suggestions-listitem__
  - __&.is-active__
- __.listitem-footnote__