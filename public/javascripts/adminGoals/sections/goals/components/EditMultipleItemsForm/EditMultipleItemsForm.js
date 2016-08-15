import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import _ from 'lodash';
import moment from 'moment';

import * as Selectors from '../../selectors';
import * as State from '../../state';
import * as Actions from '../../actions';
import * as helpers from '../../../../helpers';

import Select from 'react-select';
import Flyout from '../../../../components/Flyout';
import SocrataDatePicker from '../../../../components/SocrataDatePicker';
import SocrataAlert from '../../../../components/SocrataAlert';
import SocrataButton from '../../../../components/SocrataButton';
import SocrataChangeIndicator from '../../../../components/SocrataChangeIndicator';
import * as SocrataModal from '../../../../components/SocrataModal';

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
    this.updateFormData(['prevailing_measure', 'end'], value.toISOString().replace('Z', ''));
  }

  updateDateRangeFrom(value) {
    this.updateFormData(['prevailing_measure', 'start'], value.toISOString().replace('Z', ''));
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
    const { actions, goals, goal } = this.props;

    actions.updateMultipleGoals(goals, goal.toJS());
  }

  isDataChanged() {
    const { commonData, goal } = this.props;

    const oldData = commonData.toJS();
    const newData = goal.toJS();

    return helpers.isDifferent(oldData, newData);
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
    const publicLabel = helpers.translator(translations, 'admin.goal_values.status_public');
    const privateLabel = helpers.translator(translations, 'admin.goal_values.status_private');

    return [
      { value: 'public', label: publicLabel },
      { value: 'private', label: privateLabel }
    ];
  }

  getOverrideOptions() {
    const { translations } = this.props;
    const translationBase = 'measure.progress';

    return [
      { value: 'bad', label: helpers.translator(translations, `${translationBase}.bad`) },
      { value: '', label: helpers.translator(translations, `${translationBase}.none`) },
      { value: 'good', label: helpers.translator(translations, `${translationBase}.good`) },
      { value: 'no_judgement', label: helpers.translator(translations, `${translationBase}.no_judgement`) },
      { value: 'within_tolerance', label: helpers.translator(translations, `${translationBase}.within_tolerance`) }
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

    const label = helpers.translator(translations, 'admin.bulk_edit.override_label');
    const overrideValue = goal.getIn(valuePath, commonData.getIn(valuePath));

    const options = this.getOverrideOptions();

    return (
      <div className="form-line">
        <label className="block-label">{ label }</label>
        <div>
          <Select
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

    const label = helpers.translator(translations, 'admin.bulk_edit.date_range_label');
    const toPlaceholder = helpers.translator(translations, 'admin.bulk_edit.date_range_to');
    const fromPlaceholder = helpers.translator(translations, 'admin.bulk_edit.date_range_from');

    const fromValue = goal.getIn(['prevailing_measure', 'start'], commonData.getIn(['prevailing_measure', 'start']));
    const toValue = goal.getIn(['prevailing_measure', 'end'], commonData.getIn(['prevailing_measure', 'end']));

    return (
      <div className="form-row measure-date-range">
        <label className="inline-label"> { label } </label>
        <div className="form-line">
          <SocrataDatePicker
            placeholderText={ toPlaceholder }
            selected={ toValue && moment.utc(toValue) }
            onChange={ this.updateDateRangeTo }/>
          <SocrataDatePicker
            placeholderText={ fromPlaceholder }
            selected={ fromValue && moment.utc(fromValue) }
            onChange={ this.updateDateRangeFrom }/>
          { this.renderRevertButton(this.isDateRangeChanged(), this.revertDateRange) }
        </div>
      </div>
    );
  }

  renderFooter() {
    const { form, translations, actions } = this.props;

    const isUpdateInProgress = form.get('saveInProgress');
    const isUpdateDisabled = !this.isDataChanged();

    const updateLabel = helpers.translator(translations, 'admin.bulk_edit.update');
    const cancelLabel = helpers.translator(translations, 'admin.bulk_edit.cancel');

    return (
      <SocrataModal.Footer>
        <SocrataButton small
                       onClick={ actions.closeModal }>
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
    const message = this.props.message;
    if (!message.get('visible')) {
      return;
    }

    return <SocrataAlert type={message.get('type')} message={ message.get('content') }/>;
  }

  render() {
    const { translations } = this.props;
    const modalTitle = helpers.translator(translations, 'admin.bulk_edit.title');

    return (
      <SocrataModal.Modal>
        <SocrataModal.Header title={ modalTitle } onClose={ this.props.actions.closeModal }/>

        <SocrataModal.Content className="bulk-edit-modal-content">
          { this.renderFailureAlert() }
          { this.renderSelectedRowsIndicator() }
          { this.renderVisibility() }
          { this.renderDateRange() }
          { this.renderOverride() }
        </SocrataModal.Content>

        { this.renderFooter() }
      </SocrataModal.Modal>
    );
  }
}

const mapStateToProps = state => {
  const bulkEdit = State.getBulkEdit(state);

  return {
    translations: state.get('translations'),
    form: bulkEdit,
    goal: bulkEdit.get('goal'),
    commonData: Selectors.getCommonData(state),
    goals: Selectors.getSelectedGoals(state),
    message: bulkEdit.get('message')
  };
};

const mapDispatchToProps = dispatch => ({
  actions: Redux.bindActionCreators(Actions.BulkEdit, dispatch)
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(EditMultipleItemsForm);
