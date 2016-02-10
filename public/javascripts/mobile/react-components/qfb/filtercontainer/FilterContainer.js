/* global Filter */

/* eslint-disable */
import React from 'react';
import $ from 'jquery';
import './filtercontainer.scss';
import FilterItem from '../filteritem/FilterItem';
import FlannelUtils from '../../flannel/flannel';
/* eslint-enable */

class FilterContainer extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      filterOps: this.props.filterOps,
      filters: []
    };

    this.domain = this.props.domain;
    this.datasetId = this.props.datasetId;

    this.onClickToggleFilters = this.onClickToggleFilters.bind(this);
    this.onClickNewFilter = this.onClickNewFilter.bind(this);
    this.onClickClearAllFilters = this.onClickClearAllFilters.bind(this);

    this.handleFilterAddition = this.handleFilterAddition.bind(this);
    this.handleFilterDeletion = this.handleFilterDeletion.bind(this);
  }

  // LIFE CYCLE EVENTS
  componentWillMount() {

  }
  componentDidMount() {
    $(document).keyup(function(e) {
      if (e.keyCode == 27) {
        // Press ESC key
        FlannelUtils.closeAll();
      }
    });
    FlannelUtils.init();
  }
  componentDidUpdate() {
    FlannelUtils.updateFlannels();
  }

  // UTILITY FUNCTIONS
  findIndexOfFilterFromArrayById(filterId, array) {
    var aScope = array;

    for (var i = 0; i < aScope.length; i++) {
      if (aScope[i].id == filterId) {
        return i;
      }
    }
  }

  // LOGIC
  onClickNewFilter(e) {
    var newFilterObj = {
      id: $(e.target).attr('id'),
      type: $(e.target).data('type'),
      name: $(e.target).data('name'),
      displayName: $(e.target).data('displayname'),
      data: null
    };

    var aFilters = this.state.filters;
    aFilters.push(newFilterObj);
    this.setState({ filters: aFilters });

    $('body').addClass('is-modal-open');
    $('.qfb-row-filters').removeClass('hidden-xs');
  }
  onClickToggleFilters() {
    if ($('.qfb-row-filters').hasClass('hidden-xs')) {
      $('.qfb-row-filters').removeClass('hidden-xs');
      $('#filter-expander').removeClass('caret-up');
    } else {
      $('.qfb-row-filters').addClass('hidden-xs');
      $('#filter-expander').addClass('caret-up');
    }
  }

  onClickClearAllFilters() {
    // AJAX CALL TO REMOVE ALL FILTERS
    this.setState({ filters: [] });
    Filter.clear();
  }

  handleFilterAddition(filterId, dataObj) {
    var aFilters = this.state.filters;
    var index = this.findIndexOfFilterFromArrayById(filterId, aFilters);
    aFilters[index].data = dataObj;

    this.setState({ filters: aFilters });

    this.props.handleFilterBroadcast({filters: aFilters});
    //Filter.apply(this.state.filters);
  }
  handleFilterDeletion(filterId) {
    var aFilters = this.state.filters;
    var filterCount = aFilters.length;
    var index = this.findIndexOfFilterFromArrayById(filterId, aFilters);
    aFilters.splice(index, 1);

    this.setState({ filters: aFilters });
    if (filterCount > 1) {
      Filter.apply(aFilters);
    } else if (filterCount == 1) {
      Filter.clear();
    }
  }

  // RENDERING
  render() {
    var filterOptions = this.state.filterOps.map((filter, i) => {
      var aFiltersApplied = this.state.filters;

      if (aFiltersApplied.length > 0) {
        var filterApplied = false;
        for (var j = 0; j < aFiltersApplied.length; j++) {
          if (aFiltersApplied[j].id == filter.id) {
            filterApplied = true;
            break;
          }
        }

        if (filterApplied) {
          return <li id={ filter.id }
            key={i}
            className="disabled"
            title="Filter already in use"
            data-type={filter.type}
            data-name={filter.name}
            data-displayname={filter.filterName}
            onClick={ this.onClickNewFilter }>{ filter.filterName }</li>;
        } else {
          return <li id={ filter.id }
            key={i}
            data-type={filter.type}
            data-name={filter.name}
            data-displayname={filter.filterName}
            onClick={ this.onClickNewFilter }>{ filter.filterName }</li>;
        }
      } else {
        return <li id={ filter.id }
          key={i}
          data-type={filter.type}
          data-name={filter.name}
          data-displayname={filter.filterName}
          onClick={ this.onClickNewFilter }>{ filter.filterName }</li>;
      }
    });

    var selectedFilters = this.state.filters.map((filter) => {

      return <FilterItem
          key={ 'qf-' + filter.id }
          filter={ filter }
          domain={ this.domain }
          datasetId={ this.datasetId }
          deletionHandler={ this.handleFilterDeletion.bind(this, filter.id) }
          additionHandler={ this.handleFilterAddition } />;
    });

    var self = this;

    var filtersMobileToggle = function() {
      if ( self.state.filters.length === 1) {
        return <button type="button"
                       id="filter-summary"
                       className="btn btn-link visible-only-on-mobile"
                       onClick={ self.onClickToggleFilters }>
          1 Active Filter <i id="filter-expander" className="caret"></i>
        </button>;
      } else if (self.state.filters.length > 1) {
        return <button type="button"
                       id="filter-summary"
                       className="btn btn-link visible-only-on-mobile"
                       onClick={ self.onClickToggleFilters }>
          { self.state.filters.length + ' Active Filters ' }<i id="filter-expander" className="caret"></i>
        </button>;
      }
    }();

    return  (
      <div id="qfb-container" className="container-fluid">
        <div className="qfb-row-main">
          <div id="qfb-dropdown" className="qfb-dropdown dropdown">
            <button type="button"
                    className="btn btn-default btn-lg dropdown-toggle"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false">
              Add Filter <span className="caret"></span>
            </button>
            <ul className="dropdown-menu">
              { filterOptions }
            </ul>
          </div>
          { filtersMobileToggle }
        </div>
        <div className="qfb-row-filters hidden-xs">
          <div id="qfb-filters">
            { selectedFilters }
          </div>
          { this.state.filters.length > 0 &&
          <button id="qfb-filters-btndelete" className="btn btn-link" onClick={ this.onClickClearAllFilters }>
            clear all
          </button>
          }
        </div>
      </div>
    );
  }

}

export default FilterContainer;
