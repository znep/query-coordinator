export const noopFilter = {
  'function': 'noop'
};

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

export const mockMoneyColumn = {
  dataTypeName: 'money',
  fieldName: 'dinosaurMoney',
  name: 'Dinosaur Money',
  rangeMin: .1,
  rangeMax: 100.01
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
  name: 'Dinosaur Name (approximate)',
  top: [
    { item: 'tyrannosaurus', count: 100 },
    { item: 'chaoyangsaurus', count: 78 },
    { item: 'europasaurus', count: 45 },
    { item: 'gigantoraptor', count: 22 },
    { item: 'minmi', count: 10 }
  ]
};

export const mockCheckboxColumn = {
  dataTypeName: 'checkbox',
  fieldName: 'internal',
  name: 'Internal',
  top: [
    { item: true, count: 100 },
    { item: false, count: 78 },
    { item: null, count: 45 }
  ]
};

export const mockPicklistOptions = [
  { value: 'Purple', title: 'Purple' },
  { value: 'Pesto', title: 'Pesto' },
  { value: 'Russian', title: 'Russian' }
];
