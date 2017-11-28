import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { Modal, ModalHeader, ModalContent } from 'common/components/Modal';
import SocrataIcon from 'common/components/SocrataIcon';
import { fetchJson, defaultHeaders } from 'common/http';
import AssetSelector from '../AssetSelector';

import './styles/index.scss';

// Limit of how many associated assets can be added. This will probably become a prop once we allow
// more than 1 (for the case where we're on a parent selecting multiple children).
const ASSET_LIMIT = 1;

export class AssociatedAssets extends Component {
  constructor(props) {
    super(props);

    this.state = {
      assetSelectorIsOpen: false,
      selectedAssets: []
    };
  }

  componentDidMount() {
    // Fetch existing associated assets. This should probably not be in this file
    fetchJson(`/api/publishing/v1/revision/${this.props.uid}/0`, {
      credentials: 'same-origin',
      headers: defaultHeaders
    }).then(response => {
      const additionalAccessPoints = _.get(response, 'resource.metadata.metadata.additionalAccessPoints');
      if (additionalAccessPoints && !_.isEmpty(_.first(additionalAccessPoints))) {
        const { uid, urls } = _.first(additionalAccessPoints);
        const name = _.first(Object.keys(urls));
        const url = _.first(Object.values(urls));
        this.setState({ selectedAssets: [{ id: uid, name, url }] });
      }
    })
    .catch(err => {
      console.error('failed to fetch associated assets', err);
    });
  }

  handleRemoveAssetClick(event, removedAssetId) {
    event.preventDefault();
    const newSelectedAssets = this.state.selectedAssets.filter((assets) => assets.id !== removedAssetId);
    this.setState({ selectedAssets: newSelectedAssets });
  }

  renderAssociatedAssetLinks() {
    const assetLinks = _.map(this.state.selectedAssets, (asset) => (
      <li className="associated-asset-link" key={asset.id}>
        <a
          href="#"
          title="Remove"
          onClick={(event) => this.handleRemoveAssetClick(event, asset.id)}
          className="remove-asset">
          <SocrataIcon name="close-2" />
        </a>
        <a href={asset.url} target="_blank" className="btn btn-xs btn-primary name">{asset.name}</a>
        <p className="description">{asset.description}</p>
      </li>
    ));

    return (
      <ul className="associated-asset-links">
        {assetLinks}
      </ul>
    );
  }

  renderAddAssociatedAssetButton() {
    if (this.state.selectedAssets.length >= ASSET_LIMIT) return null;

    const handleClick = (event) => {
      event.preventDefault();
      this.setState({ assetSelectorIsOpen: true });
    };

    return (
      <a
        href="#"
        className="btn btn-sm btn-default"
        onClick={handleClick}>
        Add
      </a>
    );
  }

  render() {
    const { apiCalls, modalIsOpen, onDismiss, onSave } = this.props;
    const { assetSelectorIsOpen } = this.state;

    const modalProps = {
      className: 'associated-assets',
      fullScreen: false,
      onDismiss,
      overlay: true
    };

    const handleAssetSelectorClose = () => {
      this.setState({ assetSelectorIsOpen: false });
    };

    const assetSelectorProps = {
      catalogQuery: {
        limitTo: 'href',
        published: true
      },
      modalIsOpen: assetSelectorIsOpen,
      onClose: handleAssetSelectorClose,
      onSelect: (assetData) => {
        this.setState({ selectedAssets: this.state.selectedAssets.concat(assetData) });
      },
      resultsPerPage: 6,
      title: 'Add to Existing Data Asset'
    };

    const handleCancel = (e) => {
      e.preventDefault();
      onDismiss();
    };

    const handleSave = (e) => {
      e.preventDefault();
      onSave(this.state.selectedAssets);
    };

    const lastApiCall = _.last(apiCalls) || {};
    const lastApiCallStatus = lastApiCall.status;
    const saveInProgress = lastApiCallStatus === 'STATUS_CALL_IN_PROGRESS';
    const saveSuccess = lastApiCallStatus === 'STATUS_CALL_SUCCEEDED';
    const saveFailure = lastApiCallStatus === 'STATUS_CALL_FAILED';

    const saveButtonIsDisabled = this.state.selectedAssets.length < 1;

    const saveButtonClasses = classNames('btn btn-sm btn-primary save-button', {
      'btn-success': saveSuccess,
      'btn-error': saveFailure,
      'btn-disabled': saveButtonIsDisabled
    });

    const loadingSpinner = saveInProgress && (
      <span className="spinner-default" />
    );

    const errorMessage = saveFailure && (
      <p className="alert error">
        We are sorry, there was an error saving your association.
        Please try again or contact support@socrata.com
      </p>
    );

    // This is a terrible way to do this. If the api call succeeded in the last 500ms, close the modal.
    // This is to prevent the modal from closing again if the user re-opens it after a success.
    const saveJustSucceeded = saveSuccess && Date.now().valueOf() - lastApiCall.succeededAt.valueOf() < 500;
    if (saveJustSucceeded) {
      setTimeout(onDismiss, 1000);
    }

    const modal = modalIsOpen && (
      <Modal {...modalProps}>
        <ModalHeader title={'Associate asset'} onDismiss={onDismiss} />
        <ModalContent>
          {this.renderAssociatedAssetLinks()}
          {this.renderAddAssociatedAssetButton()}
          <div className="action-buttons">
            <a href="#" className="btn btn-sm btn-default cancel-button" onClick={handleCancel}>Cancel</a>
            <a
              href="#"
              disabled={saveButtonIsDisabled}
              className={saveButtonClasses}
              onClick={handleSave}>
              Save
              {loadingSpinner}
            </a>
          </div>
          {errorMessage}
        </ModalContent>
      </Modal>
    );

    return (
      <div>
        {modal}
        <AssetSelector {...assetSelectorProps} />
      </div>
    );
  }
}

AssociatedAssets.propTypes = {
  apiCalls: PropTypes.array,
  modalIsOpen: PropTypes.bool,
  onDismiss: PropTypes.func,
  onSave: PropTypes.func.isRequired,
  uid: PropTypes.string.isRequired
};

AssociatedAssets.defaultProps = {
  apiCalls: [],
  modalIsOpen: true,
  onDismiss: _.noop
};

export default AssociatedAssets;
