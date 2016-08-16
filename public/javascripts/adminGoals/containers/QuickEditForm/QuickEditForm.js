import 'whatwg-fetch';
import _ from 'lodash';
import $ from 'jquery';
import Immutable from 'immutable';
import React from 'react';
import { connect } from 'react-redux';
import { dismissModal, saveGoalQuickEdit, updateFormData } from '../../actions/quickEditActions';
import { openFeedbackFlannel } from '../../actions/feedbackFlannelActions';
import moment from 'moment';
import { modalQuitEventHandler } from '../../components/ModalQuitEventHandler';
import SocrataAlert from '../../components/SocrataAlert';
import SocrataButton from '../../components/SocrataButton';
import * as SocrataModal from '../../components/SocrataModal';
import EditGeneral from './EditGeneral';
import EditPrevailingMeasure from './EditPrevailingMeasure';
import Details from './Details';
import 'react-datepicker/dist/react-datepicker.css';
import './QuickEditForm.scss';

class GoalQuickEdit extends React.Component {
  constructor(props) {
    super(props);

    const initialFormData = new Immutable.Map({
      visibility: props.goal.get('is_public') ? 'public' : 'private',
      name: props.goal.get('name'),
      actionType: props.goal.getIn(['prevailing_measure', 'edit', 'action_type']),
      prevailingMeasureName: props.goal.getIn(['prevailing_measure', 'name']),
      prevailingMeasureProgressOverride: props.goal.getIn(['prevailing_measure', 'progress_override']),
      unit: props.goal.getIn(['prevailing_measure', 'unit']),
      percentUnit: props.goal.getIn(['prevailing_measure', 'target_delta_is_percent']) ?
        '%' : props.goal.getIn(['prevailing_measure', 'unit']),
      startDate: props.goal.getIn(['prevailing_measure', 'start']) ?
        moment(props.goal.getIn(['prevailing_measure', 'start'])) : null,
      endDate: props.goal.getIn(['prevailing_measure', 'end']) ?
        moment(props.goal.getIn(['prevailing_measure', 'end'])) : null,
      measureTarget: props.goal.getIn(['prevailing_measure', 'target']),
      measureTargetType: props.goal.getIn(['prevailing_measure', 'target_type']),
      measureBaseline: props.goal.getIn(['prevailing_measure', 'baseline']),
      measureTargetDelta: props.goal.getIn(['prevailing_measure', 'target_delta']),
      measureMaintainType: props.goal.getIn(['prevailing_measure', 'edit', 'maintain_type']) || 'within'
    });

    props.updateFormData(initialFormData);

    _.bindAll(this, [
      'save',
      'onInputChange',
      'onSelectChange'
    ]);
  }

  componentDidMount() {
    $('body').css('overflow', 'hidden');
  }

  componentWillUnmount() {
    $('body').css('overflow', 'initial');
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
    data[name] = selected instanceof moment ? selected : selected.value;

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
    const { translations, goal, showFailureMessage, isGoalNotConfigured } = this.props;

    const baseDashboardId = goal.get('base_dashboard');
    const categoryId = goal.getIn(['category', 'id']);
    const goalId = goal.get('id');
    const goalPageUrl = `/stat/goals/${baseDashboardId}/${categoryId}/${goalId}/edit`;

    const goalName = goal.get('name');
    const goalTitle = `${ translations.getIn(['admin', 'quick_edit', 'quick_edit_measure']) } - ${goalName}`;

    // Fail message on top of modal
    const failureAlert = showFailureMessage ?
      <SocrataAlert type="error" message={ translations.getIn(['admin', 'quick_edit', 'default_alert_message']) }/> :
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
      <SocrataAlert type="warning" message={ notConfiguredGoalMessage }/> : null;

    const subComponentProps = {
      goal,
      onInputChange: this.onInputChange,
      onSelectChange: this.onSelectChange,
      isGoalNotConfigured
    };

    return (
      <SocrataModal.Modal fullScreen>
        {/* Form element covers content and footer. We need buttons at the footer to work with form. */}
        <form onSubmit={ this.save }>
          <SocrataModal.Header title={ goalTitle } onClose={ this.props.handleNavigateAway } className="modal-header-with-link">
            <a className="feedback" onClick={ this.props.openFeedbackFlannel }>
              { translations.getIn(['admin', 'quick_edit', 'feedback']) }
            </a>
          </SocrataModal.Header>
          <SocrataModal.Content>
            { failureAlert }

            <div className="goal-quick-edit-form">
              <EditGeneral {...subComponentProps} />
              { notConfiguredGoalAlert }
              <EditPrevailingMeasure {...subComponentProps} />
            </div>
            <Details goal={ goal } />
          </SocrataModal.Content>
          <SocrataModal.Footer>
            <div className="link-container">
              <a href={ goalPageUrl } target="_blank" className="externalLink">
                { translations.getIn(['admin', 'quick_edit', 'manage_on_goal_page']) }
                <span className="icon-external" />
              </a>
            </div>
            <SocrataButton onClick={ this.props.dismissModal }>
              { translations.getIn(['admin', 'quick_edit', 'cancel']) }
            </SocrataButton>
            <SocrataButton type="submit" primary onClick={ this.save } disabled={ !this.props.unsavedChanges }>
              { translations.getIn(['admin', 'quick_edit', 'save']) }
            </SocrataButton>
          </SocrataModal.Footer>
        </form>
      </SocrataModal.Modal>
    );
  }
}

const mapStateToProps = state => {
  const goal = state.getIn(['goalTableData', 'cachedGoals', state.getIn(['quickEditForm', 'goalId'])]);
  const isGoalNotConfigured = _.isNil(goal.get('prevailingMeasureProgress'));
  const unsavedChanges = state.getIn(['quickEditForm', 'formData']) !== state.getIn(['quickEditForm', 'initialFormData']);

  return {
    translations: state.get('translations'),
    goal: goal,
    showFailureMessage: state.getIn(['quickEditForm', 'showFailureMessage']),
    isGoalNotConfigured: isGoalNotConfigured,
    unsavedChanges: unsavedChanges,
    formData: state.getIn(['quickEditForm', 'formData'])
  };
};

const mapDispatchToProps = dispatch => ({
  dismissModal: () => dispatch(dismissModal()),
  saveGoalQuickEdit: (goalId, version, values) => dispatch(saveGoalQuickEdit(goalId, version, values)),
  updateFormData: newData => dispatch(updateFormData(newData)),
  openFeedbackFlannel: event => dispatch(openFeedbackFlannel(event.target))
});

export default connect(mapStateToProps, mapDispatchToProps)(modalQuitEventHandler(GoalQuickEdit));
