import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import connectLocalization from '../Localization/connectLocalization';
import {FilterItem, Dropdown, SocrataIcon} from 'socrata-components';
import LocalizedText from '../Localization/LocalizedText';
import * as actions from '../../actions';
import './FilterBar.scss';

class FilterBar extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'renderEventFilter',
      'renderStatusFilter',
      'renderDateFilter',
      'renderQuickFilters',
      'onEventChange',
      'onStatusChange',
      'onDateChange',
      'onDateClear',
      'onQuickFilterChange'
    ]);

    this.state = {
      quickFilter: 'all'
    };
  }

  onDateChange(event) {
    const from = _.get(event, 'arguments.start', null);
    const to = _.get(event, 'arguments.end', null);

    if (from && to) {
      this.props.filterByDate({from, to});
    }
  }

  onDateClear() {
    this.props.filterByDate({from: null, to: null});
  }

  onEventChange(event) {
    this.props.filterByEvent(event.value);
  }

  onStatusChange(event) {
    this.props.filterByStatus(event.value);
  }

  onQuickFilterChange(quickFilter) {
    this.setState({quickFilter});

    switch (quickFilter) {
      case 'data_update_failures':
        this.props.filterByStatus('Failure');
        this.props.filterByEvent('All');
        break;
      case 'deleted_assets':
        this.props.filterByEvent('Delete');
        this.props.filterByStatus('All');
        break;
      default:
        this.props.filterByEvent('All');
        this.props.filterByStatus('All');
    }

    this.props.filterByDate({from: null, to: null});
  }

  renderDateFilter() {
    const props = {
      column: {
        name: this.props.localization.translate('columns.date_started'),
        fieldName: 'date',
        dataTypeName: 'calendar_date'
      },
      isReadOnly: false,
      filter: {
        'function': '',
        columnName: 'date',
        isHidden: true,
        arguments: {
          start: _.get(this.props, 'filtering.dateFrom'),
          end: _.get(this.props, 'filtering.dateTo')
        }
      },
      onUpdate: this.onDateChange,
      onRemove: _.noop,
      onClear: this.onDateClear
    };

    return (
      <FilterItem {...props} />
    );
  }

  renderEventFilter() {
    const eventTypes = ['all', 'append', 'import', 'replace', 'upsert', 'delete', 'restore'];
    const options = _.map(
      eventTypes,
      item => ({
        title: this.props.localization.translate(`actions.${item}`),
        value: _.upperFirst(item)
      })
    );
    const currentValue = _.get(this.props, 'filtering.eventType');
    const value = currentValue !== 'All' ? currentValue : null;
    const placeholder = this.props.localization.translate('columns.event');

    const props = {
      id: 'eventFilter',
      onSelection: this.onEventChange,
      options,
      placeholder,
      value
    };

    return (
      <Dropdown {...props} />
    );
  }

  renderStatusFilter() {
    const statusTypes = [
      {title: 'All'},
      {title: 'Success', icon: 'checkmark-alt'},
      {title: 'SuccessWithDataErrors', icon: 'warning-alt'},
      {title: 'Failure', icon: 'close-circle'},
      {title: 'InProgress', icon: 'processing'}
    ];

    const renderOption = (option) => {
      const index = _.findIndex(statusTypes, {title: option.value});
      const icon = statusTypes[index].icon ?
        <SocrataIcon name={statusTypes[index].icon} /> :
        null;

      return (
        <span className="picklist-title" key={index}>
          {icon}
          {option.title}
        </span>
      );
    };

    const options = _.map(
      statusTypes,
      item => ({
        title: this.props.localization.translate(`statuses.${_.snakeCase(item.title)}`),
        value: item.title,
        render: renderOption
      })
    );
    const currentValue = _.get(this.props, 'filtering.eventStatus');
    const value = currentValue !== 'All' ? currentValue : null;
    const placeholder = this.props.localization.translate('columns.status');

    const props = {
      id: 'statusFilter',
      onSelection: this.onStatusChange,
      options,
      placeholder,
      value
    };

    return (
      <Dropdown {...props} />
    );
  }

  renderQuickFilters() {
    const allClass = this.state.quickFilter === 'all' ? 'selected' : null;
    const failedClass = this.state.quickFilter === 'data_update_failures' ? 'selected' : null;
    const deletedClass = this.state.quickFilter === 'deleted_assets' ? 'selected' : null;

    return (
      <ul>
        <li onClick={_.bind(this.onQuickFilterChange, this, 'all')} className={allClass}>
          <LocalizedText localeKey={'quick_filters.all'}/>
        </li>
        <li onClick={_.bind(this.onQuickFilterChange, this, 'data_update_failures')} className={failedClass}>
          <LocalizedText localeKey={'quick_filters.data_update_failures'}/>
        </li>
        <li onClick={_.bind(this.onQuickFilterChange, this, 'deleted_assets')} className={deletedClass}>
          <LocalizedText localeKey={'quick_filters.deleted_assets'}/>
        </li>
      </ul>
    );
  }

  render() {
    return (
      <div className="filter-bar">
        <div className="quick-filters">
          <this.renderQuickFilters />
        </div>
        <div className="picker-filters">
          <div className="picker-filters-header">
            <LocalizedText localeKey='index_page.filter_by' />
          </div>
          <this.renderEventFilter />
          <this.renderStatusFilter />
          <this.renderDateFilter />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  filtering: state.get('filtering').toJS()
});

const mapDispatchToProps = (dispatch) => ({
  filterByEvent: (value) => dispatch(actions.filterByEvent(value)),
  filterByStatus: (value) => dispatch(actions.filterByStatus(value)),
  filterByDate: (value) => dispatch(actions.filterByDate(value))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(FilterBar));
