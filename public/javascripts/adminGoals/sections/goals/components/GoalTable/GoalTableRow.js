import _ from 'lodash';
import classNames from 'classnames/bind';
import moment from 'moment';

import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import * as Actions from '../../actions';
import * as State from '../../state';
import * as Selectors from '../../selectors';
import * as Components from '../../../../components';

class GoalTableRow extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleClick',
      'handleEditClick',
      'handleLinkClick'
    ]);
  }

  handleClick(event) {
    const { goal, uiActions, paginatedRowIds } = this.props;

    if (event.shiftKey) {
      uiActions.selectUntil(paginatedRowIds, goal.get('id'));
    } else {
      uiActions.toggleSelectionById(goal.get('id'));
    }
  }

  handleEditClick() {
    event.stopPropagation();
    this.props.quickEditActions.openModal(this.props.goal.get('id'));
  }

  handleLinkClick(event) {
    event.stopPropagation();
  }

  render() {
    const { goal, selected, translations } = this.props;

    let goalPageUrl = `/stat/goals/${goal.get('base_dashboard')}/${goal.getIn(['category', 'id'])}/${goal.get('id')}/edit`;
    let dashboardUrl = `/stat/goals/${goal.get('base_dashboard')}`;
    let rowClass = classNames({ selected });

    return (
      <tr ref='tr' onClick={ this.handleClick } className={ rowClass } onDoubleClick={ this.handleEditClick }>
        <td><Components.Socrata.Checkbox checked={ selected }/></td>
        <td><span className="icon-goal"/></td>
        <td className="title-cell">
          <span className="title">{ goal.get('name') }</span>
          <div>
            <span className="edit-link-container">
              <a onClick={ this.handleEditClick } style={ { cursor: 'pointer' } }
                 data-goalId={ goal.get('id') }
                 className="goal-edit-link">{ translations.getIn(['admin', 'listing', 'quick_edit']) }</a>
            </span>
            <span className="goal-page-link">
              <a target="_blank" href={ goalPageUrl } className="external-link" onClick={ this.handleLinkClick }>
                { translations.getIn(['admin', 'listing', 'goal_page']) } <span className="icon-external"/>
              </a>
            </span>
          </div>
        </td>
        <td className="single-line">{ goal.getIn(['owner_name']) }</td>
        <td className="single-line">{ moment(goal.get('updated_at') || goal.get('created_at')).format('ll') }</td>
        <td
          className="single-line">{ translations.getIn(['admin', 'goal_values', goal.get('is_public') ? 'status_public' : 'status_private']) }</td>
        <td
          className="single-line">{ translations.getIn(['measure', 'progress', goal.getIn(['prevailing_measure', 'metadata', 'progress_override'])]) }</td>
        <td className="dashboard-link">
          <Components.Socrata.Flyout text={ translations.getIn(['admin', 'listing', 'view_dashboard']) } left="true">
            <a target="_blank" href={ dashboardUrl } className="external-link" onClick={ this.handleLinkClick }>
              { goal.getIn(['dashboard', 'name']) } <span className="icon-external"/></a>
          </Components.Socrata.Flyout>
        </td>
      </tr>
    );
  }
}

const mapStateToProps = (state, props) => {
  const selectedRowIds = State.getSelectedIds(state);
  const selected = selectedRowIds.includes(props.goal.get('id'));

  return {
    translations: state.get('translations'),
    paginatedRowIds: Selectors.getPaginatedGoalIds(state),
    selected
  };
};

const mapDispatchToProps = dispatch => ({
  uiActions: Redux.bindActionCreators(Actions.UI, dispatch),
  quickEditActions: Redux.bindActionCreators(Actions.QuickEdit, dispatch)
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(GoalTableRow);
