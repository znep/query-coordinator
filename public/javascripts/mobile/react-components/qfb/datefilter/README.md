# QFB Date Filter

__Date Filter__ is a type of _filter item_ that filters according to a range of dates or a single date. It can either be true or false for a given filter item.

![QFB Nested Component Overview](https://github.com/socrata/realtime-pilot-frontend/blob/develop/app/assets/javascripts/components/docs/imgs/qfb_components_diagram_1.png "QFB Filters Overview")

## QFB Components
- [Filter Container](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/filtercontainer)
  - [FilterItem Container](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/filteritem)
    - [Filter: Boolean Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/booleanfilter)
    - [Filter: Number Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/numberfilter)
    - [Filter: Autocomplete Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/autocompletefilter)
    - [Filter: Date Filter](https://github.com/socrata/realtime-pilot-frontend/tree/develop/app/assets/javascripts/components/qfb/datefilter)

![QFB React Component Overview](https://github.com/socrata/realtime-pilot-frontend/blob/develop/app/assets/javascripts/components/docs/imgs/qfb_components_diagram_2.jpg "QFB Filters Overview")

### Component Files
- __react.socrata.datefilter.js__
- __DayPicker.js__
- __DatePicker.scss__
- __DayPicker.scss__

### Dependencies
- __Twitter Bootstrap__

##react.socrata.datefilter.js

### States
- __firstCal:__ ISO Date value for first datepicker
- __secondCal:__ ISO Date value for second datepicker
- __pickerType:__ Value for DatePicker type ('bt','gt','lt')
- __isCorrect:__ Boolean value whether Datepicker values are correct
- __isApplicable:__ Boolean value whether Datepicker values are applicable

### Props
- __key(:string)__ Unique identifier for component
- __componentId(:string)__ Unique identifier for component
- __name(:string)__ Filter display name
- __dataHandler(:func)__ Handler responsible to report filter data to __FilterItem__ component.

### LifeCycle Events
- __componentDidMount:__ React lifecycle event triggered once the component is mounted and ready for user interaction.

### Utility Functions
- __prettyDate(:ISODateString)__ Function to change date formatting to the desired look for label.
- __formattedLabel()__ Function to make a representation version of filter data that will be displayed inside __FilterItem__ component.
- __filterData()__ Returns the object for filter container.
- __isApplicable()__ Returns true/false depending on whether the values are correct.

### Events
- __onChangeType__ Handles the change of datepicker types
- __handleFirstCalChange__ Handles change on first datepicker
- __handleSecondCalChange__ Handles change on second datepicker

### Renderers
- __render()__ Renders the component.

## DatePicker.scss
## DayPicker.scss