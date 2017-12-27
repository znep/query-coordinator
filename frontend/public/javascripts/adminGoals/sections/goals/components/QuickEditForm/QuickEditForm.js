import _ from 'lodash';
import $ from 'jquery';
import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux  from 'react-redux';
import * as Immutable from 'immutable';

import { Button } from 'common/components';

import * as GoalsActions from '../../actions';
import * as Actions from '../../../../actions';
import * as Helpers from '../../../../helpers';
import * as State from '../../state';
import * as Selectors from '../../selectors';
import * as Components from '../../../../components';
import * as Constants from '../../../../constants';

import GoalEditLink from '../GoalEditLink';
import EditGeneral from './EditGeneral';
import EditPrevailingMeasure from './EditPrevailingMeasure';
import GoalDetails from './GoalDetails';

import './QuickEditForm.scss';

class QuickEditForm extends React.Component {
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
    const maintainTypes = {
      'above': '>',
      'below': '<',
      'within': 'within'
    };

    const measure = goal.get('prevailing_measure', Immutable.Map.of());
    const measureMetadata = measure.get('metadata', Immutable.Map.of());

    const initialFormData = new Immutable.Map({
      visibility: goal.get('is_public') ? 'public' : 'private',
      name: goal.get('name'),
      actionType: measureMetadata.getIn(['edit', 'action_type']),
      prevailingMeasureName: measureMetadata.get('name'),
      prevailingMeasureProgressOverride: measureMetadata.get('use_progress_override') ?
        measureMetadata.get('progress_override') : 'none',
      unit: measure.get('unit'),
      percentUnit: measure.get('target_delta_is_percent') ? '%' : measure.get('unit'),
      startDate: measure.get('start', null),
      endDate: measure.get('end', null),
      measureTarget: measure.get('target'),
      measureTargetType: measure.get('target_type'),
      measureBaseline: measure.get('baseline'),
      measureTargetDelta: measure.get('target_delta'),
      measureMaintainType: maintainTypes[measureMetadata.getIn(['edit', 'maintain_type'], 'within')]
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
    if (!_.isNil(selected)) {
      data[name] = _.isFunction(selected.format) ? selected.format(Constants.datetimeFormat) : selected.value;

      const newData = this.props.formData.merge(data);
      this.props.updateFormData(newData);
    }
  }

  /**
   * Saves form data to API.
   * Only exists because of we need stop form submit default action.
   * @param event
   */
  save(event) {
    const { translations, notificationActions, saveGoal, dismissModal, goal } = this.props;
    const goalName = goal.get('name');

    event.preventDefault();
    saveGoal().then((success) => {
      if (success) {
        dismissModal();
        notificationActions.showNotification(
          'success',
          Helpers.translator(translations, 'admin.quick_edit.success_message', goalName)
        );
      }
    });
  }

  renderSaveError() {
    let { translations, saveError } = this.props;

    if (!saveError) {
      return null;
    }

    let failureMessage;
    // Parse message, sometimes it's JSON.
    try {
      saveError = JSON.parse(saveError);
    } catch (x) {} //eslint-disable-line no-empty

    if (saveError.validationError) {
      failureMessage = _.map(saveError.errors,
        err => Helpers.translator(translations, `admin.quick_edit.validation.${err.field}.${err.rule}`));
    } else {
      failureMessage = Helpers.translator(translations, 'admin.quick_edit.default_alert_message');
    }

    return <Components.Socrata.Alert type='error' message={ failureMessage }/>;
  }

  render() {
    const { translations, goal, isGoalNotConfigured, saveInProgress } = this.props;

    const goalName = goal.get('name');
    const goalTitle = `${ translations.getIn(['admin', 'quick_edit', 'quick_edit_measure']) } - ${goalName}`;

    // Warning message for not configured goals.
    const notConfiguredGoalMessage = (
      <div className="unconfigured-goal-warning-message">
        <span>{ translations.getIn(['admin', 'quick_edit', 'not_configured_goal_message', 'text']) }</span>
        &nbsp;
        <GoalEditLink
          goal= { goal }
          text= { translations.getIn(['admin', 'quick_edit', 'not_configured_goal_message', 'link']) } />
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
          </Components.Socrata.Modal.Header>
          <Components.Socrata.Modal.Content>
            { this.renderSaveError() }

            <div className="goal-quick-edit-form">
              <EditGeneral {...subComponentProps} />
              { notConfiguredGoalAlert }
              <EditPrevailingMeasure {...subComponentProps} />
            </div>
            <GoalDetails goal={ goal }/>
          </Components.Socrata.Modal.Content>
          <Components.Socrata.Modal.Footer>
            <div className="link-container">
              <GoalEditLink
                goal= { goal }
                text= { translations.getIn(['admin', 'quick_edit', 'manage_on_goal_page']) }
              />
            </div>
            <Button onClick={ this.props.dismissModal } disabled={ saveInProgress } >
              { translations.getIn(['admin', 'quick_edit', 'cancel']) }
            </Button>
            <Button type="submit" variant="primary"
              onClick={ this.save }
              disabled={ !this.props.unsavedChanges || saveInProgress }
              busy={ saveInProgress }>
              { translations.getIn(['admin', 'quick_edit', 'save']) }
            </Button>
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
    formData: formData,
    goal: goal,
    isGoalNotConfigured: isGoalNotConfigured,
    saveError: quickEdit.get('saveError'),
    saveInProgress: quickEdit.get('saveInProgress'),
    translations: state.get('translations'),
    unsavedChanges: unsavedChanges
  };
};

const mapDispatchToProps = dispatch => ({
  dismissModal: () => dispatch(GoalsActions.QuickEdit.closeModal()),
  saveGoal: () => dispatch(GoalsActions.QuickEdit.save()),
  updateFormData: newData => dispatch(GoalsActions.QuickEdit.updateFormData(newData)),
  notificationActions: Redux.bindActionCreators(Actions.notifications, dispatch)
});

export const QuickEditFormComponent = QuickEditForm; // Unconnected.
export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Components.ModalQuitEventHandler(QuickEditFormComponent)); // eslint-disable-line new-cap
