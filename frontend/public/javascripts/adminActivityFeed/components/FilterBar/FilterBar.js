import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import connectLocalization from '../Localization/connectLocalization';
import {FilterItem, Dropdown, SocrataIcon} from 'common/components';
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
      'onQuickFilterChange',
      'renderBlockLink'
    ]);

    this.state = {
      quickFilter: 'all'
    };
  }

  componentWillReceiveProps(nextProps) {
    const { eventType, eventStatus } = nextProps;
    let quickFilter = 'all';

    if (eventStatus === 'Failure') {
     quickFilter = 'data_update_failures';
    }

    if (eventType === 'Delete') {
      quickFilter = 'deleted_assets';
    }

    this.setState({quickFilter});
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
    const { dateFrom, dateTo } = this.props;

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
          start: dateFrom,
          end: dateTo
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
    const { eventType } = this.props;
    const eventTypes = ['all', 'append', 'import', 'replace', 'upsert', 'delete', 'restore'];
    const options = _.map(
      eventTypes,
      item => ({
        title: this.props.localization.translate(`actions.${item}`),
        value: _.upperFirst(item)
      })
    );
    const value = eventType !== 'All' ? eventType : null;
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
    const { eventStatus } = this.props;
    const statusTypes = [
      {title: 'All'},
      {title: 'Success', icon: 'checkmark-alt'},
      {title: 'SuccessWithDataErrors', icon: 'warning-alt'},
      {title: 'Failure', icon: 'close-circle'},
      {title: 'InProgress', icon: 'progress'}
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
    const value = eventStatus !== 'All' ? eventStatus : null;
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
    const { quickFilter } = this.state;
    const allClass = quickFilter === 'all' ? 'selected' : null;
    const failedClass = quickFilter === 'data_update_failures' ? 'selected' : null;
    const deletedClass = quickFilter === 'deleted_assets' ? 'selected' : null;

    return (
      <div className="quick-filters">
        <ul>
          {this.renderBlockLink('all', allClass)}
          {this.renderBlockLink('data_update_failures', failedClass)}
          {this.renderBlockLink('deleted_assets', deletedClass)}
        </ul>
      </div>
    );
  }

  renderBlockLink(value, className) {
    const {disabled} = this.props;
    const onClick = disabled ? null : _.wrap(value, this.onQuickFilterChange);

    return (
      <li>
        <button onClick={onClick} className={className}>
          <LocalizedText localeKey={`quick_filters.${value}`}/>
        </button>
      </li>
    );
  }

  render() {
    return (
      <div className="filter-bar">
        <this.renderQuickFilters />
        <div className="picker-filters">
          <div className="picker-filters-header">
            <LocalizedText localeKey='index_page.filter_by' />
          </div>
          <this.renderDateFilter />
          <this.renderEventFilter />
          <this.renderStatusFilter />
        </div>
      </div>
    );
  }
}

FilterBar.defaultProps = {
  disabled: false
};

FilterBar.propTypes = {
  dateFrom: React.PropTypes.string,
  dateTo: React.PropTypes.string,
  eventType: React.PropTypes.string,
  eventStatus: React.PropTypes.string,
  disabled: React.PropTypes.bool
};

const mapStateToProps = (state) => {
  const filtering = state.get('filtering').toJS();

  return {
    disabled: state.get('loading'),
    dateFrom: _.get(filtering, 'dateFrom'),
    dateTo: _.get(filtering, 'dateTo'),
    eventType: _.get(filtering, 'eventType'),
    eventStatus: _.get(filtering, 'eventStatus')
  };
};

const mapDispatchToProps = (dispatch) => ({
  filterByEvent: (value) => dispatch(actions.filterByEvent(value)),
  filterByStatus: (value) => dispatch(actions.filterByStatus(value)),
  filterByDate: (value) => dispatch(actions.filterByDate(value))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(FilterBar));
