import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { closeExternalResourceWizard } from '../actions/modal';
import { updateTitle, updateDescription, updateUrl, updatePreviewImage } from '../actions/content';

export const Footer = (props) => {
  return (
    <footer className="modal-footer">
      <div className="modal-footer-actions">
        <button
          key="cancel"
          className="btn btn-default btn-sm cancel-button"
          onClick={() => {
            props.dispatchCloseExternalResourceWizard();
            props.dispatchClearFormValues();
          }}>
          {_.get(I18n, 'external_resource_wizard.footer.cancel', 'Cancel')}
        </button>

        <button
          key="select"
          className="btn btn-sm btn-primary select-button"
          disabled={props.selectIsDisabled}
          onClick={props.onSelect}>
          {_.get(I18n, 'external_resource_wizard.footer.select', 'Select')}
        </button>
      </div>
    </footer>
  );
};

Footer.propTypes = {
  dispatchCloseExternalResourceWizard: PropTypes.func.isRequired,
  dispatchClearFormValues: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectIsDisabled: PropTypes.bool.isRequired
};

Footer.defaultProps = {
  dispatchCloseExternalResourceWizard: _.noop,
  dispatchClearFormValues: _.noop,
  onSelect: _.noop,
  selectIsDisabled: false
};

function mapDispatchToProps(dispatch) {
  return {
    dispatchCloseExternalResourceWizard: function() {
      dispatch(closeExternalResourceWizard());
    },
    dispatchClearFormValues: function() {
      dispatch(updateTitle(''));
      dispatch(updateDescription(''));
      dispatch(updateUrl(''));
      dispatch(updatePreviewImage(''));
    }
  };
}

export default connect(null, mapDispatchToProps)(Footer);
