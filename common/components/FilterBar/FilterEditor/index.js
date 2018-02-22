import React from 'react';

import CalendarDateFilter from './CalendarDateFilter';
import CheckboxFilter from './CheckboxFilter';
import NumberFilter from './NumberFilter';
import TextFilter from './TextFilter';

export default (props) => {
  const { column } = props;
  if (!column) { return null; }

  // This needs to be capitalized - JSX checks the case of the first letter.
  let SpecificFilter;

  // This used to be a switch statement, but the babel
  // transpiler crashed in Storyteller when trying to
  // compile. Transforming to an if/else resolved the
  // crash.
  if (column.renderTypeName === 'calendar_date') {
    SpecificFilter = CalendarDateFilter;
  } else if (column.renderTypeName === 'money') {
    SpecificFilter = NumberFilter;
  } else if (column.renderTypeName === 'number') {
    SpecificFilter = NumberFilter;
  } else if (column.renderTypeName === 'text') {
    SpecificFilter = TextFilter;
  } else if (column.renderTypeName === 'checkbox') {
    SpecificFilter = CheckboxFilter;
  } else {
    return null;
  }

  return (<SpecificFilter {...props} />);
};
