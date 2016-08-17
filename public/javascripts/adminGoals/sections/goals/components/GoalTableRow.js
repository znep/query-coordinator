import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import * as Actions from '../Actions';
import * as State from '../state';
import * as Selectors from '../selectors';

import classNames from 'classnames/bind';
import moment from 'moment';
import Flyout from '../../../components/Flyout';
import SocrataCheckbox from '../../../components/SocrataCheckbox/SocrataCheckbox';

class GoalTableRow extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.handleEditClick = this.handleEditClick.bind(this);
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
    this.props.quickEditActions.openModal(this.props.goal.get('id'));
  }

  render() {
    const { goal, isGoalSelected, translations } = this.props;

    let goalPageUrl = `/stat/goals/${goal.get('base_dashboard')}/${goal.getIn(['category', 'id'])}/${goal.get('id')}/edit`;
    let dashboardUrl = `/stat/goals/${goal.get('base_dashboard')}`;
    let rowClass = classNames({ selected: isGoalSelected });

    return (
      <tr ref='tr' onClick={ this.handleClick.bind(this) } className={ rowClass }>
        <td><SocrataCheckbox checked={ isGoalSelected }/></td>
        <td><span className="icon-goal"/></td>
        <td scope="title">{ goal.get('name') }
          <span className="goalPageLink">
          <Flyout text={ translations.getIn(['admin', 'listing', 'manage_on_goal_page']) }>
            <a target="_blank" href={ goalPageUrl } className="externalLink">
              { translations.getIn(['admin', 'listing', 'goal_page']) } <span className="icon-external"/></a>
          </Flyout>
        </span>
        </td>
        <td>{ goal.getIn(['owner_name']) }</td>
        <td>{ moment(goal.get('updated_at')).format('ll') }</td>
        <td>{ translations.getIn(['admin', 'goal_values', goal.get('is_public') ? 'status_public' : 'status_private']) }</td>
        <td>{ translations.getIn(['measure', 'progress', goal.getIn(['prevailing_measure', 'metadata', 'progress_override'])]) }</td>
        <td className="dashboardLink">
          <Flyout text={ translations.getIn(['admin', 'listing', 'view_dashboard']) }>
            <a target="_blank" href={ dashboardUrl } className="externalLink">
              { goal.getIn(['dashboard', 'name']) } <span className="icon-external"/></a>
          </Flyout>
        </td>
        <td className="editLinkContainer">
          <a onClick={ this.handleEditClick } style={ { cursor: 'pointer' } }
             data-goalId={ goal.get('id') } className="goalEditLink">Edit</a>
        </td>
      </tr>
    );
  }
}

const mapStateToProps = (state, props) => {
  const selectedRowIds = State.getSelectedIds(state);
  const isGoalSelected = selectedRowIds.includes(props.goal.get('id'));

  return {
    translations: state.get('translations'),
    paginatedRowIds: Selectors.getPaginatedGoalIds(state),
    selectedRowIds,
    isGoalSelected
  };
};

const mapDispatchToProps = dispatch => ({
  uiActions: Redux.bindActionCreators(Actions.UI, dispatch),
  quickEditActions: Redux.bindActionCreators(Actions.QuickEdit, dispatch)
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(GoalTableRow);
