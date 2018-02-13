import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';
import AssetBrowser from 'common/components/AssetBrowser';
import ResultsAndFilters from 'common/components/AssetBrowser/components/results_and_filters';
import { ASSET_SELECTOR } from 'common/components/AssetBrowser/lib/constants';

import './index.scss';

export class AssetSelector extends Component {

  renderModalFooter() {
    if (this.props.modalFooterChildren) {
      return <ModalFooter children={this.props.modalFooterChildren} />;
    }
  }

  render() {
    const {
      additionalTopbarComponents,
      baseFilters,
      closeOnSelect,
      includeFederatedAssets,
      onClose,
      onAssetSelected,
      renderInModal,
      resultsPerPage,
      showBackButton,
      title
    } = this.props;

    const assetBrowserProps = {
      additionalTopbarComponents,
      closeOnSelect,
      enableAssetInventoryLink: false,
      includeFederatedAssets,
      initialTab: ASSET_SELECTOR,
      onAssetSelected,
      onClose,
      pageSize: resultsPerPage,
      renderStyle: 'card',
      selectMode: true,
      showAssetCounts: false,
      showBackButton,
      showFilters: false,
      showHeader: false,
      tabs: {
        [ASSET_SELECTOR]: {
          component: ResultsAndFilters,
          props: {
            baseFilters
          }
        }
      }
    };

    if (renderInModal) {
      const modalProps = {
        className: 'asset-selector',
        fullScreen: true,
        onDismiss: onClose,
        overlay: true
      };

      return (
        <Modal {...modalProps}>
          <ModalHeader title={title} onDismiss={onClose} />
          <ModalContent>
            <AssetBrowser {...assetBrowserProps} />
          </ModalContent>
          {this.renderModalFooter()}
        </Modal>
      );
    } else {
      return (
        <div className="asset-selector">
          <AssetBrowser {...assetBrowserProps} />
        </div>
      );
    }
  }
}

AssetSelector.propTypes = {
  additionalTopbarComponents: PropTypes.array,
  closeOnSelect: PropTypes.bool,
  baseFilters: PropTypes.object,
  includeFederatedAssets: PropTypes.bool,
  onClose: PropTypes.func,
  onAssetSelected: PropTypes.func,
  modalFooterChildren: PropTypes.node,
  renderInModal: PropTypes.bool,
  resultsPerPage: PropTypes.number,
  showBackButton: PropTypes.bool,
  title: PropTypes.string
};

AssetSelector.defaultProps = {
  additionalTopbarComponents: [],
  baseFilters: {},
  closeOnSelect: true,
  includeFederatedAssets: false,
  onClose: _.noop,
  onAssetSelected: _.noop,
  renderInModal: true,
  resultsPerPage: 6,
  showBackButton: true,
  title: I18n.t('common.asset_selector.header_title')
};

export default AssetSelector;
