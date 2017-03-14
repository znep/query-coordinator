import React, { PropTypes } from 'react';
import _ from 'lodash';
import ResultsContainer from './ResultsContainer';
import { Modal, ModalHeader, ModalContent } from 'socrata-components';

export class AssetSelector extends React.Component {
  render() {
    const {
      additionalTopbarComponents,
      category,
      modalIsOpen,
      onClose,
      onSelect,
      resultsPerPage
    } = this.props;

    const headerTitle = _.isEmpty(category) ?
      _.get(I18n, 'common.asset_selector.header_title_without_category') :
      _.get(I18n, 'common.asset_selector.header_title_with_category',
        'Select Featured Content in %{category}'
      ).replace('%{category}', category);

    const resultsContainerProps = { additionalTopbarComponents, category, onClose, onSelect, resultsPerPage };

    const modalProps = {
      className: 'asset-selector',
      fullScreen: true,
      onDismiss: onClose,
      overlay: true
    };

    return (modalIsOpen ?
      <Modal {...modalProps}>
        <ModalHeader title={headerTitle} onDismiss={onClose} />
        <ModalContent>
          <ResultsContainer {...resultsContainerProps} />
        </ModalContent>
      </Modal> : null
    );
  }
}

AssetSelector.propTypes = {
  additionalTopbarComponents: PropTypes.array,
  category: PropTypes.string,
  modalIsOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  resultsPerPage: PropTypes.number.isRequired
};

AssetSelector.defaultProps = {
  additionalTopbarComponents: [],
  category: null,
  modalIsOpen: false,
  onClose: _.noop,
  onSelect: _.noop,
  resultsPerPage: 6
};

export default AssetSelector;
