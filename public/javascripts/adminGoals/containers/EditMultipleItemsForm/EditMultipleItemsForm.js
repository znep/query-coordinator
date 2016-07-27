import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import Select from 'react-select';
import Flyout from '../../components/Flyout';
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

class EditMultipleItemsForm extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'updateVisibility',
      'revertVisibility',
      'onUpdateClicked'
    ]);
  }

  updateVisibility({ value }) {
    this.props.updateFormData(this.props.formData.get('goal').set('is_public', value === 'public'));
  }

  revertVisibility() {
    const oldVisibility = this.props.commonData.get('is_public');
    this.props.updateFormData(this.props.formData.get('goal').set('is_public', oldVisibility));
  }

  onUpdateClicked() {
    this.props.updateGoals(this.props.goals, this.props.formData.get('goal').toJS());
  }

  isDataChanged() {
    const oldData = this.props.commonData.toJS();
    const newData = this.props.formData.get('goal').toJS();

    return helpers.isDifferent(oldData, newData);
  }

  isVisibilityChanged() {
    const oldData = this.props.commonData;
    const newData = this.props.formData.get('goal');

    return newData.has('is_public') && oldData.get('is_public') != newData.get('is_public');
  }

  visibilityRevertButton() {
    const { translations } = this.props;
    const tooltipText = translations.getIn(['admin', 'bulk_edit', 'revert_changes']);

    if (!this.isVisibilityChanged()) {
      return;
    }

    return (
      <Flyout text={ tooltipText } tooltip>
        <SocrataChangeIndicator onRevert={ this.revertVisibility }/>
      </Flyout>
    );
  }

  render() {
    const translations = this.props.translations.get('admin').toJS();

    const commonData = this.props.commonData;
    const formData = this.props.formData.get('goal');

    const visibility = formData.get('is_public', commonData.get('is_public'));

    const visibilityOptions = [
      { value: 'public', label: translations.goal_values.status_public },
      { value: 'private', label: translations.goal_values.status_private }
    ];

    const updateInProgress = this.props.formData.get('updateInProgress');

    const failureAlert = this.props.showFailureMessage ?
      <SocrataAlert type="error" message={ translations.bulk_edit.failure_message }/> : null;

    return (
      <SocrataModal.Modal>
        <SocrataModal.Header title={ translations.bulk_edit.title } onClose={ this.props.dismissModal }/>

        <SocrataModal.Content>
          { failureAlert }
          <div
            className="selected-rows-indicator">{ this.props.goals.count() } { translations.bulk_edit.items_selected }</div>
          <label className="block-label">{ translations.bulk_edit.visibility }</label>

          <div>
            <Select
              className="visibility-select"
              clearable={ false }
              searchable={ false }
              onChange={ this.updateVisibility }
              value={ visibility === null ? null : (visibility ? 'public' : 'private') }
              options={ visibilityOptions }/>
            { this.visibilityRevertButton() }
          </div>
          <div style={ { height: 100 } }/>
        </SocrataModal.Content>

        <SocrataModal.Footer>
          <SocrataButton small onClick={ this.props.dismissModal }>{ translations.bulk_edit.cancel }</SocrataButton>
          <SocrataButton small primary onClick={ this.onUpdateClicked } disabled={ !this.isDataChanged() } inProgress={ updateInProgress }>
            { translations.bulk_edit.update }
          </SocrataButton>
        </SocrataModal.Footer>
      </SocrataModal.Modal>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  formData: state.get('editMultipleItemsForm'),
  commonData: commonGoalDataSelector(state),
  goals: selectedGoalsSelector(state),
  showFailureMessage: state.getIn(['editMultipleItemsForm', 'showFailureMessage'])
});

const mapDispatchToProps = dispatch => ({
  updateFormData: (newData) => dispatch(updateMultipleItemsFormData(newData)),
  dismissModal: () => dispatch(closeEditMultipleItemsModal()),
  updateGoals: (goals, data) => dispatch(updateMultipleGoals(goals, data))
});

export default connect(mapStateToProps, mapDispatchToProps)(EditMultipleItemsForm);
