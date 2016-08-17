import React from 'react';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';
import moment from 'moment';
import { selectRow, deselectRow, multipleRowSelection } from '../actions/goalTableActions';
import { openGoalQuickEdit } from '../actions/quickEditActions';
import SocrataFlyout from './SocrataFlyout/SocrataFlyout';
import SocrataCheckbox from './SocrataCheckbox/SocrataCheckbox';

class GoalTableRow extends React.Component {
  onClick(event) {
    if (event.button === 0) {
      const { selectedRows, lastSelectedRow } = this.props;
      const goalId = this.props.goal.get('id');

      event.preventDefault();

      if (event.shiftKey && lastSelectedRow) {
        this.props.multipleRowSelection(goalId);
      } else if (selectedRows.includes(goalId)) {
        this.props.rowDeselected(goalId);
      } else {
        this.props.rowSelected(goalId);
      }

      return false;
    }
  }

  onDoubleClick() {
    this.props.openQuickEditWithId(this.props.goal.get('id'));
  }

  onLinkClick(event) {
    event.stopPropagation();
  }

  render() {
    let selected = this.props.selectedRows.indexOf(this.props.goal.get('id')) > -1;
    let goalPageUrl = `/stat/goals/${this.props.goal.get('base_dashboard')}/${this.props.goal.getIn(['category', 'id'])}/${this.props.goal.get('id')}/edit`;
    let dashboardUrl = `/stat/goals/${this.props.goal.get('base_dashboard')}`;
    let rowClass = classNames({ selected });

    return <tr ref='tr' onClick={ this.onClick.bind(this) } className={ rowClass } onDoubleClick={ this.onDoubleClick.bind(this) }>
      <td><SocrataCheckbox checked={ selected } /></td>
      <td><span className="icon-goal"/></td>
      <td className="title-cell">
        <span className="title">{ this.props.goal.get('name') }</span>
        <div>
          <span className="edit-link-container">
            <a onClick={ this.props.openQuickEdit } style={ { cursor : 'pointer' } }
               data-goalId={ this.props.goal.get('id') } className="goal-edit-link">{ this.props.translations.getIn([ 'admin', 'listing', 'quick_edit' ]) }</a>
          </span>
          <span className="goal-page-link" >
            <a target="_blank" href={ goalPageUrl } className="external-link" onClick={ this.onLinkClick }>
              { this.props.translations.getIn(['admin', 'listing', 'goal_page']) } <span className="icon-external" />
            </a>
          </span>
        </div>
      </td>
      <td className="single-line">{ this.props.goal.getIn(['created_by', 'displayName']) }</td>
      <td className="single-line">{ moment(this.props.goal.get('updated_at') || this.props.goal.get('created_at')).format('ll') }</td>
      <td className="single-line">{ this.props.translations.getIn(['admin', 'goal_values', this.props.goal.get('is_public') ? 'status_public' : 'status_private']) }</td>
      <td className="single-line">{ this.props.translations.getIn(['measure', 'progress', this.props.goal.get('prevailingMeasureProgress')]) }</td>
      <td className="dashboard-link">
        <SocrataFlyout text={ this.props.translations.getIn(['admin', 'listing', 'view_dashboard']) } left="true">
          <a target="_blank" href={ dashboardUrl } className="external-link" onClick={ this.onLinkClick }>
            { this.props.dashboard.get('name') } <span className="icon-external" /></a>
        </SocrataFlyout>
      </td>
    </tr>;
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  selectedRows: state.getIn(['goalTableData', 'selectedRows']),
  lastSelectedRow: state.getIn(['goalTableData', 'lastSelectedRow'])
});

const mapDispatchToProps = dispatch => ({
  rowSelected: goalId => dispatch(selectRow(goalId)),
  rowDeselected: goalId => dispatch(deselectRow(goalId)),
  multipleRowSelection: goalId => dispatch(multipleRowSelection(goalId)),
  openQuickEdit: event => dispatch(openGoalQuickEdit(event.target.getAttribute('data-goalId'))),
  openQuickEditWithId: goalId => dispatch(openGoalQuickEdit(goalId))
});

export default connect(mapStateToProps, mapDispatchToProps)(GoalTableRow);
