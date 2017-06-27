import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import { deleteAsset, fetchChildAssets } from 'actions/asset_actions';
import _ from 'lodash';
import classNames from 'classnames';

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
      this.props.fetchChildAssets(uid).then(response => {
        if (_.has(response, 'resultSetSize')) {
          this.setState({
            currentAssetChildrenCount: response.resultSetSize,
            fetchingChildCount: false
          });
        } else {
          throw new Error('Invalid response', response);
        }
      }).catch(err => {
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

    const getTranslation = (key) =>
      _.get(I18n, `result_list_table.action_modal.delete_asset.${key}`);

    const modalProps = {
      fullScreen: false,
      onDismiss
    };

    const headerProps = {
      onDismiss,
      title: getTranslation('title')
    };

    let description;
    let subDescription;

    if (fetchingChildCount) {
      description = <span className="spinner-default" />;
    } else {
      description = (
        <div className="description">
          {getTranslation('description').replace('%{name}', _.get(this.currentAsset(), 'resource.name'))}
        </div>
      );

      if (currentAssetChildrenCount > 0) {
        subDescription = (
          <div className="sub-description">
            {getTranslation('description_related_assets').replace('%{count}', currentAssetChildrenCount)}
          </div>
        );
      } else if (assetType === 'chart' || assetType === 'map') {
        subDescription = (
          <div className="sub-description">
            {getTranslation('description_chart_map').replace('%{assetType}', getTranslation(assetType))}
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
  uid: PropTypes.string.isRequired
};

const mapStateToProps = state => ({
  assetActions: state.assetActions,
  results: state.catalog.results
});

const mapDispatchToProps = dispatch => ({
  deleteAsset: (uid) => dispatch(deleteAsset(uid)),
  fetchChildAssets: (uid) => dispatch(fetchChildAssets(uid))
});

export default connect(mapStateToProps, mapDispatchToProps)(DeleteAsset);