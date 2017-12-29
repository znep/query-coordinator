import _ from 'lodash';
import moment from 'moment';
import * as Immutable from 'immutable';
import { FeatureFlags } from 'common/feature_flags';

import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';

import { Button } from 'common/components';

import * as Components from '../../../../components';
import * as Constants from '../../../../constants';

import * as State from '../../state';
import * as Selectors from '../../selectors';
import * as GoalsActions from '../../actions';
import * as Actions from '../../../../actions';
import * as Helpers from '../../../../helpers';

import GoalEditLink from '../GoalEditLink';
import BulkEditSaveProgress from './BulkEditSaveProgress';

import './BulkEditForm.scss';

class BulkEditForm extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'setPublishingAction',
      'unsetPublishingAction',
      'updateDateRangeTo',
      'updateDateRangeFrom',
      'revertDateRange',
      'updateOverride',
      'revertOverride',
      'updateGoals'
    ]);
  }

  updateFormData(pathArr, value) {
    this.props.bulkEditActions.setFormData(pathArr, value);
  }

  setPublishingAction({ value }) {
    this.props.bulkEditActions.setPublishingAction(value);
  }

  updateDateRangeTo(value) {
    this.updateFormData(['prevailing_measure', 'end'], value.format(Constants.datetimeFormat));
  }

  updateDateRangeFrom(value) {
    this.updateFormData(['prevailing_measure', 'start'], value.format(Constants.datetimeFormat));
  }

  updateOverride({ value }) {
    this.updateFormData(['prevailing_measure', 'metadata', 'progress_override'], value);
  }

  revertFields(...paths) {
    const { commonData, bulkEditActions } = this.props;

    _.each(paths, (path) => {
      bulkEditActions.setFormData(path, _.get(commonData, path));
    });

  }

  unsetPublishingAction() {
    this.props.bulkEditActions.setPublishingAction(null);
  }

  revertOverride() {
    this.revertFields(['prevailing_measure', 'metadata', 'progress_override']);
  }

  revertDateRange() {
    this.revertFields(['prevailing_measure', 'start'], ['prevailing_measure', 'end']);
  }

  updateGoals() {
    const { selectedGoals, goal, notificationActions, bulkEditActions, translations } = this.props;

    bulkEditActions.saveGoals(selectedGoals, goal).then((success) => {
      if (success) {
        bulkEditActions.closeModal();
        notificationActions.showNotification(
          'success',
          Helpers.translator(translations, 'admin.bulk_edit.success_message', selectedGoals.length)
        );
      }
    });
  }

  isFieldsChanged(...paths) {
    const { commonData, goal } = this.props;

    return _.some(paths, (path) =>
      _.has(goal, path) && _.get(commonData, path) != _.get(goal, path)
    );
  }

  hasPublishingActionSet() {
    return _.isString(this.props.publishingAction);
  }

  isOverrideChanged() {
    return this.isFieldsChanged(['prevailing_measure', 'metadata', 'progress_override']);
  }

  isDateRangeChanged() {
    return this.isFieldsChanged(['prevailing_measure', 'start'], ['prevailing_measure', 'end']);
  }

  getPublishingActionOptions() {
    const { translations, publishDisabledBecauseMissingDrafts, goalSelectionCount, usingStorytellerEditor}
      = this.props;
    const storytellerPublishLabel = Helpers.translator(translations, 'admin.bulk_edit.publish_latest_draft');
    const classicPublishLabel = Helpers.translator(translations, 'admin.bulk_edit.make_public');
    const privateLabel = Helpers.translator(translations, 'admin.bulk_edit.make_private');
    const hasPrivateGoals = goalSelectionCount['status_private'] > 0;
    const hasPublicGoalsWithDraft = goalSelectionCount['status_public_with_draft'] > 0;
    const hasPublicGoals =
      goalSelectionCount['status_public'] > 0 ||
      hasPublicGoalsWithDraft;

    const classicEditorPublishOption = { value: 'make_public_classic_editor', label: classicPublishLabel };
    const storytellerPublishOption = { value: 'publish_latest_draft', label: storytellerPublishLabel };
    const publishOption = usingStorytellerEditor ? storytellerPublishOption : classicEditorPublishOption;

    const privateOption = { value: 'make_private', label: privateLabel };

    if (publishDisabledBecauseMissingDrafts) {
      return hasPublicGoals ? [ privateOption ] : [];
    } else {
      if (hasPrivateGoals && hasPublicGoals || hasPublicGoalsWithDraft) {
        return [ publishOption, privateOption ];
      } else if (hasPublicGoals) {
        return [ privateOption ];
      } else {
        return [ publishOption ];
      }
    }
  }

  getOverrideOptions() {
    const { translations } = this.props;
    const translationBase = 'measure.progress';

    return [
      { value: 'bad', label: Helpers.translator(translations, `${translationBase}.bad`) },
      { value: '', label: Helpers.translator(translations, `${translationBase}.none`) },
      { value: 'good', label: Helpers.translator(translations, `${translationBase}.good`) },
      { value: 'no_judgement', label: Helpers.translator(translations, `${translationBase}.no_judgement`) },
      { value: 'within_tolerance', label: Helpers.translator(translations, `${translationBase}.within_tolerance`) }
    ];
  }

  renderRevertButton(isValueChanged, onRevert) {
    const { translations } = this.props;
    const tooltipText = Helpers.translator(translations, 'admin.bulk_edit.revert_changes');

    if (!isValueChanged) {
      return;
    }

    return (
      <Components.Socrata.Flyout text={ tooltipText }>
        <Components.Socrata.ChangeIndicator onRevert={ onRevert }/>
      </Components.Socrata.Flyout>
    );
  }

  renderGoalEditLinks(goals, linkText) {
    return (
      <table className="edit-goal-list"><tbody>
        {
          goals.map((goal) => (
            <tr key={ goal.id }>
              <td>{ goal.name }</td>
              <td className="edit-link">
                <GoalEditLink
                  goal= { Immutable.fromJS(goal) }
                  text= { linkText } />
              </td>
            </tr>
          ))
        }
      </tbody></table>
    );
  }

  renderPublicationNotice() {
    const {
      translations,
      publishDisabledBecauseMissingDrafts,
      draftlessSelectedGoals
    } = this.props;

    if (publishDisabledBecauseMissingDrafts) {
      const failureMessage = translations.getIn(['admin', 'bulk_edit', 'cannot_publish_drafts_not_present']);
      return (
        <div className="drafts-missing-notice">
          <Components.Socrata.Alert type='error' message={ failureMessage } />
          {
            this.renderGoalEditLinks(
              draftlessSelectedGoals,
              translations.getIn(['admin', 'bulk_edit', 'upgrade'])
            )
          }
        </div>
      );
    } else {
      return null;
    }
  }

  renderPublishingAction() {
    const { translations, publishingAction } = this.props;
    const options = this.getPublishingActionOptions();
    const label = Helpers.translator(translations, 'admin.bulk_edit.publishing_action');
    const selector = <Components.Select
      className="form-select-medium publishing-action-select"
      clearable={ false }
      searchable={ false }
      onChange={ this.setPublishingAction }
      value={ publishingAction }
      options={ options }/>;

    return (
      <div className="form-line">
        <label className="block-label">{ label }</label>
        <div>
          { options.length > 0 ? selector : null }
          { this.renderRevertButton(this.hasPublishingActionSet(), this.unsetPublishingAction) }
        </div>
        { this.renderPublicationNotice() }
      </div>
    );
  }

  renderOverride() {
    const { translations, commonData, goal } = this.props;
    const valuePath = ['prevailing_measure', 'metadata', 'progress_override'];

    const label = Helpers.translator(translations, 'admin.bulk_edit.override_label');
    const overrideValue = _.get(goal, valuePath, _.get(commonData, valuePath));

    const options = this.getOverrideOptions();

    return (
      <div className="form-line">
        <label className="block-label">{ label }</label>
        <div>
          <Components.Select
            className="form-select-medium"
            clearable={ false }
            searchable={ false }
            onChange={ this.updateOverride }
            value={ overrideValue }
            options={ options }/>
          { this.renderRevertButton(this.isOverrideChanged(), this.revertOverride) }
        </div>
      </div>
    );
  }

  renderDateRange() {
    const { translations, commonData, goal } = this.props;

    const label = Helpers.translator(translations, 'admin.bulk_edit.date_range_label');
    const toPlaceholder = Helpers.translator(translations, 'admin.bulk_edit.date_range_to');
    const fromPlaceholder = Helpers.translator(translations, 'admin.bulk_edit.date_range_from');

    const prevailingMeasure = goal.prevailing_measure || {};
    const fromValue = prevailingMeasure.start || commonData.prevailing_measure.start;
    const toValue = prevailingMeasure.end || commonData.prevailing_measure.end;

    return (
      <div className="form-row measure-date-range">
        <label className="inline-label"> { label } </label>
        <div className="form-line">
          <Components.Socrata.DatePicker
            placeholderText={ fromPlaceholder }
            selected={ fromValue && moment(fromValue) }
            onChange={ this.updateDateRangeFrom }/>
          <Components.Socrata.DatePicker
            placeholderText={ toPlaceholder }
            selected={ toValue && moment(toValue) }
            onChange={ this.updateDateRangeTo }/>
          { this.renderRevertButton(this.isDateRangeChanged(), this.revertDateRange) }
        </div>
      </div>
    );
  }

  renderCancelAndUpdateFooter() {
    const { saveStatus, translations, bulkEditActions, unsavedChanges, areAllSelectedGoalsConfigured } = this.props;

    const saveInProgress = saveStatus.inProgress;
    const isUpdateDisabled = !areAllSelectedGoalsConfigured || !unsavedChanges;

    const updateLabel = Helpers.translator(translations, 'admin.bulk_edit.update');
    const cancelLabel = Helpers.translator(translations, 'admin.bulk_edit.cancel');

    return (
      <Components.Socrata.Modal.Footer>
        <Button
          size="sm"
          onClick={ bulkEditActions.closeModal }
          disabled={ saveInProgress }>
          { cancelLabel }
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={ this.updateGoals }
          disabled={ isUpdateDisabled }
          inProgress={ saveInProgress }>
          { updateLabel }
        </Button>
      </Components.Socrata.Modal.Footer>
    );
  }

  renderSelectedRowsIndicator() {
    const { translations, goalSelectionCount } = this.props;
    const numberOfGoals = _(goalSelectionCount).values().sum();

    const counts = _.map(goalSelectionCount, (count, goalPublicationStatus) =>
      `${count} ${translations.getIn(['admin', 'goal_values', goalPublicationStatus])}`
    );
    const message = Helpers.translator(translations, 'admin.bulk_edit.items_selected', numberOfGoals, counts.join(', '));
    return (
      <div className="selected-rows-indicator">
        { message }
      </div>
    );
  }

  renderSaveError() {
    const { translations, saveStatus, selectedGoals } = this.props;
    let failedGoals = saveStatus.failedGoals;
    if (_.isEmpty(failedGoals)) {
      // This function is only called if there is a save error. It is possible
      // that we failed very early in the process (probably due to a TypeError
      // or similar bug). In this case, it is possible that we haven't gotten
      // around to updating the list of errored goals. So, assume every goal
      // failed.
      failedGoals = selectedGoals;
    }

    const failureMessage = Helpers.translator(translations, 'admin.bulk_edit.failure_message');
    const successCount = saveStatus.taskCompletedCount - failedGoals.length;

    return (
      <div>
        <Components.Socrata.Alert type='error' message={ failureMessage } />
        <h6>
          { Helpers.translator(translations, 'admin.bulk_edit.success_goal_count', successCount) }
        </h6>
        <h6>
          { Helpers.translator(translations, 'admin.bulk_edit.failed_goal_count', failedGoals.length) }
        </h6>
        {
          this.renderGoalEditLinks(
            failedGoals,
            translations.getIn(['admin', 'bulk_edit', 'configure'])
          )
        }
      </div>
    );
  }

  renderCloseButtonOnlyFooter() {
    const { translations, dismissModal } = this.props;
    const closeLabel = Helpers.translator(translations, 'admin.bulk_edit.close');
    return (
      <Components.Socrata.Modal.Footer>
        <Button small onClick={ dismissModal }>
          { closeLabel }
        </Button>
      </Components.Socrata.Modal.Footer>
    );
  }

  renderUnconfiguredGoalWarning() {
    const { translations, unconfiguredSelectedGoals } = this.props;
    const message = Helpers.translator(translations, 'admin.bulk_edit.not_configured_message');
    return (
      <div className="unconfigured-goal-warning">
        <Components.Socrata.Alert type='error' message={ message } />
        {
          this.renderGoalEditLinks(
            unconfiguredSelectedGoals,
            translations.getIn(['admin', 'bulk_edit', 'configure'])
          )
        }
      </div>
    );
  }

  renderModalHeader(onClose) {
    const { translations } = this.props;
    const modalTitle = Helpers.translator(translations, 'admin.bulk_edit.title');
    return (<Components.Socrata.Modal.Header title={ modalTitle } onClose={ onClose }/>);
  }

  renderModalContent(...children) {
    return (
      <Components.Socrata.Modal.Content className="bulk-edit-modal-content" children={ children } />
    );
  }

  renderEditor() {
    const { saveStatus, areAllSelectedGoalsConfigured, dismissModal, handleNavigateAway } = this.props;
    const headerWithNoCloseButton = this.renderModalHeader();
    const headerWithCloseConfirmationButton = this.renderModalHeader(handleNavigateAway);
    const headerWithCloseImmediatelyButton = this.renderModalHeader(dismissModal);

    if (!areAllSelectedGoalsConfigured) {
      return [
        headerWithCloseImmediatelyButton,
        this.renderModalContent(
          this.renderUnconfiguredGoalWarning()
        ),
        this.renderCloseButtonOnlyFooter()
      ];
    } else if (saveStatus.error) {
      return [
        headerWithCloseImmediatelyButton,
        this.renderModalContent(
          this.renderSaveError()
        ),
        this.renderCloseButtonOnlyFooter()
      ];
    } else if (saveStatus.inProgress) {
      return [
        headerWithNoCloseButton,
        this.renderModalContent(
          <BulkEditSaveProgress />
        )
      ];
    } else {
      return [
        this.renderModalContent(
          headerWithCloseConfirmationButton,
          this.renderSelectedRowsIndicator(),
          this.renderPublishingAction(),
          this.renderDateRange(),
          this.renderOverride()
        ),
        this.renderCancelAndUpdateFooter()
      ];
    }
  }

  render() {
    return (<Components.Socrata.Modal.Modal className="bulk-edit-modal" children={ this.renderEditor() }/>);
  }
}

const mapStateToProps = state => {
  // Ideally, only plain JS objects will be sent to the component.
  // ImmutableJS is nice for the store, but it makes working in the
  // component unnecessarily arduous.
  const usingStorytellerEditor = FeatureFlags.value('open_performance_narrative_editor') === 'storyteller';
  const areAllSelectedGoalsPublishable = Selectors.areAllSelectedGoalsPublishable(state);
  const publishDisabledBecauseMissingDrafts = usingStorytellerEditor && !areAllSelectedGoalsPublishable;
  const selectedGoals = Selectors.getSelectedGoals(state).toJS();
  const commonData = Selectors.getCommonData(state).toJS();

  const {
    goal,
    publishingAction,
    saveStatus
  } = State.getBulkEdit(state).toJS();

  const goalSelectionCount = _.countBy(
    selectedGoals,
    (row) => Selectors.getGoalPublicationStatus(state, row.id)
  );

  const unsavedChanges =
    Helpers.isDifferent(commonData, goal) ||
    _.isString(publishingAction);

  return {
    goal,
    publishingAction,
    selectedGoals,
    goalSelectionCount,
    publishDisabledBecauseMissingDrafts,
    unsavedChanges,
    commonData,
    saveStatus,
    usingStorytellerEditor,
    translations: state.get('translations'),
    areAllSelectedGoalsConfigured: Selectors.areAllSelectedGoalsConfigured(state),
    draftlessSelectedGoals: Selectors.getDraftlessSelectedGoals(state).toJS(),
    unconfiguredSelectedGoals: Selectors.getUnconfiguredSelectedGoals(state).toJS()
  };
};

const mapDispatchToProps = dispatch => ({
  bulkEditActions: Redux.bindActionCreators(GoalsActions.BulkEdit, dispatch),
  notificationActions: Redux.bindActionCreators(Actions.notifications, dispatch),
  dismissModal: () => dispatch(GoalsActions.BulkEdit.closeModal())
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Components.ModalQuitEventHandler(BulkEditForm)); // eslint-disable-line new-cap
