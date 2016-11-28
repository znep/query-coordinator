export const mockValueRangeFilter = {
  parameters: {
    'function': 'valueRange',
    columnName: 'dinosaurAge',
    arguments: {
      start: 1,
      end: 3
    }
  },
  isLocked: false,
  isHidden: false,
  isRequired: false,
  allowMultiple: false
};

export const mockBinaryOperatorFilter = {
  parameters: {
    'function': 'binaryOperator',
    columnName: 'dinosaurName',
    arguments: {
      operator: '=',
      operand: 'Timmy'
    }
  },
  isLocked: false,
  isHidden: false,
  isRequired: false,
  allowMultiple: false
};

export const mockNumberColumn = {
  dataTypeName: 'number',
  fieldName: 'dinosaurAge',
  name: 'Dinosaur Age (approximate)',
  rangeMin: .1,
  rangeMax: 100.01
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
