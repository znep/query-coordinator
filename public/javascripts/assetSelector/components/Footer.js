import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { closeModal } from '../actions/modal';

export const Footer = (props) => {
  return (
    <footer className="modal-footer">
      <div className="modal-footer-actions">
        <button
          key="cancel"
          className="btn btn-default btn-sm cancel-button"
          onClick={props.dispatchCloseModal}>
          Cancel
        </button>

        <button
          key="select"
          className="btn btn-sm btn-primary select-button"
          disabled={props.selectIsDisabled}
          onClick={props.onSelect}>
          Select
        </button>
      </div>
    </footer>
  );
};

Footer.propTypes = {
  dispatchCloseModal: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectIsDisabled: PropTypes.bool.isRequired
};

Footer.defaultProps = {
  dispatchCloseModal: _.noop,
  onSelect: _.noop,
  selectIsDisabled: false
};

function mapDispatchToProps(dispatch) {
  return {
    dispatchCloseModal: function() {
      dispatch(closeModal());
    }
  };
}

export default connect(null, mapDispatchToProps)(Footer);
