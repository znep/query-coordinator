import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import I18n from 'common/i18n';

import ReactDOM from 'react-dom';
import Modal, { ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';

const scope = 'shared.components.asset_action_bar.confirmation';

class AgreeButton extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'onClick');

    this.state = { clicked: false };
  }

  onClick(evt) {
    this.setState({ clicked: true });
    this.props.onClick(evt);
  }

  render() {
    const agreeText = this.state.clicked && this.props.useSpinner ?
      [<span key="spinner" className="spinner-default spinner-btn-primary" />, this.props.text] :
      this.props.text;

    return (
      <button
        onClick={this.onClick}
        className="btn btn-primary">
          {agreeText}
      </button>
    );
  }
}

const confirmation = (message, options = {}) => {
  return new Promise((resolve, reject) => {
    const targetNode = document.querySelector('#asset-action-bar-modal-target');
    const agreeText = options.agree || I18n.t('agree', { scope });
    const cancelText = options.cancel || I18n.t('cancel', { scope });

    const closeModal = () => _.defer(() => ReactDOM.unmountComponentAtNode(targetNode));
    const onAgree = (evt) => {
      if (_.isUndefined(options.dismissOnAgree)) {
        closeModal();
      }
      resolve(true);
    };
    const onDismiss = () => {
      closeModal();
      resolve(false);
    };

    ReactDOM.render(
      <Modal onDismiss={onDismiss}>
        <ModalHeader showCloseButton={false} onDismiss={onDismiss}>
          {options.header}
        </ModalHeader>
        <ModalContent>
          <p>{message}</p>
        </ModalContent>
        <ModalFooter>
          <button onClick={onDismiss} className="btn btn-default">{cancelText}</button>
          <AgreeButton useSpinner={!options.dismissOnAgree} onClick={onAgree} text={agreeText} />
        </ModalFooter>
      </Modal>,
      targetNode
    );
  });
};

export default confirmation;
