import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import Select from 'react-select';
import Flyout from '../../components/Flyout';
import SocrataDatePicker from '../../components/SocrataDatePicker';
import SocrataAlert from '../../components/SocrataAlert';
import SocrataButton from '../../components/SocrataButton';
import SocrataChangeIndicator from '../../components/SocrataChangeIndicator';
import * as SocrataModal from '../../components/SocrataModal';
import helpers from '../../helpers/helpers';

import {
  updateMultipleItemsFormData,
  closeEditMultipleItemsModal,
  updateMultipleGoals
} from '../../actions/bulkEditActions';

import selectedGoalsSelector from '../../selectors/selectedGoals';
import commonGoalDataSelector from '../../selectors/commonGoalData';

import './EditMultipleItemsForm.scss';
import 'react-datepicker/dist/react-datepicker.css';

class EditMultipleItemsForm extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'updateVisibility',
      'revertVisibility',
      'updateDateRangeTo',
      'updateDateRangeFrom',
      'revertDateRange',
      'updateGoals'
    ]);
  }

  updateFormData(field, value) {
    const { goal, updateFormData } = this.props;
    updateFormData(goal.set(field, value));
  }

  updateVisibility({ value }) {
    this.updateFormData('is_public', value === 'public');
  }

  updateDateRangeTo(value) {
    this.updateFormData('date_to', value);
  }

  updateDateRangeFrom(value) {
    this.updateFormData('date_from', value);
  }

  revertFields(...fields) {
    const { commonData, goal, updateFormData } = this.props;

    const oldData = fields.reduce((data, field) => data.set(field, commonData.get(field)), goal);
    updateFormData(oldData);
  }

  revertVisibility() {
    this.revertFields('is_public');
  }

  revertDateRange() {
    this.revertFields('date_from', 'date_to');
  }

  updateGoals() {
    const { updateGoals, goals, goal } = this.props;

    updateGoals(goals, goal.toJS());
  }

  isDataChanged() {
    const { commonData, goal } = this.props;

    const oldData = commonData.toJS();
    const newData = goal.toJS();

    return helpers.isDifferent(oldData, newData);
  }

  isFieldsChanged(...fields) {
    const { commonData, goal } = this.props;

    return _.some(fields, (field) => {
      return goal.has(field) && commonData.get(field) != goal.get(field);
    });
  }

  isVisibilityChanged() {
    return this.isFieldsChanged('is_public');
  }

  isDateRangeChanged() {
    return this.isFieldsChanged('date_from', 'date_to');
  }

  getVisibilityOptions() {
    const { translations } = this.props;
    const publicLabel = helpers.translator(translations, 'admin.goal_values.status_public');
    const privateLabel = helpers.translator(translations, 'admin.goal_values.status_private');

    return [
      { value: 'public', label: publicLabel },
      { value: 'private', label: privateLabel }
    ];
  }

  renderRevertButton(isValueChanged, onRevert) {
    const { translations } = this.props;
    const tooltipText = helpers.translator(translations, 'admin.bulk_edit.revert_changes');

    if (!isValueChanged) {
      return;
    }

    return (
      <Flyout text={ tooltipText } tooltip>
        <SocrataChangeIndicator onRevert={ onRevert }/>
      </Flyout>
    );
  }

  renderVisibility() {
    const { translations, goal, commonData } = this.props;

    const visibility = goal.get('is_public', commonData.get('is_public'));
    const options = this.getVisibilityOptions();

    const label = helpers.translator(translations, 'admin.bulk_edit.visibility');
    const value = visibility === null ? null : (visibility ? 'public' : 'private');

    return (
      <div className="form-line">
        <label className="block-label">{ label }</label>
        <div>
          <Select
            className="visibility-select"
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

  renderDateRange() {
    const { translations, commonData, goal } = this.props;

    const label = helpers.translator(translations, 'admin.bulk_edit.date_range_label');
    const toPlaceholder = helpers.translator(translations, 'admin.bulk_edit.date_range_to');
    const fromPlaceholder = helpers.translator(translations, 'admin.bulk_edit.date_range_from');

    const fromValue = goal.get('date_from', commonData.get('date_from'));
    const toValue = goal.get('date_to', commonData.get('date_to'));

    return (
      <div className="form-row measure-date-range">
        <label className="inline-label"> { label } </label>
        <div className="form-line">
          <SocrataDatePicker
            placeholderText={ toPlaceholder }
            selected={ toValue }
            onChange={ this.updateDateRangeTo }/>
          <SocrataDatePicker
            placeholderText={ fromPlaceholder }
            selected={ fromValue }
            onChange={ this.updateDateRangeFrom }/>
          { this.renderRevertButton(this.isDateRangeChanged(), this.revertDateRange) }
        </div>
      </div>
    );
  }

  renderFooter() {
    const { form, translations, dismissModal } = this.props;

    const isUpdateInProgress = form.get('updateInProgress');
    const isUpdateDisabled = !this.isDataChanged();

    const updateLabel = helpers.translator(translations, 'admin.bulk_edit.update');
    const cancelLabel = helpers.translator(translations, 'admin.bulk_edit.cancel');

    return (
      <SocrataModal.Footer>
        <SocrataButton small
                       onClick={ dismissModal }>
          { cancelLabel }
        </SocrataButton>
        <SocrataButton small primary
                       onClick={ this.updateGoals }
                       disabled={ isUpdateDisabled }
                       inProgress={ isUpdateInProgress }>
          { updateLabel }
        </SocrataButton>
      </SocrataModal.Footer>
    );
  }

  renderSelectedRowsIndicator() {
    const { translations, goals } = this.props;
    const numberOfGoals = goals.count();
    const message = helpers.translator(translations, 'admin.bulk_edit.items_selected', numberOfGoals);

    return <div className="selected-rows-indicator">{ message }</div>;
  }

  renderFailureAlert() {
    if (!this.props.showFailureMessage) {
      return;
    }

    const { translations } = this.props;
    const message = helpers.translator(translations, 'admin.bulk_edit.failure_message');

    return <SocrataAlert type="error" message={ message }/>;
  }

  render() {
    const { translations } = this.props;
    const modalTitle = helpers.translator(translations, 'admin.bulk_edit.title');

    return (
      <SocrataModal.Modal>
        <SocrataModal.Header title={ modalTitle } onClose={ this.props.dismissModal }/>

        <SocrataModal.Content>
          { this.renderFailureAlert() }
          { this.renderSelectedRowsIndicator() }

          { this.renderVisibility() }
          { this.renderDateRange() }

          <div style={ { height: 100 } }/>
        </SocrataModal.Content>

        { this.renderFooter() }
      </SocrataModal.Modal>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  form: state.get('editMultipleItemsForm'),
  goal: state.getIn(['editMultipleItemsForm', 'goal']),
  commonData: commonGoalDataSelector(state),
  goals: selectedGoalsSelector(state),
  showFailureMessage: state.getIn(['editMultipleItemsForm', 'showFailureMessage'])
});

const mapDispatchToProps = (dispatch, props) => ({
  updateFormData: (newData) => dispatch(updateMultipleItemsFormData(newData)),
  dismissModal: () => dispatch(closeEditMultipleItemsModal()),
  updateGoals: (goals, data) => dispatch(updateMultipleGoals(goals, data))
});

export default connect(mapStateToProps, mapDispatchToProps)(EditMultipleItemsForm);
