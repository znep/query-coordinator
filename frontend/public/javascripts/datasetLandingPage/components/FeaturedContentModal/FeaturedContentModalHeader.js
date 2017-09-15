import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

class FeaturedContentModalHeader extends PureComponent {
  render() {
    const { onClickClose } = this.props;

    return (
      <header className="modal-header">
        <h1>{I18n.featured_content_modal.header}</h1>

        <button
          className="btn btn-transparent modal-header-dismiss"
          data-modal-dismiss
          aria-label={I18n.close}
          onClick={onClickClose}>
          <span className="icon-close-2" />
        </button>
      </header>
    );
  }
}

FeaturedContentModalHeader.propTypes = {
  onClickClose: PropTypes.func
};

export default FeaturedContentModalHeader;
