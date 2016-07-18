import React from 'react';
import { connect } from 'react-redux';
import selectedGoals from '../../selectors/selectedGoals';
import commonGoalDataSelector from '../../selectors/commonGoalData';
import {
  setMultipleItemsVisibility,
  revertMultipleItemsVisibility,
  closeEditMultipleItemsModal,
  updateMultipleGoals
} from '../../actions/bulkEditActions';

import Select from 'react-select';
import SCButton from '../../components/SCButton';
import SCChangeIndicator from '../../components/SCChangeIndicator';
import * as SCModal from '../../components/SCModal';

import './EditMultipleItemsForm.scss';

import Perf from 'react-addons-perf';
window.Perf = Perf;

class EditMultipleItemsForm extends React.Component {
  constructor(props) {
    super(props);

    this.onVisibilityChanged = this.onVisibilityChanged.bind(this);
    this.onRevertVisibility = this.onRevertVisibility.bind(this);
    this.onUpdateClicked = this.onUpdateClicked.bind(this);
    this.dismissModal = this.dismissModal.bind(this);
  }

  onVisibilityChanged(value) {
    this.props.setVisibility(value.value === 'public');
  }

  onRevertVisibility() {
    this.props.revertVisibility();
  }

  onUpdateClicked() {
    this.props.updateGoals(this.props.goals, this.props.formData.get('goal').toJS());
  }

  dismissModal() {
    this.props.dismissModal();
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
      visibilityChanged ? <SCChangeIndicator onRevert={ this.onRevertVisibility } /> : null;

    const isUpdateDisabled = !visibilityChanged;

    return (
      <SCModal.Modal>
        <SCModal.Header title={ translations.bulk_edit.title } onClose={ this.dismissModal } />

        <SCModal.Content>
          <div className="selected-rows-indicator">{ this.props.rowsCount } { translations.bulk_edit.items_selected }</div>
          <label class="block-label">{ translations.bulk_edit.visibility }</label>

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
          <SCButton small onClick={ this.dismissModal }>{ translations.bulk_edit.cancel }</SCButton>
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
  goals: selectedGoals(state)
});

const mapDispatchToProps = (dispatch, props) => ({
  setVisibility: visibility => dispatch(setMultipleItemsVisibility(visibility)),
  revertVisibility: () => dispatch(revertMultipleItemsVisibility()),
  dismissModal: () => dispatch(closeEditMultipleItemsModal()),
  updateGoals: (goals, data) => dispatch(updateMultipleGoals(goals, data))
});

export default connect(mapStateToProps, mapDispatchToProps)(EditMultipleItemsForm);
