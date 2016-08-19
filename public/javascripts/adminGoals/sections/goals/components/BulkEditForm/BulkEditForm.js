import _ from 'lodash';
import moment from 'moment';

import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import * as Components from '../../../../components';
import * as Constants from '../../../../constants';

import * as State from '../../state';
import * as Selectors from '../../selectors';
import * as Actions from '../../actions';
import * as Helpers from '../../../../helpers';

import './BulkEditForm.scss';

class BulkEditForm extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'updateVisibility',
      'revertVisibility',
      'updateDateRangeTo',
      'updateDateRangeFrom',
      'revertDateRange',
      'updateOverride',
      'revertOverride',
      'updateGoals'
    ]);
  }

  updateFormData(pathArr, value) {
    const { goal } = this.props;
    const path = _.isArray(pathArr) ? pathArr : [pathArr];
    this.props.actions.setFormData(goal.setIn(path, value));
  }

  updateVisibility({ value }) {
    this.updateFormData('is_public', value === 'public');
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

  revertFields(...fields) {
    const { commonData, goal, actions } = this.props;

    const oldData = fields.reduce((data, field) => {
      const path = _.isArray(field) ? field : [field];
      return data.setIn(path, commonData.getIn(path));
    }, goal);

    actions.setFormData(oldData);
  }

  revertVisibility() {
    this.revertFields('is_public');
  }

  revertOverride() {
    this.revertFields(['prevailing_measure', 'metadata', 'progress_override']);
  }

  revertDateRange() {
    this.revertFields(['prevailing_measure', 'start'], ['prevailing_measure', 'end']);
  }

  updateGoals() {
    const { goals, goal, actions } = this.props;

    actions.saveGoals(goals, goal.toJS());
  }

  isFieldsChanged(...fields) {
    const { commonData, goal } = this.props;

    return _.some(fields, field => {
      const path = _.isArray(field) ? field : [field];
      return goal.hasIn(path) && commonData.getIn(path) != goal.getIn(path);
    });
  }

  isVisibilityChanged() {
    return this.isFieldsChanged('is_public');
  }

  isOverrideChanged() {
    return this.isFieldsChanged(['prevailing_measure', 'metadata', 'progress_override']);
  }

  isDateRangeChanged() {
    return this.isFieldsChanged(['prevailing_measure', 'start'], ['prevailing_measure', 'end']);
  }

  getVisibilityOptions() {
    const { translations } = this.props;
    const publicLabel = Helpers.translator(translations, 'admin.goal_values.status_public');
    const privateLabel = Helpers.translator(translations, 'admin.goal_values.status_private');

    return [
      { value: 'public', label: publicLabel },
      { value: 'private', label: privateLabel }
    ];
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

  renderVisibility() {
    const { translations, goal, commonData } = this.props;

    const visibility = goal.get('is_public', commonData.get('is_public'));
    const options = this.getVisibilityOptions();

    const label = Helpers.translator(translations, 'admin.bulk_edit.visibility');
    const value = visibility === null ? null : (visibility ? 'public' : 'private');

    return (
      <div className="form-line">
        <label className="block-label">{ label }</label>
        <div>
          <Components.Select
            className="form-select-small"
            clearable={ false }
            searchable={ false }
            onChange={ this.updateVisibility }
            value={ value }
            options={ options }/>
          { this.renderRevertButton(this.isVisibilityChanged(), this.revertVisibility) }
        </div>
      </div>
    );
  }

  renderOverride() {
    const { translations, commonData, goal } = this.props;
    const valuePath = ['prevailing_measure', 'metadata', 'progress_override'];

    const label = Helpers.translator(translations, 'admin.bulk_edit.override_label');
    const overrideValue = goal.getIn(valuePath, commonData.getIn(valuePath));

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

    const fromValue = goal.getIn(['prevailing_measure', 'start'], commonData.getIn(['prevailing_measure', 'start']));
    const toValue = goal.getIn(['prevailing_measure', 'end'], commonData.getIn(['prevailing_measure', 'end']));

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

  renderFooter() {
    const { form, translations, actions, unsavedChanges } = this.props;

    const isUpdateInProgress = form.get('updateInProgress');
    const isUpdateDisabled = !unsavedChanges;

    const updateLabel = Helpers.translator(translations, 'admin.bulk_edit.update');
    const cancelLabel = Helpers.translator(translations, 'admin.bulk_edit.cancel');

    return (
      <Components.Socrata.Modal.Footer>
        <Components.Socrata.Button small
                                   onClick={ actions.closeModal }>
          { cancelLabel }
        </Components.Socrata.Button>
        <Components.Socrata.Button small primary
                                   onClick={ this.updateGoals }
                                   disabled={ isUpdateDisabled }
                                   inProgress={ isUpdateInProgress }>
          { updateLabel }
        </Components.Socrata.Button>
      </Components.Socrata.Modal.Footer>
    );
  }

  renderSelectedRowsIndicator() {
    const { translations, goals } = this.props;
    const numberOfGoals = goals.count();
    const message = Helpers.translator(translations, 'admin.bulk_edit.items_selected', numberOfGoals);

    return <div className="selected-rows-indicator">{ message }</div>;
  }

  renderAlert() {
    const message = this.props.message;
    if (!message.get('visible')) {
      return;
    }

    return <Components.Socrata.Alert type={message.get('type')} message={ message.get('content') }/>;
  }

  render() {
    const { translations, handleNavigateAway } = this.props;
    const modalTitle = Helpers.translator(translations, 'admin.bulk_edit.title');

    return (
      <Components.Socrata.Modal.Modal>
        <Components.Socrata.Modal.Header title={ modalTitle } onClose={ handleNavigateAway }/>

        <Components.Socrata.Modal.Content className="bulk-edit-modal-content">
          { this.renderAlert() }
          { this.renderSelectedRowsIndicator() }
          { this.renderVisibility() }
          { this.renderDateRange() }
          { this.renderOverride() }
        </Components.Socrata.Modal.Content>

        { this.renderFooter() }
      </Components.Socrata.Modal.Modal>
    );
  }
}

const mapStateToProps = state => {
  const bulkEdit = State.getBulkEdit(state);
  const commonData = Selectors.getCommonData(state);
  const goal = bulkEdit.get('goal');

  return {
    translations: state.get('translations'),
    form: bulkEdit,
    goal: bulkEdit.get('goal'),
    commonData: commonData,
    goals: Selectors.getSelectedGoals(state),
    message: bulkEdit.get('message'),
    unsavedChanges: Helpers.isDifferent(commonData.toJS(), goal.toJS())
  };
};

const mapDispatchToProps = dispatch => ({
  actions: Redux.bindActionCreators(Actions.BulkEdit, dispatch),
  dismissModal: () => dispatch(Actions.BulkEdit.closeModal())
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Components.ModalQuitEventHandler(BulkEditForm));
