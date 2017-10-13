import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
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
      onClick: onClickCopy.bind(null, section)
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
  section: PropTypes.string.isRequired,
  onClickCopy: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return {
    onClickCopy(section) {
      const payload = {
        name: `Copied ${section} Link`
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(null, mapDispatchToProps)(CopyButton);
