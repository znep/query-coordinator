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
    start: '1400-01-01T00:00:00',
    end: '1500-01-01T23:59:59'
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
  name: 'Dinosaur Time (approximate)',
  rangeMin: '1400-12-01T00:00:00',
  rangeMax: '1600-12-01T00:00:00'
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
