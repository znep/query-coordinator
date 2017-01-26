import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import { openAssetSelector, closeAssetSelector } from '../actions/modal';
import Header from '../components/Header';
import ResultsContainer from '../components/ResultsContainer';

export const AssetSelector = (props) => {

  const modalClassNames = classNames({
    'asset-selector-modal': true,
    'modal': true,
    'modal-full': true,
    'modal-hidden': !props.modalIsOpen
  });

  return (
    <div className={modalClassNames} data-modal-dismiss>
      <div className={'modal-container no-footer'}>
        <Header title={'Select Featured Content in [category]'} />{/* TODO: localization, [category] */}
        <ResultsContainer
          additionalTopbarComponents={props.additionalTopbarComponents}
          category={props.category}
          resultsPerPage={props.resultsPerPage} />
      </div>
    </div>
  );
};

AssetSelector.propTypes = {
  additionalTopbarComponents: PropTypes.array,
  category: PropTypes.string,
  dispatchOpenAssetSelector: PropTypes.func.isRequired,
  dispatchCloseAssetSelector: PropTypes.func.isRequired,
  modalIsOpen: PropTypes.bool.isRequired,
  resultsPerPage: PropTypes.number.isRequired
};

AssetSelector.defaultProps = {
  additionalTopbarComponents: [],
  category: null,
  dispatchOpenAssetSelector: _.noop,
  dispatchCloseAssetSelector: _.noop,
  modalIsOpen: false,
  resultsPerPage: 6
};

function mapStateToProps(state) {
  return {
    modalIsOpen: _.get(state, 'assetSelector.modal.modalIsOpen')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchOpenAssetSelector: function() {
      dispatch(openAssetSelector());
    },
    dispatchCloseAssetSelector: function() {
      dispatch(closeAssetSelector());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AssetSelector);
