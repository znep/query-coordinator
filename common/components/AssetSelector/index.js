import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';
import { Modal, ModalHeader, ModalContent } from 'common/components/Modal';
import AssetBrowser from 'common/components/AssetBrowser';
import ResultsAndFilters from 'common/components/AssetBrowser/components/results_and_filters';
import { DEFAULT_TAB } from 'common/components/AssetBrowser/lib/constants';

import './index.scss';

export class AssetSelector extends Component {
  render() {
    const { additionalTopbarComponents, baseFilters, onClose, onAssetSelected, resultsPerPage, title } =
      this.props;

    const modalProps = {
      className: 'asset-selector',
      fullScreen: true,
      onDismiss: onClose,
      overlay: true
    };

    const assetBrowserProps = {
      additionalTopbarComponents,
      enableAssetInventoryLink: false,
      onAssetSelected,
      onClose,
      pageSize: resultsPerPage,
      renderStyle: 'card',
      selectMode: true,
      showAssetCounts: false,
      showFilters: false,
      showHeader: false,
      tabs: {
        [DEFAULT_TAB]: {
          component: ResultsAndFilters,
          props: {
            baseFilters
          }
        }
      }
    };

    return (
      <Modal {...modalProps}>
        <ModalHeader title={title} onDismiss={onClose} />
        <ModalContent>
          <AssetBrowser {...assetBrowserProps} />
        </ModalContent>
      </Modal>
    );
  }
}

AssetSelector.propTypes = {
  additionalTopbarComponents: PropTypes.array,
  baseFilters: PropTypes.object,
  onClose: PropTypes.func,
  onAssetSelected: PropTypes.func,
  resultsPerPage: PropTypes.number,
  title: PropTypes.string
};

AssetSelector.defaultProps = {
  additionalTopbarComponents: [],
  baseFilters: {},
  onClose: _.noop,
  onAssetSelected: _.noop,
  resultsPerPage: 6,
  title: I18n.t('common.asset_selector.header_title')
};

export default AssetSelector;
