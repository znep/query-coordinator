import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames/bind';
import { toggleAllRows, sortRows } from '../actions/goalTableActions';
import SocrataCheckbox from './SocrataCheckbox/SocrataCheckbox';

class GoalTableHead extends React.Component {
  renderColumn(label) {
    const { translations, currentColumn, currentDirection } = this.props;
    const direction = currentColumn == label && currentDirection == 'asc' ? 'desc' : 'asc';
    const sortIconClass = classNames('order-icon', {
      'persist-visible': currentColumn == label,
      'icon-arrow-down': currentColumn == label && direction == 'asc',
      'icon-arrow-up': currentColumn == label && direction == 'desc' || currentColumn != label
    });

    return (
      <th key={ _.uniqueId('th-') } className={ `table-heading-${label}` }>
        <span className="th-text" onClick={ _.wrap({ label, direction }, this.props.sort) }>
          { translations.get(label) }
          <span className={ sortIconClass } />
        </span>
      </th>
    );
  }

  render() {
    const { selectAllChecked } = this.props;
    const titlesList = ['title', 'owner', 'updated_at', 'visibility', 'goal_status', 'dashboard'];
    const titles = _.map(titlesList, this.renderColumn.bind(this));

    return (
      <thead>
        <tr>
          <th><SocrataCheckbox checked={ selectAllChecked } onClick={ this.props.toggleAllRows } /></th>
          <th>&nbsp;</th>
          { titles }
        </tr>
      </thead>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.getIn(['translations', 'admin', 'listing']),
  currentColumn: state.getIn(['goalTableData', 'tableOrder', 'column']),
  currentDirection: state.getIn(['goalTableData', 'tableOrder', 'direction']),
  selectAllChecked: state.getIn(['goalTableData', 'selectedRows']).size == state.getIn(['goalTableData', 'goals']).size
});

const mapDispatchToProps = dispatch => ({
  toggleAllRows: checked => dispatch(toggleAllRows(checked)),
  sort: values => dispatch(sortRows(values.label, values.direction))
});

export default connect(mapStateToProps, mapDispatchToProps)(GoalTableHead);
