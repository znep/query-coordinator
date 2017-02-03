import React, { PropTypes } from 'react';
import _ from 'lodash';
import AddFilter from './AddFilter';
import FilterItem from './FilterItem';
import { getDefaultFilterForColumn } from './filters';

/**
 * FilterBar
 * The FilterBar component renders a set of controls that are intended to allow users to apply
 * customized sets of filters to datasets and visualizations.  Eventually, if the user accessing the
 * component has an admin or publisher role, the FilterBar will expose additional functionality,
 * allowing the user to create new filters and add restrictions on how they are used.
 */
export const FilterBar = React.createClass({
  propTypes: {

    /**
     * The columns prop is an array of column objects.  Each column object must contain:
     *   - fieldName (string), the internal column name to query against.
     *   - name (string), the human-readable name of the column.
     *   - dataTypeName (string), the name of a data type.
     * If the dataTypeName is "number", additional fields must be present:
     *   - rangeMin (number), the minimum value present in the column.
     *   - rangeMax (number), the maximum value present in the column.
     * This list will be used to construct the list of filters available for use.  Eventually,
     * publishers and administrators are able to add at most one filter for each column.
     */
    columns: PropTypes.arrayOf(PropTypes.object),

    /**
     * The filters prop is an array of filter objects that will be rendered.  Each filter object is
     * structured according to the VIF specification.  The set of rendered controls will always
     * reflect the contents of this array.
     */
    filters: PropTypes.arrayOf(PropTypes.object),

    /**
     * Whether to display the filter bar's settings, including the option to add new filters and
     * individual filter settings. If this is set to true and none of the provided filters are
     * visible, the FilterBar will not render anything. Defaults to true.
     *
     * NOTE: Even if 'isReadOnly' is set to true, the parameters of individual, non-hidden filters
     * will still be changeable by users.
     */
    isReadOnly: PropTypes.bool,

    /**
     * The onUpdate prop is an optional function that will be called whenever the set of filters has
     * changed.  This may happen when a filter is added, a filter is removed, or the parameters of a
     * filter have changed.  The function is passed the new set of filters.  The consumer of this
     * component is expected to respond to the event by rerendering this component with the new
     * updated "filters" prop.  Any filters that do not have any criteria applied will have a filter
     * function of "noop".
     */
    onUpdate: PropTypes.func,

    /**
     * The fetchSuggestions prop is an optional function that is expected to return an array of
     * suggestions for a search term.  The function is passed the column to be searched on, which
     * is identical to one of the column objects in the "columns" prop, and a string representing
     * the current user input.  The function should return a Promise that resolves an array of
     * suggestions as strings.
     */
    fetchSuggestions: PropTypes.func
  },

  getDefaultProps() {
    return {
      filters: [],
      isReadOnly: true,
      onUpdate: _.noop,
      fetchSuggestions: _.constant(Promise.resolve([]))
    };
  },

  onFilterAdd(filter) {
    const { filters, onUpdate } = this.props;
    const newFilters = _.cloneDeep(filters);

    newFilters.unshift(filter);
    onUpdate(newFilters);
  },

  onFilterRemove(index) {
    const { filters, onUpdate } = this.props;
    const newFilters = _.cloneDeep(filters);

    newFilters.splice(index, 1);
    onUpdate(newFilters);
  },

  onFilterUpdate(filter, index) {
    const { filters, onUpdate } = this.props;

    filters.splice(index, 1, filter);

    onUpdate(filters);
  },

  renderAddFilter() {
    const { columns, filters, isReadOnly } = this.props;

    const availableColumns = _.reject(columns, (column) => {
      return _.find(filters, ['columnName', column.fieldName]);
    });

    const props = {
      columns: availableColumns,
      onClickColumn: (column) => {
        this.onFilterAdd(getDefaultFilterForColumn(column));
      }
    };

    return isReadOnly ? null : <AddFilter {...props} />;
  },

  renderFilters() {
    const { filters, columns, isReadOnly, fetchSuggestions } = this.props;

    return _.chain(filters).
      reject((filter) => isReadOnly && filter.isHidden).
      map((filter, i) => {
        const column = _.find(columns, { fieldName: filter.columnName });
        const props = {
          column,
          filter,
          isReadOnly,
          fetchSuggestions,
          onUpdate: _.partialRight(this.onFilterUpdate, i),
          onRemove: _.partial(this.onFilterRemove, i)
        };

        return <FilterItem key={i} {...props} />;
      }).
      value();
  },

  render() {
    const addFilter = this.renderAddFilter();
    const filters = this.renderFilters();

    if (_.isEmpty(addFilter) && _.isEmpty(filters)) {
      return null;
    }

    return (
      <div className="filter-bar-container">
        {addFilter}
        {filters}
      </div>
    );
  }
});

export default FilterBar;
