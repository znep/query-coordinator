import React from 'react';
import $ from 'jquery';
import './filtercontainer.scss';
import FilterItem from '../filteritem/FilterItem'; // eslint-disable-line no-unused-vars
import FlannelUtils from '../../flannel/flannel';
import moment from 'moment';
import _ from 'lodash';

class FilterContainer extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      filterOps: this.props.filterOps,
      filters: this.props.filters
    };

    var self = this;
    this.domain = this.props.domain;
    this.datasetId = this.props.datasetId;

    this.onClickToggleFilters = this.onClickToggleFilters.bind(this);
    this.onChangeAddFilter = this.onChangeAddFilter.bind(this);
    this.onClickClearAllFilters = this.onClickClearAllFilters.bind(this);

    this.handleFilterAddition = this.handleFilterAddition.bind(this);
    this.handleFilterDeletion = this.handleFilterDeletion.bind(this);

    this.props.filterDataObservable.addEventListener('clearFilters.qfb.socrata', function() {
      self.onClickClearAllFilters();
    });
  }

  // LIFE CYCLE EVENTS
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
  onChangeAddFilter(e) {
    var options = e.target.options;

    for (var i = 0, l = options.length; i < l; i++) {
      if (options[i].selected && $(options[i]).attr('id')) {
        var $selectedOption = $(options[i]);

        var scale;
        try {
          scale = JSON.parse('[{0}]'.format($selectedOption.data('scale')));
        } catch (exception) {
          scale = [];
        }

        var newFilterObj = {
          id: $selectedOption.attr('id'),
          type: $selectedOption.data('type'),
          name: $selectedOption.data('name'),
          displayName: $selectedOption.data('displayname'),
          scale: scale,
          isLarge: $selectedOption.data('islarge'),
          data: null
        };

        var aFilters = this.state.filters;
        aFilters.push(newFilterObj);
        this.setState({ filters: aFilters });

        $('body').addClass('is-modal-open');
        $('.qfb-row-filters').removeClass('hidden-xs');
      }

      options[i].selected = false;
    }
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
    this.props.handleFilterBroadcast({filters: []});
  }

  prettifyFilterForDLMobile(filters) {
    var modifiedFilters = [];

    filters.forEach(function(filter) {
      if (_.isEmpty(filter.data)) {
        return;
      }

      var filterObj = {};

      switch (filter.type) {
        case 'int':
          if (filter.data.val1 && filter.data.val2) {
            filterObj.columnName = filter.name;
            filterObj['function'] = 'valueRange';
            filterObj.arguments = {
              start: filter.data.val1,
              end: filter.data.val2
            };

            modifiedFilters.push(filterObj);
          } else if (filter.data.val1) {
            filterObj.columnName = filter.name;
            filterObj['function'] = 'binaryOperator';
            filterObj.arguments = {
              operator: '>=',
              operand: filter.data.val1
            };

            modifiedFilters.push(filterObj);
          } else if (filter.data.val2) {
            filterObj.columnName = filter.name;
            filterObj['function'] = 'binaryOperator';
            filterObj.arguments = {
              operator: '<',
              operand: filter.data.val2
            };

            modifiedFilters.push(filterObj);
          }

          break;
        case 'string':
          filterObj.columnName = filter.name;
          filterObj['function'] = 'binaryOperator';

          if (filter.data.length > 1) {
            var aArguments = [];
            for (var i = 0; i < filter.data.length; i++) {
              aArguments.push({
                operator: '=',
                operand: filter.data[i].text
              });
            }
            filterObj.arguments = aArguments;
          } else {
            filterObj.arguments = {
              operator: '=',
              operand: filter.data[0].text
            };
          }
          modifiedFilters.push(filterObj);
          break;
        case 'calendar_date':
          filterObj.columnName = filter.name;
          filterObj['function'] = 'binaryOperator';

          if (filter.data.val1 && filter.data.val2) {
            filterObj.columnName = filter.name;
            filterObj['function'] = 'binaryOperator';
            filterObj.arguments = {
              operator: '>=',
              operand: moment(filter.data.val1).format('YYYY-MM-DD')
            };

            modifiedFilters.push(filterObj);

            var filterObj2 = _.clone(filterObj);
            filterObj2.arguments = {
              operator: '<',
              operand: moment(filter.data.val2).format('YYYY-MM-DD')
            };

            modifiedFilters.push(filterObj2);
          } else if (filter.data.val1) {
            filterObj.columnName = filter.name;
            filterObj['function'] = 'binaryOperator';
            filterObj.arguments = {
              operator: '>=',
              operand: moment(filter.data.val1).format('YYYY-MM-DD')
            };

            modifiedFilters.push(filterObj);
          } else if (filter.data.val2) {
            filterObj.columnName = filter.name;
            filterObj['function'] = 'binaryOperator';
            filterObj.arguments = {
              operator: '<',
              operand: moment(filter.data.val2).format('YYYY-MM-DD')
            };

            modifiedFilters.push(filterObj);
          }
          break;
        default:
          break;
      }
    });

    return modifiedFilters;
  }

  handleFilterAddition(filterId, dataObj) {
    var aFilters = this.state.filters;
    var index = this.findIndexOfFilterFromArrayById(filterId, aFilters);
    aFilters[index].data = dataObj;
    this.setState({ filters: aFilters });

    var modifiedFilters = this.prettifyFilterForDLMobile(aFilters);

    this.props.handleFilterBroadcast({filters: modifiedFilters});
  }

  handleFilterDeletion(filterId) {
    var aFilters = this.state.filters;
    var filterCount = aFilters.length;
    var index = this.findIndexOfFilterFromArrayById(filterId, aFilters);
    aFilters.splice(index, 1);

    this.setState({ filters: aFilters });
    if (filterCount > 1) {
      this.props.handleFilterBroadcast({filters: this.prettifyFilterForDLMobile(aFilters)});
    } else if (filterCount == 1) {
      this.props.handleFilterBroadcast({filters: []});
    }
  }

  makeFilterOption(filter, index, isApplied) {

    switch (filter.type) {
      case 'int':
        if (isApplied) {
          return <option id={ filter.id }
            key={ index }
            title="Filter already in use"
            data-type={ filter.type }
            data-name={ filter.name }
            data-displayname={ filter.filterName }
            data-scale={ filter.scale }
            data-islarge={ filter.largeDataset }
            disabled>{ filter.filterName }</option>;
        } else {
          return <option id={ filter.id }
            key={ index }
            data-type={ filter.type }
            data-name={ filter.name }
            data-displayname={ filter.filterName }
            data-scale={ filter.scale }
            data-islarge={ filter.largeDataset }>{ filter.filterName }</option>;
        }
      case 'calendar_date':
        if (isApplied) {
          return <option id={ filter.id }
            key={ index }
            title="Filter already in use"
            data-type={ filter.type }
            data-name={ filter.name }
            data-displayname={ filter.filterName }
            data-scale={ filter.scale }
            disabled>{ filter.filterName }</option>;
        } else {
          return <option id={ filter.id }
            key={ index }
            data-type={ filter.type }
            data-name={ filter.name }
            data-displayname={ filter.filterName }
            data-scale={ filter.scale }>{ filter.filterName }</option>;
        }
      default:
        if (isApplied) {
          return <option id={ filter.id }
            key={ index }
            title="Filter already in use"
            data-type={ filter.type }
            data-name={ filter.name }
            data-displayname={ filter.filterName }
            disabled>{ filter.filterName }</option>;
        } else {
          return <option id={ filter.id }
            key={ index }
            data-type={ filter.type }
            data-name={ filter.name }
            data-displayname={ filter.filterName }>{ filter.filterName }</option>;
        }
    }
  }

  render() {
    var filterOptions = this.state.filterOps.map((filter, index) => {

      var aFiltersApplied = this.state.filters;
      if (aFiltersApplied.length > 0) {
        var filterApplied = false;
        for (var j = 0; j < aFiltersApplied.length; j++) {
          if (aFiltersApplied[j].name == filter.name) {
            filterApplied = true;
            break;
          }
        }
        return this.makeFilterOption(filter, index, filterApplied);
      } else {
        return this.makeFilterOption(filter, index, false);
      }
    });

    var selectedFilters = this.state.filters.map((filter) => {
      if (filter.type == 'int') {
        return <FilterItem
          key={ 'qf-{0}'.format(filter.id) }
          filter={ filter }
          isLarge={ filter.isLarge }
          startWithClosedFlannel={ filter.startWithClosedFlannel }
          domain={ this.domain }
          datasetId={ this.datasetId }
          deletionHandler={ this.handleFilterDeletion.bind(this, filter.id) }
          additionHandler={ this.handleFilterAddition } />;
      } else if (filter.type == 'calendar_date') {
        for (var i = 0; i < this.state.filterOps.length; i++) {
          if (filter.name == this.state.filterOps[i].name) {
            filter.scale = this.state.filterOps[i].scale;
          }
        }

        return <FilterItem
          key={ 'qf-{0}'.format(filter.id) }
          filter={ filter }
          isLarge={ filter.isLarge }
          startWithClosedFlannel={ filter.startWithClosedFlannel }
          domain={ this.domain }
          datasetId={ this.datasetId }
          deletionHandler={ this.handleFilterDeletion.bind(this, filter.id) }
          additionHandler={ this.handleFilterAddition }/>;
      } else {
        return <FilterItem
          key={ 'qf-{0}'.format(filter.id) }
          filter={ filter }
          startWithClosedFlannel={ filter.startWithClosedFlannel }
          domain={ this.domain }
          datasetId={ this.datasetId }
          deletionHandler={ this.handleFilterDeletion.bind(this, filter.id) }
          additionHandler={ this.handleFilterAddition } />;
      }
    });

    var self = this;

    var filtersMobileToggle = function() {
      var activeFilterCount = 0;
      self.state.filters.forEach(function(filter) {
        if (filter.data) {
          activeFilterCount++;
        }
      });

      if ( activeFilterCount === 1) {
        return <button type="button"
                       id="filter-summary"
                       className="btn btn-link visible-only-on-mobile"
                       onClick={ self.onClickToggleFilters }>
          1 Active Filter <i id="filter-expander" className="caret"></i>
        </button>;
      } else if (activeFilterCount > 1) {
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
          <div id="qfb-dropdown" className="qfb-select-container">
            <span>Add Filter</span>
            <i className="icon-arrow-down"></i>
            <select className="qfb-select-filter-list" onChange={ this.onChangeAddFilter }>
              <option>Add Filter</option>
              { filterOptions }
            </select>
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
