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
import goalStatusTranslation from '../../../../helpers/goalStatus';

class GoalTableRow extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleClick',
      'handleEditClick',
      'handleLinkClick',
      'handleGoalPageLinkClick'
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

  handleEditClick(event) {
    event.stopPropagation();
    this.props.quickEditActions.openModal(this.props.goal.get('id'));
  }

  handleGoalPageLinkClick(event) {
    event.stopPropagation();
    this.props.uiActions.openGoalManagePage(this.props.goal.get('id'));
  }

  handleLinkClick(event) {
    event.stopPropagation();
  }

  render() {
    const { goal, selected, translations } = this.props;
    const dashboard = goal.get('base_dashboard', 'default');

    const goalPageUrl = `/stat/goals/${dashboard}/${goal.getIn(['category', 'id']) || 'uncategorized'}/${goal.get('id')}/edit`;
    const dashboardUrl = `/stat/goals/${dashboard}`;
    const rowClass = classNames({ selected });
    const endDate = goal.getIn(['prevailing_measure', 'end']);
    const isGoalEnded = endDate && moment(endDate).isBefore();
    const goalStatusTranslationKey = isGoalEnded ? 'end_progress' : 'progress';
    const goalStatus = goalStatusTranslation(translations, ['measure', goalStatusTranslationKey, goal.get('status')]);

    const isPublic = goal.get('is_public');
    // N.B: new Date(null) returns the epoch.
    const draftTime = new Date(goal.getIn([ 'narrative', 'draft', 'created_at' ]));
    const publishedTime = new Date(goal.getIn([ 'narrative', 'published', 'created_at' ]));

    // True if the narrative has been edited since it was published.
    // False otherwise.
    //
    // These scenarios are _not_ treated as unpublished drafts:
    // * Domain is still using classic editor.
    // * Particular goal was never loaded in Storyteller.
    const hasUnpublishedDraft = draftTime.getTime() > publishedTime.getTime();

    const publicStatus = hasUnpublishedDraft ? 'status_public_with_draft' : 'status_public';
    const goalVisibility = isPublic ? publicStatus : 'status_private';

    return (
      <tr ref='tr' onClick={ this.handleClick } className={ rowClass } onDoubleClick={ this.handleEditClick }>
        <td><Components.Socrata.Checkbox label={ `Select ${goal.get('name')}` } checked={ selected }/></td>
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
              <a target="_blank" href={ goalPageUrl } className="external-link" onClick={ this.handleGoalPageLinkClick }>
                { translations.getIn(['admin', 'listing', 'goal_page']) } <span className="icon-external"/>
              </a>
            </span>
          </div>
        </td>
        <td className="single-line">{ goal.get('owner_name') }</td>
        <td className="single-line">{ moment(goal.get('updated_at') || goal.get('created_at')).format('ll') }</td>
        <td className="single-line visibility">{ translations.getIn(['admin', 'goal_values', goalVisibility]) }</td>
        <td className="single-line">{ goalStatus }</td>
        <td className="dashboard-link">
          <a target="_blank" href={ dashboardUrl } className="external-link" onClick={ this.handleLinkClick }>
            { goal.getIn(['dashboard', 'name'], 'default') } <span className="icon-external"/></a>
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
