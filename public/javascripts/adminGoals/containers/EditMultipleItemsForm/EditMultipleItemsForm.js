import React from 'react';
import { connect } from 'react-redux';

import Select from 'react-select';
import SCAlert from '../../components/SCAlert';
import SCButton from '../../components/SCButton';
import SCChangeIndicator from '../../components/SCChangeIndicator';
import * as SCModal from '../../components/SCModal';

import {
  setMultipleItemsVisibility,
  revertMultipleItemsVisibility,
  closeEditMultipleItemsModal,
  updateMultipleGoals
} from '../../actions/bulkEditActions';

import selectedGoalsSelector from '../../selectors/selectedGoals';
import commonGoalDataSelector from '../../selectors/commonGoalData';

import './EditMultipleItemsForm.scss';

class EditMultipleItemsForm extends React.Component {
  constructor(props) {
    super(props);

    this.onVisibilityChanged = this.onVisibilityChanged.bind(this);
    this.onUpdateClicked = this.onUpdateClicked.bind(this);
  }

  onVisibilityChanged(value) {
    this.props.setVisibility(value.value === 'public');
  }

  onUpdateClicked() {
    this.props.updateGoals(this.props.goals, this.props.formData.get('goal').toJS());
  }

  render() {
    const translations = this.props.translations.get('admin').toJS();

    const commonData = this.props.commonData;
    const formData = this.props.formData.get('goal');

    const visibility = formData.get('is_public', commonData.get('is_public'));
    const visibilityChanged = formData.has('is_public') && commonData.get('is_public') != formData.get('is_public');

    const visibilityOptions = [
      { value: 'public', label: translations.goal_values.status_public },
      { value: 'private', label: translations.goal_values.status_private }
    ];

    const updateInProgress = this.props.formData.get('updateInProgress');

    const visibilityRevertButton =
      visibilityChanged ? <SCChangeIndicator onRevert={ this.props.revertVisibility } /> : null;

    const isUpdateDisabled = !visibilityChanged;

    const failureAlert = this.props.showFailureMessage ?
      <SCAlert type="error" message={ translations.bulk_edit.failure_message } /> : null;

    return (
      <SCModal.Modal>
        <SCModal.Header title={ translations.bulk_edit.title } onClose={ this.props.dismissModal } />

        <SCModal.Content>
          { failureAlert }
          <div className="selected-rows-indicator">{ this.props.rowsCount } { translations.bulk_edit.items_selected }</div>
          <label className="block-label">{ translations.bulk_edit.visibility }</label>

          <div>
            <Select
              className="visibilitySelect"
              clearable={ false }
              searchable={ false }
              onChange={ this.onVisibilityChanged }
              value={ visibility === null ? null : (visibility ? 'public' : 'private') }
              options={ visibilityOptions } />
            {visibilityRevertButton}
          </div>
          <div style={ { height: 100 } } />
        </SCModal.Content>

        <SCModal.Footer>
          <SCButton small onClick={ this.props.dismissModal }>{ translations.bulk_edit.cancel }</SCButton>
          <SCButton small primary onClick={ this.onUpdateClicked } disabled={ isUpdateDisabled } inProgress={ updateInProgress }>
            { translations.bulk_edit.update }
          </SCButton>
        </SCModal.Footer>
      </SCModal.Modal>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  rowsCount: state.getIn(['goalTableData', 'selectedRows']).count(),
  formData: state.get('editMultipleItemsForm'),
  commonData: commonGoalDataSelector(state),
  goals: selectedGoalsSelector(state),
  showFailureMessage: state.getIn(['editMultipleItemsForm', 'showFailureMessage'])
});

const mapDispatchToProps = (dispatch, props) => ({
  setVisibility: visibility => dispatch(setMultipleItemsVisibility(visibility)),
  revertVisibility: () => dispatch(revertMultipleItemsVisibility()),
  dismissModal: () => dispatch(closeEditMultipleItemsModal()),
  updateGoals: (goals, data) => dispatch(updateMultipleGoals(goals, data))
});

export default connect(mapStateToProps, mapDispatchToProps)(EditMultipleItemsForm);
