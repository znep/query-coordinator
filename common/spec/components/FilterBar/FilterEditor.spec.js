import _ from 'lodash';
import React from 'react';
import { shallow } from 'enzyme';
import FilterEditor from 'components/FilterBar/FilterEditor';
import NumberFilter from 'components/FilterBar/FilterEditor/NumberFilter';
import CheckboxFilter from 'components/FilterBar/FilterEditor/CheckboxFilter';
import TextFilter from 'components/FilterBar/FilterEditor/TextFilter';
import CalendarDateFilter from 'components/FilterBar/FilterEditor/CalendarDateFilter';

describe('FilterEditor', () => {
  it('renders nothing if no column specified', () => {
    const element = shallow(<FilterEditor />);
    assert.isNull(element.type());
  });

  const checkRenderedComponent = (expectedComponent, renderTypeName) => {
    describe(renderTypeName, () => {
      it(`passes through props to a ${expectedComponent.displayName}`, () => {
        const props = {
          column: {
            renderTypeName,
            rangeMin: 0,
            rangeMax: 0
          },
          onRemove: () => {},
          onUpdate: () => {},
          onClickConfig: () => {},
          filter: {},
          something: 'foo'
        };

        const element = shallow(<FilterEditor {...props} />);
        const child = element.find(expectedComponent);
        assert.equal(
          child.prop('something'),
          'foo'
        );
      });
    });
  };

  _.forOwn({
    calendar_date: CalendarDateFilter,
    money: NumberFilter,
    number: NumberFilter,
    text: TextFilter,
    checkbox: CheckboxFilter
  }, checkRenderedComponent);
});
