export const mockValueRangeFilter = {
  'function': 'valueRange',
  columnName: 'dinosaurAge',
  arguments: {
    start: 1,
    end: 3
  },
  isHidden: false
};

export const mockTimeRangeFilter = {
  'function': 'timeRange',
  columnName: 'dinosaurTime',
  arguments: {
    start: '1500-12-01T00:00:00',
    end: '2017-12-01T00:00:00'
  },
  isHidden: false
};

export const mockBinaryOperatorFilter = {
  'function': 'binaryOperator',
  columnName: 'dinosaurName',
  arguments: [
    {
      operator: '=',
      operand: 'Timmy'
    },
    {
      operator: '=',
      operand: 'Tommy'
    },
    {
      operator: 'IS NULL'
    }
  ],
  isHidden: false,
  joinOn: 'OR'
};

export const mockNumberColumn = {
  dataTypeName: 'number',
  fieldName: 'dinosaurAge',
  name: 'Dinosaur Age (approximate)',
  rangeMin: .1,
  rangeMax: 100.01
};

export const mockCalendarDateColumn = {
  dataTypeName: 'calendar_date',
  fieldName: 'dinosaurTime',
  name: 'Dinosaur Time (approximate)'
};

export const mockTextColumn = {
  dataTypeName: 'text',
  fieldName: 'dinosaurName',
  name: 'Dinosaur Name (approximate)'
};

export const mockPicklistOptions = [
  { value: 'Purple', title: 'Purple' },
  { value: 'Pesto', title: 'Pesto' },
  { value: 'Russian', title: 'Russian' }
];
