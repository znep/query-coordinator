import _ from 'lodash';

/**
 * Generates an array containing one or more Mixpanel event payloads, based on
 * user actions that pertain to viz canvas filters.
 */

// VERY IMPORTANT: Changing the names of Mixpanel events is fraught with peril.
// The list of events in the Mixpanel UI will become more confusing, and you'll
// probably break secondary analyses like funnels. RENAME AT YOUR OWN RISK!!!
// In order to avoid repetition, event names are given a common prefix when
// the Mixpanel request is actually made (see reducer).
const eventNames = {
  'pristine': {
    added: 'Saved Added Filter',
    removed: 'Saved Removed Filter',
    changedValues: 'Saved Filter with Changed Values',
    changedVisibility: 'Saved Filter with Changed Visibility',
    resetValues: 'Saved Filter with Reset Values'
  },
  'transient': {
    added: 'Added Filter',
    removed: 'Removed Filter',
    changedValues: 'Changed Filter Values',
    changedVisibility: 'Changed Filter Visibility',
    resetValues: 'Reset Filter Values'
  }
};

// Selectors and comparators
const getColumns = (state) => _.get(state, 'view.columns', []);
const getFilters = (state) => _.get(state, 'filters', []);

const matchFiltersByColumn = (newFilter, oldFilter) => (
  newFilter.columnName === oldFilter.columnName
);
const findColumnByFilter = (columns, filter) => (
  _.find(columns, { fieldName: filter.columnName })
);

// Event generators
const toEvent = (name, filter, column) => ({
  name,
  properties: {
    'Hidden': filter.isHidden,
    'Column Type': _.get(column, 'dataTypeName', '<unknown>')
  }
});

export const generateFilterEvents = (oldState, newState, eventType) => {
  // Perform rudimentary sanity checks on input.
  let validated = true;
  if (!_.has(eventNames, eventType)) {
    console.error('Cannot generate filter events with invalid event type!', eventType);
    validated = false;
  }
  if (!_.isPlainObject(oldState)) {
    console.error('Cannot generate filter events with invalid previous state!', oldState);
    validated = false;
  }
  if (!_.isPlainObject(newState)) {
    console.error('Cannot generate filter events with invalid current state!', newState);
    validated = false;
  }

  if (!validated) {
    return [];
  }

  // Select slices of state.
  const columns = getColumns(newState);
  const oldFilters = getFilters(oldState);
  const newFilters = getFilters(newState);

  // Identify newly added and removed filters.
  const addedFilters = _.differenceWith(newFilters, oldFilters, matchFiltersByColumn);
  const removedFilters = _.differenceWith(oldFilters, newFilters, matchFiltersByColumn);

  // Identify existing filters whose configuration has been changed.
  // One filter may belong to both value- and visibility-related filter sets.
  const changedValuesFilters = _.intersectionWith(newFilters, oldFilters, (newFilter, oldFilter) => {
    return matchFiltersByColumn(newFilter, oldFilter) &&
      !_.isEqual(newFilter.arguments, oldFilter.arguments) &&
      newFilter.function !== 'noop';
  });
  const resetValuesFilters = _.intersectionWith(newFilters, oldFilters, (newFilter, oldFilter) => {
    return matchFiltersByColumn(newFilter, oldFilter) &&
      oldFilter.function !== 'noop' &&
      newFilter.function === 'noop';
  });
  const changedVisibilityFilters = _.intersectionWith(newFilters, oldFilters, (newFilter, oldFilter) => {
    return matchFiltersByColumn(newFilter, oldFilter) &&
    oldFilter.isHidden !== newFilter.isHidden;
  });

  // Create helpers using variables in scope.
  const names = eventNames[eventType];
  const toEventWithName = _.curry(
    (name, filter) => toEvent(name, filter, findColumnByFilter(columns, filter))
  );

  // Map changes onto Mixpanel event payloads.
  return [].concat(
    addedFilters.map(toEventWithName(names.added)),
    removedFilters.map(toEventWithName(names.removed)),
    changedValuesFilters.map(toEventWithName(names.changedValues)),
    changedVisibilityFilters.map(toEventWithName(names.changedVisibility)),
    resetValuesFilters.map(toEventWithName(names.resetValues))
  );
};
