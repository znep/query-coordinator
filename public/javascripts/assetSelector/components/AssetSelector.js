import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import Header from '../components/Header';
import ResultsContainer from '../components/ResultsContainer';

export class AssetSelector extends Component {
  render() {
    const {
      additionalTopbarComponents,
      category,
      modalIsOpen,
      onClose,
      onSelect,
      resultsPerPage
    } = this.props;

    const modalClassNames = classNames({
      'asset-selector-modal': true, // TODO use react modal instead
      'modal': true,
      'modal-full': true,
      'modal-hidden': !modalIsOpen
    });

    const headerTitle = _.isEmpty(category) ?
      _.get(I18n, 'asset_selector.header_title_without_category', 'Select Featured Content') :
      _.get(I18n, 'asset_selector.header_title_with_category',
        `Select Featured Content in ${category}`).replace('%{category}', category);

    const resultsContainerProps = { additionalTopbarComponents, category, onClose, onSelect, resultsPerPage };

    return modalIsOpen ? (
      <div className={modalClassNames} data-modal-dismiss>
        <div className="modal-container no-footer">
          <Header title={headerTitle} />
          <ResultsContainer {...resultsContainerProps} />
        </div>
      </div>
    ) : null;
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
