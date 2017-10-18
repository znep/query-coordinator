import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { initClipboardControl, isCopyingSupported } from '../lib/clipboardControl';

class CopyButton extends PureComponent {
  componentDidMount() {
    if (isCopyingSupported) {
      initClipboardControl(this.copyButtonRef);
    }
  }

  render() {
    const { section, onClickCopy } = this.props;

    if (!isCopyingSupported) {
      return null;
    }

    const buttonProps = {
      type: 'button',
      className: 'btn btn-primary btn-sm copy',
      'data-confirmation': I18n.copy_success,
      ref: ref => this.copyButtonRef = ref,
      onClick: () => onClickCopy(section)
    };

    return (
      <span className="input-group-btn">
        <button {...buttonProps}>
          {I18n.copy}
        </button>
      </span>
    );
  }
}

CopyButton.propTypes = {
  onClickCopy: PropTypes.func.isRequired,
  section: PropTypes.string
};

export default CopyButton;
