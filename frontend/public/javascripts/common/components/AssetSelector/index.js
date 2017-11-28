import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import { ResultsContainer } from './results_container';
import { Modal, ModalHeader, ModalContent } from 'common/components/Modal';

import './styles/index.scss';

export class AssetSelector extends Component {
  render() {
    const {
      additionalTopbarComponents,
      catalogQuery,
      modalIsOpen,
      onClose,
      onSelect,
      resultsPerPage
    } = this.props;

    if (!modalIsOpen) return null;

    const resultsContainerProps = {
      additionalTopbarComponents,
      catalogQuery,
      onClose,
      onSelect,
      resultsPerPage
    };

    const modalProps = {
      className: 'asset-selector',
      fullScreen: true,
      onDismiss: onClose,
      overlay: true
    };

    const title = this.props.title || _.get(I18n, 'common.asset_selector.header_title');

    return (
      <Modal {...modalProps}>
        <ModalHeader title={title} onDismiss={onClose} />
        <ModalContent>
          <ResultsContainer {...resultsContainerProps} />
        </ModalContent>
      </Modal>
    );
  }
}

AssetSelector.propTypes = {
  additionalTopbarComponents: PropTypes.array,
  catalogQuery: PropTypes.object.isRequired,
  modalIsOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  resultsPerPage: PropTypes.number.isRequired,
  title: PropTypes.string
};

AssetSelector.defaultProps = {
  additionalTopbarComponents: [],
  catalogQuery: {},
  modalIsOpen: false,
  onClose: _.noop,
  onSelect: _.noop,
  resultsPerPage: 6
};

export default AssetSelector;
