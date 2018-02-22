import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { CSSTransitionGroup } from 'react-transition-group';
import classNames from 'classnames';

import I18n from 'common/i18n';

import SocrataIcon from '../SocrataIcon';
import AddFilter from './AddFilter';
import FilterItem from './FilterItem';
import { getDefaultFilterForColumn } from './filters';

// These are approximately the dimensions set by our CSS
const MAX_FILTER_WIDTH = 165;
const FILTER_CONFIG_TOGGLE_WIDTH = 30;

/**
 * FilterBar
 * The FilterBar component renders a set of controls that are intended to allow users to apply
 * customized sets of filters to datasets and visualizations.  Eventually, if the user accessing the
 * component has an admin or publisher role, the FilterBar will expose additional functionality,
 * allowing the user to create new filters and add restrictions on how they are used.
 */
export class FilterBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isExpanded: false,
      maxVisibleFilters: 0,
      newFilterAdded: false,
      maxFiltersToggleWidth: 0
    };

    _.bindAll(this, [
      'onFilterAdd',
      'onFilterRemove',
      'onFilterUpdate',
      'onToggleCollapsedFilters',
      'onWindowResize',
      'getContainerWidth',
      'getControlsWidth',
      'setMaxVisibleFilters',
      'renderAddFilter',
      'renderFilterIcon',
      'renderExpandControl',
      'renderVisibleFilters',
      'renderCollapsedFilters'
    ]);
  }

  componentDidMount() {
    this.setMaxVisibleFilters();

    window.addEventListener('resize', this.onWindowResize);
  }

  componentWillReceiveProps(nextProps) {
    const { filters, isReadOnly } = this.props;

    if (nextProps.isReadOnly !== this.props.isReadOnly) {
      this.setState({
        isExpanded: false
      });
    }

    // Track if a new filter was added
    if (filters.length < nextProps.filters.length) {
      this.setState({
        newFilterAdded: true
      });
    } else if (filters.length >= nextProps.filters.length) {
      this.setState({
        newFilterAdded: false
      });
    }
  }

  componentDidUpdate(prevProps) {
    this.setMaxVisibleFilters();

    const { filters, isReadOnly } = this.props;

    if (!isReadOnly) {
      // if we've added a filter, we need to focus on the new filter
      if (prevProps.filters.length < filters.length && this.container) {
        // the new filter should be the last rendered filter (there should be at least one rendered
        // filter if we get to this point)
        _.last(this.container.querySelectorAll('.filter-control-toggle')).focus();

      // otherwise we should focus on the add filter button
      } else if (prevProps.filters.length > filters.length && this.addFilter) {
        // we should always have an Add Filter button when isReadOnly is false
        this.addFilter.querySelector('button').focus();
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize);
  }

  onFilterAdd(filter) {
    const { filters, onUpdate } = this.props;
    const { maxVisibleFilters } = this.state;
    // This clone is very important. See comment in onFilterUpdate.
    const newFilters = _.cloneDeep(filters);

    newFilters.push(filter);
    onUpdate(newFilters);

    if (_.size(newFilters) > maxVisibleFilters) {
      this.setState({
        isExpanded: true
      });
    }
  }

  onFilterRemove(index) {
    const { filters, onUpdate } = this.props;
    // This clone is very important. See comment in onFilterUpdate.
    const newFilters = _.cloneDeep(filters);

    newFilters.splice(index, 1);

    onUpdate(newFilters);
  }

  onFilterUpdate(filter, index) {
    const { filters, onUpdate } = this.props;

    // This clone is _very important_. We obtained `filters`
    // from our parent (via props), and we don't want to mutate
    // their copy of `filters`. If we do, it makes tracking state
    // changes via Redux quite difficult.
    const newFilters = _.cloneDeep(filters);
    newFilters.splice(index, 1, filter);

    onUpdate(newFilters);
  }

  onToggleCollapsedFilters() {
    this.setState({
      isExpanded: !this.state.isExpanded
    });
  }

  onWindowResize() {
    this.setMaxVisibleFilters();

    if (this.state.newFilterAdded) {
      this.setState({
        newFilterAdded: false
      });
    }
  }

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
  }

  getControlsWidth() {
    const { maxFiltersToggleWidth } = this.state;
    const addFilterWidth = this.addFilter ? this.addFilter.offsetWidth : 0;
    const filterIconWidth = this.filterIcon ? this.filterIcon.offsetWidth : 0;
    const currentToggleWidth = this.expandControl ? this.expandControl.offsetWidth : 0;

    // Keeping track of the longer word used for the toggle - 'more' or 'less' (which may vary depending on
    // locale) so that the max number of visible filters doesn't jump back and forth when you toggle visibility.
    const maxWidth = _.max([currentToggleWidth, maxFiltersToggleWidth]);

    if (currentToggleWidth > maxFiltersToggleWidth) {
      this.setState({
        maxFiltersToggleWidth: currentToggleWidth
      });
    }

    return addFilterWidth + filterIconWidth + maxWidth;
  }

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
  }

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
        <span className="add-filter-spacer"></span>
        <AddFilter {...props} />
      </span>;
  }

  renderFilterIcon() {
    const { isReadOnly } = this.props;

    const icon = (
      <div className="filter-icon" ref={(ref) => this.filterIcon = ref}>
        <SocrataIcon name="filter" />
      </div>
    );

    return isReadOnly ? icon : null;
  }

  renderExpandControl() {
    const { isReadOnly, filters } = this.props;
    const { isExpanded, maxVisibleFilters } = this.state;

    const renderableFilters = _.reject(filters, (filter) => isReadOnly && filter.isHidden);

    const text = isExpanded ? I18n.t('shared.components.filter_bar.less') : I18n.t('shared.components.filter_bar.more');
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
  }

  renderVisibleFilters(filterItems) {
    const { maxVisibleFilters, newFilterAdded } = this.state;
    const filters = _.take(filterItems, maxVisibleFilters);

    return (
      <div className="visible-filters-container">
        <CSSTransitionGroup
          transitionName="filters"
          transitionEnter={newFilterAdded}
          transitionEnterTimeout={1000}
          transitionLeave={false}
          transitionLeaveTimeout={1}>
          {filters}
        </CSSTransitionGroup>
      </div>
    );
  }

  renderCollapsedFilters(filterItems) {
    const { maxVisibleFilters, newFilterAdded } = this.state;
    const filters = _.drop(filterItems, maxVisibleFilters);

    return (
      <div className="collapsed-filters-container">
        <CSSTransitionGroup
          transitionName="filters"
          transitionEnter={newFilterAdded}
          transitionEnterTimeout={1000}
          transitionLeave={false}
          transitionLeaveTimeout={1}>
          {filters}
        </CSSTransitionGroup>
      </div>
    );
  }

  render() {
    const { isExpanded } = this.state;
    const {
      columns,
      controlSize,
      filters,
      isReadOnly,
      isValidTextFilterColumnValue,
      spandex
    } = this.props;

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
          controlSize,
          filter,
          isReadOnly,
          isValidTextFilterColumnValue,
          spandex,
          onRemove: _.partial(this.onFilterRemove, index),
          onUpdate: _.partialRight(this.onFilterUpdate, index)
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
}

FilterBar.propTypes = {
  /**
   * WARNING: these are not raw columns from view metadata
   *
   * The columns prop is an array of column objects.  Each column object must contain:
   *   - fieldName (string), the internal column name to query against.
   *   - name (string), the human-readable name of the column.
   *   - renderTypeName (string), the name of a data type.
   * If the renderTypeName is "money" or "number", additional fields must be present:
   *   - rangeMin (number), the minimum value present in the column.
   *   - rangeMax (number), the maximum value present in the column.
   * This list will be used to construct the list of filters available for use.  Eventually,
   * publishers and administrators are able to add at most one filter for each column.
   *
   * The best place to get columns in the right format is via `metadataProvider.getDisplayableFilterableColumns`
   */
  columns: PropTypes.arrayOf(PropTypes.object),

  /**
   * The filters prop is an array of filter objects that will be rendered.  Each filter object is
   * structured according to the VIF specification.  The set of rendered controls will always
   * reflect the contents of this array.
   */
  filters: PropTypes.arrayOf(PropTypes.object),

  /**
   * A size string that will be inherited by child controls.
   * See Dropdown and Picklist for examples of size-dependent controls that
   * may exist within FilterItem components; note that explicit styles may not
   * be specified for each size (in which case default styles will apply).
   */
  controlSize: PropTypes.oneOf(['small', 'medium', 'large']),

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
   *
   * Recommended implementation uses: SoqlDataProvider#match(fieldName, searchTerm)
   *
   * TODO: Consider refactoring FilterBar to take an entire view metadata object instead.
   * That way, it can implement this functionality itself (we need the view UID).
   * Under this regime, we could also fetch the column stats ourselves inside the component.
   */
  isValidTextFilterColumnValue: PropTypes.func.isRequired,

  /**
   * A namespace containing information about Spandex access and availability.
   * See the SpandexSubscriber HOC for more details.
   */
  spandex: PropTypes.shape({
    available: PropTypes.bool,
    datasetUid: PropTypes.string.isRequired,
    domain: PropTypes.string.isRequired,
    provider: PropTypes.object // i.e. PropTypes.instanceOf(SpandexDataProvider)
  })
};

FilterBar.defaultProps = {
  filters: [],
  controlSize: 'small',
  isReadOnly: true,
  onUpdate: _.noop
};

export default FilterBar;
