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

  const headerTitle = _.isEmpty(props.category) ?
    _.get(I18n, 'asset_selector.header_title_without_category', 'Select Featured Content') :
    _.get(I18n, 'asset_selector.header_title_with_category',
      `Select Featured Content in ${props.category}`).replace('%{category}', props.category);

  return props.modalIsOpen ? (
    <div className={modalClassNames} data-modal-dismiss>
      <div className={'modal-container no-footer'}>
        <Header title={headerTitle} />
        <ResultsContainer
          additionalTopbarComponents={props.additionalTopbarComponents}
          category={props.category}
          resultsPerPage={props.resultsPerPage} />
      </div>
    </div>
  ) : null;
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
