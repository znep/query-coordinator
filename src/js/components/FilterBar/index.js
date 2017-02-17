import React, { PropTypes } from 'react';
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

  getInitialState() {
    return {
      isExpanded: false,
      hasCollapsedFilters: false
    };
  },

  componentDidMount() {
    if (this.shouldCollapseFilters()) {
      // We're disabling this because we need to know the size of everything in order to determine
      // how many filters we can fit and how many we need to collapse.
      /* eslint-disable react/no-did-mount-set-state */
      this.setState({
        hasCollapsedFilters: true
      });
      /* eslint-enable react/no-did-mount-set-state */
    }

    window.addEventListener('resize', this.onWindowResize);
  },

  componentWillReceiveProps(nextProps) {
    const renderableFilters = this.getRenderableFilters(this.props);
    const nextRenderableFilters = this.getRenderableFilters(nextProps);

    if (this.shouldCollapseFilters(nextRenderableFilters)) {
      if (renderableFilters.length < nextRenderableFilters.length) {
        this.setState({
          hasCollapsedFilters: true,
          isExpanded: true
        });
      } else {
        this.setState({
          hasCollapsedFilters: true
        });
      }
    } else {
      this.setState({
        hasCollapsedFilters: false
      });
    }
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize);
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

  onToggleCollapsedFilters() {
    this.setState({
      isExpanded: !this.state.isExpanded
    });
  },

  onWindowResize() {
    if (this.shouldCollapseFilters()) {
      this.setState({
        hasCollapsedFilters: true
      });
    } else {
      this.setState({
        hasCollapsedFilters: false
      });
    }
  },

  getContainerPaddingLeft() {
    const styles = window.getComputedStyle(this.container);
    return _.parseInt(styles.paddingLeft);
  },

  getContainerPaddingRight() {
    const styles = window.getComputedStyle(this.container);
    return _.parseInt(styles.paddingRight);
  },

  getContainerWidth() {
    const containerPadding = this.getContainerPaddingLeft() + this.getContainerPaddingRight();

    // Note that clientWidth does not include borders or margin. The FilterBar currently doesn't
    // have borders, but this could potentially throw our calculations off in the future if a
    // border is added.
    return this.container.clientWidth - containerPadding;
  },

  getAddFilterOrFilterIconWidth() {
    const addFilterWidth = this.addFilter ? this.addFilter.offsetWidth : 0;
    const filterIconWidth = this.filterIcon ? this.filterIcon.offsetWidth : 0;

    return addFilterWidth + filterIconWidth;
  },

  getControlsWidth() {
    const collapsedFiltersToggleWidth = this.expandControl.offsetWidth;
    return this.getAddFilterOrFilterIconWidth() + collapsedFiltersToggleWidth;
  },

  getFilterWidth() {
    const { isReadOnly } = this.props;
    return isReadOnly ? MAX_FILTER_WIDTH : (MAX_FILTER_WIDTH + FILTER_CONFIG_TOGGLE_WIDTH);
  },

  getRenderableFilters({ isReadOnly, filters }) {
    return _.reject(filters, (filter) => isReadOnly && filter.isHidden);
  },

  getVisibleFiltersCount() {
    const spaceLeftForFilters = this.getContainerWidth() - this.getControlsWidth();
    return _.floor(spaceLeftForFilters / this.getFilterWidth());
  },

  shouldCollapseFilters(
    renderableFilters = this.getRenderableFilters(this.props)
  ) {
    if (!this.container) {
      return;
    }

    // Calculate the likely size of all the things
    const containerWidth = this.getContainerWidth();
    const filterBarControlsWidth = this.getControlsWidth();
    const filterWidths = renderableFilters.length * this.getFilterWidth();

    return containerWidth < (filterWidths + filterBarControlsWidth);
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

    return isReadOnly ?
      null :
      <div className="add-filter-container" ref={(ref) => this.addFilter = ref}>
        <AddFilter {...props} />
      </div>;
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

  renderVisibleFilters(filters) {
    const { hasCollapsedFilters } = this.state;

    const visibleFilters = hasCollapsedFilters ?
      filters.slice(0, this.getVisibleFiltersCount()) :
      filters;

    return (
      <div className="visible-filters-container">
        {visibleFilters}
      </div>
    );
  },

  renderCollapsedFilters(filters) {
    const { hasCollapsedFilters } = this.state;

    if (!hasCollapsedFilters) {
      return null;
    }

    const visibleFiltersCount = this.getVisibleFiltersCount();
    const collapsedFilters = filters.slice(visibleFiltersCount);

    const paddingLeft = visibleFiltersCount > 0 ?
      this.getAddFilterOrFilterIconWidth() + this.getContainerPaddingLeft() :
      this.getContainerPaddingLeft();

    const props = {
      style: { paddingLeft },
      className: 'collapsed-filters-container'
    };

    return (
      <div {...props}>
        {collapsedFilters}
      </div>
    );
  },

  renderExpandControl() {
    const { isExpanded, hasCollapsedFilters } = this.state;

    const text = isExpanded ? t('filter_bar.less') : t('filter_bar.more');
    const classes = classNames('btn btn-transparent btn-expand-control', {
      'is-hidden': !hasCollapsedFilters
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

  render() {
    const { columns, isReadOnly, fetchSuggestions } = this.props;
    const { isExpanded } = this.state;
    const renderableFilters = this.getRenderableFilters(this.props);

    if (isReadOnly && _.isEmpty(renderableFilters)) {
      return null;
    }

    const filterItems = _.map(renderableFilters, (filter, index) => {
      const column = _.find(columns, { fieldName: filter.columnName });
      const props = {
        column,
        filter,
        isReadOnly,
        fetchSuggestions,
        onUpdate: _.partialRight(this.onFilterUpdate, index),
        onRemove: _.partial(this.onFilterRemove, index)
      };

      return <FilterItem key={index} {...props} />;
    });

    const visibleFilters = this.renderVisibleFilters(filterItems);
    const collapsedFilters = this.renderCollapsedFilters(filterItems);

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
        {visibleFilters}
        {collapsedFilters}
        {this.renderExpandControl()}
      </div>
    );
  }
});

export default FilterBar;
