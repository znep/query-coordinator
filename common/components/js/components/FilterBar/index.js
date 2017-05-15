import React, { PropTypes } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import _ from 'lodash';
import classNames from 'classnames';
import { translate as t } from '../../common/I18n';
import SocrataIcon from '../SocrataIcon';
import AddFilter from './AddFilter';
import FilterItem from './FilterItem';
import { getDefaultFilterForColumn } from './filters';

// These are approximately the dimensions set by our CSS
const MAX_FILTER_WIDTH = 140;
const FILTER_CONFIG_TOGGLE_WIDTH = 30;

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
     * If the dataTypeName is "money" or "number", additional fields must be present:
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
     * This function is supplied a column and a String value.
     *
     * The downstream supplier decides whether or not the value is
     * valid and returns a promise which eventually resolves with the response.
     *
     * If the value is not valid, the promise should be rejected. This will
     * show an error to the user and request a retyping.
     *
     * If a function is not supplied, the UI will not allow arbitrary values.
     */
    isValidTextFilterColumnValue: PropTypes.func
  },

  getDefaultProps() {
    return {
      filters: [],
      isReadOnly: true,
      onUpdate: _.noop
    };
  },

  getInitialState() {
    return {
      isExpanded: false,
      maxVisibleFilters: 0
    };
  },

  componentDidMount() {
    this.setMaxVisibleFilters();

    window.addEventListener('resize', this.onWindowResize);
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.isReadOnly !== this.props.isReadOnly) {
      this.setState({
        isExpanded: false
      });
    }
  },

  componentDidUpdate(previousProps) {
    this.setMaxVisibleFilters();

    const { filters, isReadOnly } = this.props;

    if (!isReadOnly) {
      // if we've added a filter, we need to focus on the new filter
      if (previousProps.filters.length < filters.length && this.container) {
        // the new filter should be the last rendered filter (there should be at least one rendered
        // filter if we get to this point)
        _.last(this.container.querySelectorAll('.filter-control-toggle')).focus();

      // otherwise we should focus on the add filter button
      } else if (previousProps.filters.length > filters.length && this.addFilter) {
        // we should always have an Add Filter button when isReadOnly is false
        this.addFilter.querySelector('button').focus();
      }
    }
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize);
  },

  onFilterAdd(filter) {
    const { filters, onUpdate } = this.props;
    const { maxVisibleFilters } = this.state;
    const newFilters = _.cloneDeep(filters);

    newFilters.push(filter);
    onUpdate(newFilters);

    if (_.size(newFilters) > maxVisibleFilters) {
      this.setState({
        isExpanded: true
      });
    }
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

  onToggleCollapsedFilters() {
    this.setState({
      isExpanded: !this.state.isExpanded
    });
  },

  onWindowResize() {
    this.setMaxVisibleFilters();
  },

  getContainerWidth() {
    if (!this.container) {
      return 0;
    }

    const styles = window.getComputedStyle(this.container);
    const containerPadding = _.parseInt(styles.paddingLeft) + _.parseInt(styles.paddingRight);

    // Note that clientWidth does not include borders or margin. The FilterBar currently doesn't
    // have borders, but this could potentially throw our calculations off in the future if a
    // border is added.
    return this.container.clientWidth - containerPadding;
  },

  getControlsWidth() {
    const addFilterWidth = this.addFilter ? this.addFilter.offsetWidth : 0;
    const filterIconWidth = this.filterIcon ? this.filterIcon.offsetWidth : 0;
    const collapsedFiltersToggleWidth = this.expandControl ? this.expandControl.offsetWidth : 0;

    return addFilterWidth + filterIconWidth + collapsedFiltersToggleWidth;
  },

  setMaxVisibleFilters() {
    const { isReadOnly } = this.props;
    const { maxVisibleFilters } = this.state;
    const containerWidth = this.getContainerWidth();
    const spaceLeftForFilters = containerWidth - this.getControlsWidth();
    const filterWidth = isReadOnly ?
      MAX_FILTER_WIDTH :
      (MAX_FILTER_WIDTH + FILTER_CONFIG_TOGGLE_WIDTH);
    const newMaxVisibleFilters = _.floor(spaceLeftForFilters / filterWidth);

    if (containerWidth > 0 && maxVisibleFilters !== newMaxVisibleFilters) {
      this.setState({
        maxVisibleFilters: newMaxVisibleFilters
      });
    }
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

    // FIXME Put styles in the tests and make the span a div
    return isReadOnly ?
      null :
      <span className="add-filter-container" ref={(ref) => this.addFilter = ref}>
        <AddFilter {...props} />
      </span>;
  },

  renderFilterIcon() {
    const { isReadOnly } = this.props;

    const icon = (
      <div className="filter-icon" ref={(ref) => this.filterIcon = ref}>
        <SocrataIcon name="filter" />
      </div>
    );

    return isReadOnly ? icon : null;
  },

  renderExpandControl() {
    const { isReadOnly, filters } = this.props;
    const { isExpanded, maxVisibleFilters } = this.state;

    const renderableFilters = _.reject(filters, (filter) => isReadOnly && filter.isHidden);

    const text = isExpanded ? t('filter_bar.less') : t('filter_bar.more');
    const classes = classNames('btn btn-transparent btn-expand-control', {
      'is-hidden': _.size(renderableFilters) <= maxVisibleFilters
    });

    return (
      <button
        className={classes}
        onClick={this.onToggleCollapsedFilters}
        ref={(ref) => this.expandControl = ref}>
        {text}
      </button>
    );
  },

  renderVisibleFilters(filterItems) {
    const { maxVisibleFilters } = this.state;
    const filters = _.take(filterItems, maxVisibleFilters);

    return (
      <div className="visible-filters-container">
        <ReactCSSTransitionGroup
          transitionName="filters"
          transitionEnterTimeout={1000}
          transitionLeaveTimeout={1}>
          {filters}
        </ReactCSSTransitionGroup>
      </div>
    );
  },

  renderCollapsedFilters(filterItems) {
    const { maxVisibleFilters } = this.state;
    const filters = _.drop(filterItems, maxVisibleFilters);

    return (
      <div className="collapsed-filters-container">
        <ReactCSSTransitionGroup
          transitionName="filters"
          transitionEnterTimeout={1000}
          transitionLeaveTimeout={1}>
          {filters}
        </ReactCSSTransitionGroup>
      </div>
    );
  },

  render() {
    const { columns, filters, isReadOnly, isValidTextFilterColumnValue } = this.props;
    const { isExpanded } = this.state;

    // We are mapping and then compacting here, instead of first filtering out the filters we
    // wouldn't be rendering, because we need to keep track of the filter's actual index in the
    // filters array in order to properly update the filters.
    const filterItems = _.chain(filters).
      map((filter, index) => {
        if (isReadOnly && filter.isHidden) {
          return null;
        }

        const column = _.find(columns, { fieldName: filter.columnName });
        const props = {
          column,
          filter,
          isReadOnly,
          onUpdate: _.partialRight(this.onFilterUpdate, index),
          onRemove: _.partial(this.onFilterRemove, index),
          isValidTextFilterColumnValue
        };

        return <FilterItem key={index} {...props} />;
      }).
      compact().
      value();

    if (isReadOnly && _.isEmpty(filterItems)) {
      return null;
    }

    const containerProps = {
      className: classNames('filter-bar-container', {
        'filter-bar-expanded': isExpanded
      }),
      ref: (ref) => this.container = ref
    };

    return (
      <div {...containerProps}>
        {this.renderFilterIcon()}
        {this.renderAddFilter()}
        {this.renderVisibleFilters(filterItems)}
        {this.renderCollapsedFilters(filterItems)}
        {this.renderExpandControl()}
      </div>
    );
  }
});

export default FilterBar;
