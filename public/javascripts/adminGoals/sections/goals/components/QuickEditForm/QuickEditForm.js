import _ from 'lodash';
import $ from 'jquery';
import * as React from 'react';
import * as ReactRedux  from 'react-redux';
import * as Immutable from 'immutable';
import * as Actions from '../../actions';
import * as SharedActions from '../../../shared/actions';
import * as State from '../../state';
import * as Selectors from '../../selectors';
import * as Components from '../../../../components';
import * as Constants from '../../../../constants';

import EditGeneral from './EditGeneral';
import EditPrevailingMeasure from './EditPrevailingMeasure';
import Details from './Details';

import './QuickEditForm.scss';

class GoalQuickEdit extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'save',
      'onInputChange',
      'onSelectChange',
      'updateInitialFormData'
    ]);
  }

  componentDidMount() {
    $('body').css('overflow', 'hidden');

    this.updateInitialFormData(this.props.goal);
  }

  componentWillUnmount() {
    $('body').css('overflow', 'initial');
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.goal != nextProps.goal) {
      this.updateInitialFormData(nextProps.goal);
    }
  }

  updateInitialFormData(goal) {
    const initialFormData = new Immutable.Map({
      visibility: goal.get('is_public') ? 'public' : 'private',
      name: goal.get('name'),
      actionType: goal.getIn(['prevailing_measure', 'metadata', 'edit', 'action_type']),
      prevailingMeasureName: goal.getIn(['prevailing_measure', 'metadata', 'name']),
      prevailingMeasureProgressOverride: goal.getIn(['prevailing_measure', 'metadata', 'use_progress_override']) ?
        goal.getIn(['prevailing_measure', 'metadata', 'progress_override']) : 'none',
      unit: goal.getIn(['prevailing_measure', 'unit']),
      percentUnit: goal.getIn(['prevailing_measure', 'target_delta_is_percent']) ?
        '%' : goal.getIn(['prevailing_measure', 'unit']),
      startDate: goal.getIn(['prevailing_measure', 'start']) ?
        goal.getIn(['prevailing_measure', 'start']) : null,
      endDate: goal.getIn(['prevailing_measure', 'end']) ?
        goal.getIn(['prevailing_measure', 'end']) : null,
      measureTarget: goal.getIn(['prevailing_measure', 'target']),
      measureTargetType: goal.getIn(['prevailing_measure', 'target_type']),
      measureBaseline: goal.getIn(['prevailing_measure', 'baseline']),
      measureTargetDelta: goal.getIn(['prevailing_measure', 'target_delta']),
      measureMaintainType: goal.getIn(['prevailing_measure', 'metadata', 'edit', 'maintain_type']) || 'within'
    });

    this.props.updateFormData(initialFormData);
  }

  /**
   * Executed on input element changes. Updates current form data.
   * Expects an event object with name and value property.
   * @param event
   */
  onInputChange(event) {
    let data = {};
    data[event.target.name] = event.target.value;

    const newData = this.props.formData.merge(data);
    this.props.updateFormData(newData);
  }

  /**
   * Executed on select element changes. Updates current form data
   * Expects element name and an event object with value property
   * @param name
   * @param selected
   */
  onSelectChange(name, selected) {
    let data = {};
    data[name] = _.isFunction(selected.format) ? selected.format(Constants.datetimeFormat) : selected.value;

    const newData = this.props.formData.merge(data);
    this.props.updateFormData(newData);
  }

  /**
   * Saves form data to API.
   * Only exists because of we need stop form submit default action.
   * @param event
   */
  save(event) {
    event.preventDefault();
    this.props.saveGoalQuickEdit();
  }

  render() {
    const { translations, goal, message, isGoalNotConfigured } = this.props;

    const baseDashboardId = goal.get('base_dashboard');
    const categoryId = goal.getIn(['category', 'id']);
    const goalId = goal.get('id');
    const goalPageUrl = `/stat/goals/${baseDashboardId}/${categoryId}/${goalId}/edit`;

    const goalName = goal.get('name');
    const goalTitle = `${ translations.getIn(['admin', 'quick_edit', 'quick_edit_measure']) } - ${goalName}`;

    // Fail message on top of modal
    const failureAlert = message.get('visible') ?
      <Components.Socrata.Alert type={ message.get('type') } message={ message.get('content') }/> :
      null;

    // Warning message for not configured goals.
    const notConfiguredGoalMessage = (
      <div className="unconfigured-goal-warning-message">
        <span>{ translations.getIn(['admin', 'quick_edit', 'not_configured_goal_message', 'text']) }</span>
        &nbsp;
        <a href={ goalPageUrl } target="_blank">
          { translations.getIn(['admin', 'quick_edit', 'not_configured_goal_message', 'link']) }.
        </a>
      </div>
    );

    const notConfiguredGoalAlert = isGoalNotConfigured ?
      <Components.Socrata.Alert type="warning" message={ notConfiguredGoalMessage }/> : null;

    const subComponentProps = {
      goal,
      onInputChange: this.onInputChange,
      onSelectChange: this.onSelectChange,
      isGoalNotConfigured
    };

    return (
      <Components.Socrata.Modal.Modal fullScreen>
        {/* Form element covers content and footer. We need buttons at the footer to work with form. */}
        <form onSubmit={ this.save }>
          <Components.Socrata.Modal.Header title={ goalTitle } onClose={ this.props.handleNavigateAway }
                               className="modal-header-with-link">
            <a className="feedback" onClick={ this.props.openFeedbackFlannel }>
              { translations.getIn(['admin', 'quick_edit', 'feedback']) }
            </a>
          </Components.Socrata.Modal.Header>
          <Components.Socrata.Modal.Content>
            { failureAlert }

            <div className="goal-quick-edit-form">
              <EditGeneral {...subComponentProps} />
              { notConfiguredGoalAlert }
              <EditPrevailingMeasure {...subComponentProps} />
            </div>
            <Details goal={ goal }/>
          </Components.Socrata.Modal.Content>
          <Components.Socrata.Modal.Footer>
            <div className="link-container">
              <a href={ goalPageUrl } target="_blank" className="external-link">
                { translations.getIn(['admin', 'quick_edit', 'manage_on_goal_page']) }
                <span className="icon-external"/>
              </a>
            </div>
            <Components.Socrata.Button onClick={ this.props.dismissModal }>
              { translations.getIn(['admin', 'quick_edit', 'cancel']) }
            </Components.Socrata.Button>
            <Components.Socrata.Button type="submit" primary onClick={ this.save } disabled={ !this.props.unsavedChanges }>
              { translations.getIn(['admin', 'quick_edit', 'save']) }
            </Components.Socrata.Button>
          </Components.Socrata.Modal.Footer>
        </form>
      </Components.Socrata.Modal.Modal>
    );
  }
}

const mapStateToProps = state => {
  const quickEdit = State.getQuickEdit(state);
  const goal = Selectors.getQuickEditGoal(state);

  const formData = quickEdit.get('formData');
  const unsavedChanges = formData !== quickEdit.get('initialFormData');

  const isGoalNotConfigured = _.isNil(goal.get('prevailing_measure'));

  return {
    translations: state.get('translations'),
    goal: goal,
    message: quickEdit.get('message'),
    isGoalNotConfigured: isGoalNotConfigured,
    unsavedChanges: unsavedChanges,
    formData: formData
  };
};

const mapDispatchToProps = dispatch => ({
  dismissModal: () => dispatch(Actions.QuickEdit.closeModal()),
  saveGoalQuickEdit: () => dispatch(Actions.QuickEdit.save()),
  updateFormData: newData => dispatch(Actions.QuickEdit.updateFormData(newData)),
  openFeedbackFlannel: event => dispatch(SharedActions.showFeedbackFlannel(event.target))
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Components.ModalQuitEventHandler(GoalQuickEdit));
