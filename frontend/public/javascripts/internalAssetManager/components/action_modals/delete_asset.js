import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import { deleteAsset, fetchChildAssets } from 'actions/asset_actions';
import _ from 'lodash';
import classNames from 'classnames';
import connectLocalization from 'common/i18n/components/connectLocalization';

export class DeleteAsset extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentAssetChildrenCount: null,
      fetchingChildCount: true
    };

    _.bindAll(this, 'currentAsset');
  }

  componentWillMount() {
    const { assetType, uid } = this.props;

    if (assetType === 'dataset') {
      this.props.fetchChildAssets(uid).then((response) => {
        if (_.has(response, 'resultSetSize')) {
          this.setState({
            currentAssetChildrenCount: response.resultSetSize,
            fetchingChildCount: false
          });
        } else {
          throw new Error('Invalid response', response);
        }
      }).catch((err) => {
        console.error('Error fetching current asset child count', err);
        this.setState({ fetchingChildCount: false });
      });
    } else {
      this.setState({ fetchingChildCount: false });
    }
  }

  currentAsset() {
    // Get current asset's cetera properties from the results array.
    return _.find(_.filter(this.props.results, result => result.resource.id === this.props.uid));
  }

  render() {
    const { assetActions, assetType, onDismiss, uid } = this.props;
    const { currentAssetChildrenCount, fetchingChildCount } = this.state;
    const { I18n } = this.props;

    const scope = 'internal_asset_manager.result_list_table.action_modal.delete_asset';
    const getTranslation = (key) => I18n.t(key, { scope });

    const modalProps = {
      fullScreen: false,
      onDismiss
    };

    const headerProps = {
      onDismiss,
      showCloseButton: false,
      title: getTranslation('title')
    };

    const deleteConfirmationMessage = I18n.t('description_related_assets', {
      scope, count: currentAssetChildrenCount
    });

    let description;
    let subDescription;

    if (fetchingChildCount) {
      description = <span className="spinner-default" />;
    } else {
      description = (
        <div className="description">
          {I18n.t('description', { scope, name: _.get(this.currentAsset(), 'resource.name') })}
        </div>
      );

      if (currentAssetChildrenCount > 0) {
        subDescription = (
          <div className="sub-description">
            {deleteConfirmationMessage}
          </div>
        );
      } else if (assetType === 'chart' || assetType === 'map') {
        subDescription = (
          <div className="sub-description">
            {I18n.t('description_chart_map', { scope, assetType: getTranslation(assetType) })}
          </div>
        );
      }
    }

    const hasError = assetActions.performingActionFailure;
    const errorMessage = hasError ? (
      <div className="alert error">
        {getTranslation('error')}
      </div>
    ) : null;

    const deleteButtonText = assetActions.performingAction ?
      <span className="spinner-default spinner-small" /> : getTranslation('accept');
    const deleteButtonClass = classNames('accept-button btn btn-primary', { 'btn-error': hasError });

    return (
      <div className="action-modal delete-asset">
        <Modal {...modalProps} >
          <ModalHeader {...headerProps} />

          <ModalContent>
            {description}
            {subDescription}
            {errorMessage}
          </ModalContent>

          <ModalFooter>
            <button onClick={onDismiss} className="dismiss-button btn btn-default">
              {getTranslation('dismiss')}
            </button>
            <button onClick={() => this.props.deleteAsset(uid)} className={deleteButtonClass}>
              {deleteButtonText}
            </button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

DeleteAsset.propTypes = {
  assetActions: PropTypes.object.isRequired,
  assetType: PropTypes.string.isRequired,
  deleteAsset: PropTypes.func.isRequired,
  fetchChildAssets: PropTypes.func.isRequired,
  onDismiss: PropTypes.func,
  results: PropTypes.array.isRequired,
  uid: PropTypes.string.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  assetActions: state.assetActions,
  results: state.catalog.results
});

const mapDispatchToProps = dispatch => ({
  deleteAsset: (uid) => dispatch(deleteAsset(uid)),
  fetchChildAssets: (uid) => dispatch(fetchChildAssets(uid))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(DeleteAsset));
