import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {FilterItem, Dropdown, SocrataIcon} from 'common/components';
import LocalizedText from 'common/i18n/components/LocalizedText';
import I18n from 'common/i18n';
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
      filter: this.props.filter
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({filter: nextProps.filter});
  }

  setFilter(filter) {
    this.setState({
      filter: _.merge(this.state.filter, filter)
    }, () => this.props.dispatchSetFilter(this.state.filter));
  }

  onDateChange(event) {
    const dateFrom = _.get(event, 'arguments.start', null);
    const dateTo = _.get(event, 'arguments.end', null);

    if (dateFrom && dateTo) {
      this.setFilter({dateFrom, dateTo});
    }
  }

  onDateClear() {
    this.setFilter({dateFrom: null, dateTo: null});
  }

  onEventChange(event) {
    this.setFilter({event: event.value});
  }

  onStatusChange(event) {
    this.setFilter({status: event.value});
  }

  onQuickFilterChange(quickFilter) {
    const preFilter = {dateFrom: null, dateTo: null};

    switch (quickFilter) {
      case 'data_update_failures':
        this.setFilter(_.merge(preFilter, { status: 'Failure', event: 'All' }));
        break;
      case 'deleted_assets':
        this.setFilter(_.merge(preFilter, { event: 'Delete', status: 'All' }));
        break;
      default:
        this.setFilter(_.merge(preFilter, { event: 'All', status: 'All' }));
    }
  }

  renderDateFilter() {
    const { dateFrom, dateTo } = this.state.filter;

    const props = {
      column: {
        name: I18n.t('screens.admin.jobs.columns.date_started'),
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
    const eventType = this.state.filter.event;
    const eventTypes = ['all', 'append', 'import', 'replace', 'upsert', 'delete', 'restore'];
    const options = _.map(
      eventTypes,
      item => ({
        title: I18n.t(`screens.admin.jobs.actions.${item}`),
        value: _.upperFirst(item)
      })
    );
    const value = eventType !== 'All' ? eventType : null;
    const placeholder = I18n.t('screens.admin.jobs.columns.event');

    const props = {
      id: 'eventFilter',
      size: 'small',
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
    const eventStatus = this.state.filter.status;
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
        title: I18n.t(`screens.admin.jobs.statuses.${_.snakeCase(item.title)}`),
        value: item.title,
        render: renderOption
      })
    );
    const value = eventStatus !== 'All' ? eventStatus : null;
    const placeholder = I18n.t('screens.admin.jobs.columns.status');

    const props = {
      id: 'statusFilter',
      size: 'small',
      onSelection: this.onStatusChange,
      options,
      placeholder,
      value
    };

    return (
      <Dropdown {...props} />
    );
  }

  isAllQuickFilterSelected() {
    const { filter } = this.state;

    const noFilterApplied = (
      filter.event === 'All' &&
      filter.status === 'All' &&
      _.isNull(filter.dateFrom) &&
      _.isNull(filter.dateTo)
    );

    const noQuickFilterApplied = (
      filter.status !== 'Failure' &&
      filter.event !== 'Delete'
    );

    return noFilterApplied || noQuickFilterApplied;
  }

  renderQuickFilters() {
    const { filter } = this.state;

    const allClass = this.isAllQuickFilterSelected() ? 'selected' : null;
    const failedClass = filter.status === 'Failure' ? 'selected' : null;
    const deletedClass = filter.event === 'Delete' ? 'selected' : null;

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
    const onClick = _.wrap(value, this.onQuickFilterChange);

    return (
      <li>
        <button onClick={onClick} className={className}>
          <LocalizedText localeKey={`screens.admin.jobs.quick_filters.${value}`}/>
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
            <LocalizedText localeKey='screens.admin.jobs.index_page.filter_by' />
          </div>
          <this.renderDateFilter />
          <this.renderEventFilter />
          <this.renderStatusFilter />
        </div>
      </div>
    );
  }
}

FilterBar.propTypes = {
  filter: React.PropTypes.shape({
    event: React.PropTypes.string,
    status: React.PropTypes.string,
    dateFrom: React.PropTypes.string,
    dateTo: React.PropTypes.string
  })
};

const mapStateToProps = (state) => ({
  filter: state.get('filter').toJS()
});

const mapDispatchToProps = (dispatch) => ({
  dispatchSetFilter: filter => dispatch(actions.setFilter(filter))
});

export default connect(mapStateToProps, mapDispatchToProps)(FilterBar);
