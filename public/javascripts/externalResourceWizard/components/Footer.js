import React, { Component, PropTypes } from 'react';
import _ from 'lodash';

export class Footer extends Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <footer className="modal-footer">
        <div className="modal-footer-actions">
          <button
            key="cancel"
            className="btn btn-default btn-sm cancel-button"
            onClick={this.props.onClose}>
            {_.get(I18n, 'external_resource_wizard.footer.cancel', 'Cancel')}
          </button>

          <button
            key="select"
            className="btn btn-sm btn-primary select-button"
            disabled={this.props.selectIsDisabled}
            onClick={this.props.onSelect}>
            {_.get(I18n, 'external_resource_wizard.footer.select', 'Select')}
          </button>
        </div>
      </footer>
    );
  }
}

Footer.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectIsDisabled: PropTypes.bool.isRequired
};

Footer.defaultProps = {
  onClose: _.noop,
  onSelect: _.noop,
  selectIsDisabled: false
};

export default Footer;
