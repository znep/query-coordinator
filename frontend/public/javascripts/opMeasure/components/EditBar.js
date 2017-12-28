import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Button, EditBar as SocrataComponentsEditBar, ToastNotification } from 'common/components';
import I18n from 'common/i18n';

import { openEditModal } from '../actions/editor';
import { enterPreviewMode, saveMeasure } from '../actions/view';

// Container for the edit menu affordance, as well as save and preview buttons.
export class EditBar extends PureComponent {
  renderSaveToast() {
    const { saveError, showSaveToastMessage } = this.props;

    const toastMessage = saveError ?
      I18n.t('open_performance.save_error') :
      I18n.t('open_performance.save_success');

    return (
      <ToastNotification
        showNotification={showSaveToastMessage}
        type={saveError ? 'error' : 'success'}>
        <span>{toastMessage}</span>
      </ToastNotification>
    );
  }

  render() {
    const {
      editBusy,
      measure,
      onClickEdit,
      onClickPreview,
      onClickSave,
      saving
    } = this.props;
    const { name } = measure || {};
    const editBarProps = { name };

    return (
      <SocrataComponentsEditBar {...editBarProps}>
        <div className="edit-bar-child">
          <Button variant="primary" dark busy={editBusy} onClick={onClickEdit}>
            {I18n.t('open_performance.edit')}
          </Button>
          <Button className="btn-save" dark onClick={onClickSave} busy={saving}>
            {I18n.t('open_performance.save')}
          </Button>
          {this.renderSaveToast()}
          <Button className="btn-preview" variant="transparent" onClick={onClickPreview}>
            {I18n.t('open_performance.preview')}
            <span className="socrata-icon-preview" role="presentation" />
          </Button>
        </div>
      </SocrataComponentsEditBar>
    );
  }
}

EditBar.propTypes = {
  measure: PropTypes.shape({
    name: PropTypes.string
  }),
  editBusy: PropTypes.bool,
  onClickEdit: PropTypes.func,
  onClickPreview: PropTypes.func,
  onClickSave: PropTypes.func,
  saveError: PropTypes.any,
  showSaveToastMessage: PropTypes.bool,
  saving: PropTypes.bool
};

function mapStateToProps(state) {
  const { measure, saving, saveError, showSaveToastMessage } = state.view;
  const editBusy = _.get(measure, 'dataSourceLensUid') && !_.get(state.editor, 'dataSourceView');

  return {
    measure: state.view.measure,
    editBusy,
    saveError,
    showSaveToastMessage,
    saving
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onClickPreview: enterPreviewMode,
    onClickEdit: openEditModal,
    onClickSave: saveMeasure
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditBar);
