import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import $ from 'jquery';
import AssetSelector from '../assetSelector/components/AssetSelector';
import ExternalResourceWizard from '../externalResourceWizard/components/ExternalResourceWizard';
import ExternalResourceWizardButton from './components/ExternalResourceWizardButton';
import { openAssetSelector, closeAssetSelector } from '../assetSelector/actions/modal';
import { openExternalResourceWizard, closeExternalResourceWizard } from
  '../externalResourceWizard/actions/modal';

export const AssetSelectorWithExternalResourceWizard = (props) => {

  if (props.assetSelectorIsOpen === true || props.externalResourceWizardIsOpen === true) {
    $('body').addClass('modal-open');
  } else {
    $('body').removeClass('modal-open');
  }

  // TODO: remove these dummy divs
  const demoDivStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    width: '300px',
    border: '1px dashed #999',
    margin: '1rem'
  };

  return (
    <div>
      {[...Array(3)].map((x, i) => (
        <div style={demoDivStyle} key={i}>
          <button
            className="btn btn-primary"
            onClick={props.dispatchOpenAssetSelector}>
            Add...
          </button>
        </div>
      ))}

      <AssetSelector
        category={props.category}
        resultsPerPage={props.resultsPerPage}
        additionalTopbarComponents={[
          <ExternalResourceWizardButton
            key={0}
            onClick={props.dispatchCloseAssetSelector} />
        ]} />
      <ExternalResourceWizard
        onDismiss={props.dispatchOpenAssetSelector} />
    </div>
  );
};

AssetSelectorWithExternalResourceWizard.propTypes = {
  assetSelectorIsOpen: PropTypes.bool,
  externalResourceWizardIsOpen: PropTypes.bool,
  category: PropTypes.string,
  resultsPerPage: PropTypes.number,
  dispatchOpenAssetSelector: PropTypes.func,
  dispatchCloseAssetSelector: PropTypes.func,
  dispatchOpenExternalResourceWizard: PropTypes.func,
  dispatchCloseExternalResourceWizard: PropTypes.func
};

AssetSelectorWithExternalResourceWizard.defaultProps = {
  assetSelectorIsOpen: false,
  externalResourceWizardIsOpen: false,
  category: null,
  resultsPerPage: 6,
  dispatchOpenAssetSelector: _.noop,
  dispatchCloseAssetSelector: _.noop,
  dispatchOpenExternalResourceWizard: _.noop,
  dispatchCloseExternalResourceWizard: _.noop
};

function mapStateToProps(state) {
  return {
    assetSelectorIsOpen: _.get(state, 'assetSelector.modal.modalIsOpen'),
    externalResourceWizardIsOpen: _.get(state, 'externalResourceWizard.modal.modalIsOpen')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchOpenAssetSelector: function() {
      dispatch(openAssetSelector());
    },
    dispatchCloseAssetSelector: function() {
      dispatch(closeAssetSelector());
    },
    dispatchOpenExternalResourceWizard: function() {
      dispatch(openExternalResourceWizard());
    },
    dispatchCloseExternalResourceWizard: function() {
      dispatch(closeExternalResourceWizard());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AssetSelectorWithExternalResourceWizard);
