import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { closeModal } from '../actions/modal';
import _ from 'lodash';

export const BackButton = (props) => (
  <div className="back-button">
    <button className="btn btn-default btn-sm close-modal" onClick={props.dispatchCloseModal}>
      <span className="socrata-icon-arrow-prev"></span> Back{/* TODO: localization */}
    </button>
  </div>
);

BackButton.propTypes = {
  dispatchCloseModal: PropTypes.func.isRequired
};

BackButton.defaultProps = {
  dispatchCloseModal: _.noop
};

function mapDispatchToProps(dispatch) {
  return {
    dispatchCloseModal: function() {
      dispatch(closeModal());
    }
  };
}

export default connect(null, mapDispatchToProps)(BackButton);
