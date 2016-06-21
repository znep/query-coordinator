import React from 'react';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';
import moment from 'moment';
import { selectRow, deselectRow } from '../actions/goalTableActions';
import Flyout from './Flyout';

class GoalTableRow extends React.Component {
  constructor(props) {
    super(props);
  }

  onClick() {
    if (this.props.selectedRows.indexOf(this.props.goal.get('id')) > -1) {
      this.props.rowDeselected(this.props.goal.get('id'));
    } else {
      this.props.rowSelected(this.props.goal.get('id'));
    }
  }

  render() {
    let selected = this.props.selectedRows.indexOf(this.props.goal.get('id')) > -1;
    let goalPageUrl = `/stat/goals/${this.props.goal.get('base_dashboard')}/${this.props.goal.get('category')}/${this.props.goal.get('id')}/edit`;
    let dashboardUrl = `/stat/goals/${this.props.goal.get('base_dashboard')}`;
    let rowClass = classNames({ selected });

    return <tr ref='tr' onClick={ this.onClick.bind(this) } className={ rowClass }>
      <td><input type="checkbox" checked={ selected }/></td>
      <td scope="title">{ this.props.goal.get('name') }
        <span className="goalPageLink" >
          <Flyout text={ this.props.translations.getIn(['admin', 'listing', 'manage_on_goal_page']) }>
            <a target="_blank" href={ goalPageUrl } className="externalLink">
              { this.props.translations.getIn(['admin', 'listing', 'goal_page']) } <span className="icon-external" /></a>
          </Flyout>
        </span>
      </td>
      <td>{ this.props.goal.getIn(['created_by', 'displayName']) }</td>
      <td>{ moment(this.props.goal.get('updated_at')).format('ll') }</td>
      <td>{ this.props.translations.getIn(['admin', 'goal_values', this.props.goal.get('is_public') ? 'status_public' : 'status_private']) }</td>
      <td>{ this.props.translations.getIn(['measure', 'progress', this.props.goal.get('prevailingMeasureProgress')]) }</td>
      <td className="dashboardLink">
        <Flyout text={ this.props.translations.getIn(['admin', 'listing', 'view_dashboard']) }>
          <a target="_blank" href={ dashboardUrl } className="externalLink">
            { this.props.dashboard.get('name') } <span className="icon-external" /></a>
        </Flyout>
      </td>
      <td className="editLinkContainer"><a href="" className="goalEditLink">Edit</a></td>
    </tr>;
  }
}

const mapStateToProps = state => ({
  translations: state.getIn(['goalTableData', 'translations']),
  selectedRows: state.getIn(['goalTableData', 'selectedRows'])
});

const mapDispatchToProps = dispatch => ({
  rowSelected: goalId => dispatch(selectRow(goalId)),
  rowDeselected: goalId => dispatch(deselectRow(goalId))
});

export default connect(mapStateToProps, mapDispatchToProps)(GoalTableRow);
