# QFB Number Filter

__NumberFilter__ is a type of _filter item_ that filters according to a given range. It can take min, max or both values.

![QFB Nested Component Overview](https://github.com/socrata/realtime-pilot-frontend/blob/develop/app/assets/javascripts/components/docs/imgs/qfb_components_diagram_1.png "QFB Filters Overview")

## QFB Components
- [Filter Container](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/filtercontainer)
  - [FilterItem Container](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/filteritem)
    - [Filter: Boolean Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/booleanfilter)
    - [Filter: Number Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/numberfilter)
    - [Filter: Autocomplete Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/autocompletefilter)

![QFB React Component Overview](https://github.com/socrata/realtime-pilot-frontend/blob/develop/app/assets/javascripts/components/docs/imgs/qfb_components_diagram_2.jpg "QFB Filters Overview")

### Component Files
- __react.socrata.numberfilter.js__
- __numberfilter.scss__

### Dependencies
- __Twitter Bootstrap__

##react.socrata.numberfilter.js

### States
- __hasLowerBound(:bool):__ Turns true if the number filter has lower bound as checked.
- __hasUpperBound(:bool):__ Turns true if the number filter has upper bound as checked.
- __lowerBound(:number)__ Lower bound value.
- __upperBound(:number)__ Upper bound value.
- __isCorrect(:bool)__ Is true if the range value makes sense.
- __isApplicable(:bool)__ Is true if the value is applicable.
- __editingFieldRefName(:string)__ Tells which number field needs to be in focus.

### Props
- __key(:string)__ Unique identifier for component
- __componentId(:string)__ Unique identifier for component
- __name(:string)__ Filter display name
- __labelHandler(:func)__ Handler responsible to report label tag to __FilterItem__ component.
- __dataHandler(:func)__ Handler responsible to report filter data to __FilterItem__ component.
- __remoteApply(:func)__ Mirror Apply Handler from FilterItem.

### LifeCycle Events
- __componentDidMount:__ React lifecycle event triggered once the component is mounted and ready for user interaction.
- __componentDidUpdate:__ React lifecycle event triggered as soon as a state change occurs.

### Utility Functions
- __formattedLabel()__ Function to make a representation version of filter data that will be displayed inside __FilterItem__ component.
- __validateFields()__ Checks to see if the filter values are valid.

### Events
- __onClickLimitCheckbox(:whichBound)__ Triggered when user clicks the checkbox for either lower or upper bound.
- __onClickInputBound(:whichBound)__ Triggered when user clicks the input field for either lower or upper bound.
- __onChangeInputBound(:whichBound)__ Triggered as user changes the value of input field for either lower or upper bound.

### Handlers
- __handleKeyboardEvents()__ Handles keyboard events.

### Renderers
- __render()__ Renders the component.

## numberfilter.scss
- __.qfg-filter-item-flannel-numberfilter:__ Flexible container that holds the __numberfilter elements__
- __.qfg-filter-item-flannel-numberfilter-part:__ Part of __numberfilter__ that holds the boundry checkbox and input fields.
- __.qfg-filter-item-flannel-numberfilter-part label:__ __Numberfilter__ boundry label that wraps the checkbox
- __.qfg-filter-item-flannel-numberfilter-part input[type=number]:__ __Numberfilter__ boundry input field
- __.qfg-filter-item-flannel-numberfilter-part input[type=number].disabled__ disabled state for input field
- __.qfg-filter-item-flannel-numberfilter-seperator__ middle part of __numberfilter__