import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import { Dropdown } from 'common/components';
import ColumnDropdown from 'components/EditModal/ColumnDropdown';

describe('ColumnDropdown', () => {
  const measure = { };
  const displayableFilterableColumns = [
    { fieldName: 'first', name: 'First', dataTypeName: 'number', renderTypeName: 'number' },
    { fieldName: 'second', name: 'Second', dataTypeName: 'number', renderTypeName: 'number' }
  ];

  it('delegates column visibility to isColumnUsableWithMeasureArgument', () => {
    const isColumnUsableWithMeasureArgument = sinon.stub().callsFake(
      (column, measure, measureArgument) => {
      return column.fieldName === 'second';
    });

    const props = {
      displayableFilterableColumns,
      isColumnUsableWithMeasureArgument,
      measure,
      measureArgument: 'fakeMeasureArgument',
      onSelectColumn: () => {},
    };

    const element = shallow(<ColumnDropdown {...props} />);

    sinon.assert.calledTwice(isColumnUsableWithMeasureArgument);
    sinon.assert.calledWith(
      isColumnUsableWithMeasureArgument,
      displayableFilterableColumns[0], measure, 'fakeMeasureArgument'
    );
    sinon.assert.calledWith(
      isColumnUsableWithMeasureArgument,
      displayableFilterableColumns[1], measure, 'fakeMeasureArgument'
    );

    const dropdownProps = element.find(Dropdown).props();
    assert.lengthOf(dropdownProps.options, 1);
    const option = dropdownProps.options[0];
    assert.propertyVal(option, 'title', 'Second');
    assert.propertyVal(option, 'value', 'second');
  });

  it('calls back on onSelectColumn', () => {
    const props = {
      displayableFilterableColumns,
      isColumnUsableWithMeasureArgument: () => true,
      measure,
      measureArgument: 'fakeMeasureArgument',
      onSelectColumn: sinon.stub()
    };

    const dropdownProps = shallow(<ColumnDropdown {...props} />).find(Dropdown).props();
    dropdownProps.onSelection({ value: 'something' });
    sinon.assert.calledWith(props.onSelectColumn, 'something');
  });

  it('passes through some props', () => {
    const props = {
      displayableFilterableColumns,
      isColumnUsableWithMeasureArgument: () => true,
      measure,
      measureArgument: 'fakeMeasureArgument',
      onSelectColumn: () => {},
      id: 'the_id',
      columnFieldName: 'selected',
      labelledBy: 'a_label'
    };

    const dropdownProps = shallow(<ColumnDropdown {...props} />).find(Dropdown).props();
    assert.propertyVal(dropdownProps, 'value', 'selected');
    assert.propertyVal(dropdownProps, 'id', 'the_id');
    assert.propertyVal(dropdownProps, 'labelledBy', 'a_label');
  });
});
