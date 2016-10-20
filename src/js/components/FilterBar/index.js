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
     * The filters prop is an array of filter objects that will be rendered.  Each filter object
     * is structured as follows:
     *   - parameters (object), an object identical in structure to the elements of the "filters"
     *     array used in vifs.
     *   - isLocked (boolean), whether or not users are restricted from changing the filter's value.
     *   - isHidden (boolean), whether or not the filter is visible to non-roled users.
     *   - isRequired (boolean), whether or not the filter is required to have a value set.
     *   - allowMultiple (boolean), whether or not multiple values are able to be selected for the
     *     filter.
     * The set of rendered controls will always reflect the contents of this array.
     */
    filters: PropTypes.arrayOf(PropTypes.object),

    /**
     * The onUpdate prop is an optional function that will be called whenever the set of filters
     * has changed.  This may happen when a filter is added, a filter is removed, or the parameters
     * of a filter have changed.  The function is passed the new set of filters.  The consumer of
     * this component is expected to respond to the event by applying its own desired processing
     * (if any), and rerendering this component with the new updated "filters" prop.
     */
    onUpdate: PropTypes.func,

    /**
     * The fetchSuggestions prop is an optional function that is expected to return an array of
     * suggestions for a search term.  The function is passed the column to be searched on, which
     * is identical to one of the column objects in the "columns" prop, and a string representing
     * the current user input.  The function should return an array of suggestions as strings or
     * a Promise that resolves to such a value.
     */
    fetchSuggestions: PropTypes.func
  },

  getDefaultProps() {
    return {
      onUpdate: _.noop,
      fetchSuggestions: _.constant(Promise.resolve([])),
      filters: []
    };
  },

  onFilterAdd(filter) {
    const { filters, onUpdate } = this.props;

    filters.unshift(filter);

    onUpdate(filters);
  },

  onFilterRemove(index) {
    const { filters, onUpdate } = this.props;

    filters.splice(index, 1);

    onUpdate(filters);
  },

  onFilterUpdate(filter, index) {
    const { filters, onUpdate } = this.props;

    filters.splice(index, 1, filter);

    onUpdate(filters);
  },

  renderAddFilter() {
    const { columns, filters } = this.props;

    const availableColumns = _.reject(columns, (column) => {
      return _.find(filters, ['parameters.columnName', column.fieldName]);
    });

    const props = {
      columns: availableColumns,
      onClickColumn: (column) => {
        const filter = getDefaultFilterForColumn(column);
        this.onFilterAdd(filter);
      }
    };

    return <AddFilter {...props} />;
  },

  renderFilters() {
    const { filters, columns, fetchSuggestions } = this.props;

    return _.map(filters, (filter, i) => {
      const column = _.find(columns, { fieldName: filter.parameters.columnName });
      const props = {
        column,
        filter,
        fetchSuggestions,
        onUpdate: _.partialRight(this.onFilterUpdate, i),
        onRemove: _.partial(this.onFilterRemove, i)
      };

      return <FilterItem key={i} {...props} />;
    });
  },

  render() {
    return (
      <div className="filter-bar-container">
        {this.renderAddFilter()}
        {this.renderFilters()}
      </div>
    );
  }
});

export default FilterBar;
