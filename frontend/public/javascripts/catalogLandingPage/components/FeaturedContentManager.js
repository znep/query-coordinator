import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import * as Actions from '../actions/featuredContent';
import _ from 'lodash';

import FeaturedContentViewCardManager from './FeaturedContentViewCardManager';
import FeaturedContentViewCardPlaceholder from './FeaturedContentViewCardPlaceholder';
import { AssetSelector } from '../../common/components/assetSelector/AssetSelector';
import { ExternalResourceEditor } from
  '../../common/components/externalResourceEditor/ExternalResourceEditor';

import { getViewCardPropsForCLPFeaturedItem } from '../../common/helpers/viewCardHelpers';

export const MAX_NUMBER_OF_FEATURED_CARDS = 3;

export class FeaturedContentManager extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      assetSelectorIsOpen: false,
      externalResourceEditorIsOpen: false,
      editingViewCardAtPosition: null,
      selectedFeaturedContentItem: null
    };

    _.bindAll(this, [
      'onAssetSelection',
      'openAssetSelector',
      'closeAssetSelector',
      'openExternalResourceEditor',
      'closeExternalResourceEditor'
    ]);
  }

  onAssetSelection(item) {
    this.props.setFeaturedContentItem(item, this.state.editingViewCardAtPosition);
  }

  openAssetSelector(position = null) {
    let selectedItem = null;
    if (_.isNumber(position)) {
      this.setState({ editingViewCardAtPosition: position });
      selectedItem = this.props.featuredContent[`item${position}`];
    }

    if (selectedItem && selectedItem.contentType === 'external' && !selectedItem.removed) {
      this.setState({
        editingViewCardAtPosition: position,
        selectedFeaturedContentItem: selectedItem,
        externalResourceEditorIsOpen: true
      });
    } else {
      this.setState({ assetSelectorIsOpen: true });
    }
  }

  closeAssetSelector() {
    this.setState({
      selectedFeaturedContentItem: { title: '', description: '', url: '', previewImage: '' },
      assetSelectorIsOpen: false
    });
  }

  openExternalResourceEditor() {
    this.setState({ externalResourceEditorIsOpen: true });
  }

  closeExternalResourceEditor() {
    this.setState({ externalResourceEditorIsOpen: false });
  }

  render() {
    const { featuredContent } = this.props;
    const viewCardManagersAndPlaceholders = [];

    for (let position = 0; position < MAX_NUMBER_OF_FEATURED_CARDS; position++) {
      const key = `item${position}`;
      const featuredContentItem = featuredContent[key];

      const featuredContentViewCardProps = _.merge({
        key,
        position,
        openManager: this.openAssetSelector,
        ...featuredContentItem
      }, getViewCardPropsForCLPFeaturedItem(featuredContentItem));

      const showViewCardPlaceholder = (_.isEmpty(featuredContentItem) || featuredContentItem.removed);

      viewCardManagersAndPlaceholders.push(showViewCardPlaceholder ?
        <FeaturedContentViewCardPlaceholder {...featuredContentViewCardProps} /> :
        <FeaturedContentViewCardManager {...featuredContentViewCardProps} />
      );
    }

    const assetSelectorProps = {
      additionalTopbarComponents: [
        <button
          key={0}
          className="btn btn-default btn-sm external-resource-wizard-button"
          onClick={() => {
            this.closeAssetSelector();
            this.openExternalResourceEditor();
          }}>
          {_.get(I18n, 'common.external_resource_editor.open_editor_button')}
        </button>
      ],
      catalogQuery: this.props.catalogQuery,
      modalIsOpen: this.state.assetSelectorIsOpen,
      onClose: this.closeAssetSelector,
      onSelect: this.onAssetSelection,
      resultsPerPage: 6,
      title: this.props.assetSelectorTitle
    };

    const selectedFeaturedContentItemIsEmpty = () => (
      _(this.state.selectedFeaturedContentItem).
        pick('title', 'description', 'url', 'previewImage').
        every(_.isEmpty)
    );

    const externalResourceEditorProps = {
      featuredContentItem: this.state.selectedFeaturedContentItem,
      modalIsOpen: this.state.externalResourceEditorIsOpen,
      onBack: () => {
        this.closeExternalResourceEditor();
        if (selectedFeaturedContentItemIsEmpty()) {
          this.openAssetSelector();
        }
      },
      onClose: this.closeExternalResourceEditor,
      onSelect: this.onAssetSelection
    };

    return (
      <section className="landing-page-section featured-content">
        <div className="media-results">
          {viewCardManagersAndPlaceholders}
        </div>

        <AssetSelector {...assetSelectorProps} />
        <ExternalResourceEditor {...externalResourceEditorProps} />
      </section>
    );
  }
}

FeaturedContentManager.propTypes = {
  assetSelectorTitle: PropTypes.string.isRequired,
  catalogQuery: PropTypes.object.isRequired,
  featuredContent: PropTypes.object.isRequired,
  setFeaturedContentItem: PropTypes.func.isRequired
};

FeaturedContentManager.defaultProps = {
  catalogQuery: {},
  featuredContent: {},
  setFeaturedContentItem: _.noop
};

const mapStateToProps = (state) => {
  return ({
    catalogQuery: state.catalog.query,
    featuredContent: state.featuredContent
  });
};

const mapDispatchToProps = dispatch => ({
  setFeaturedContentItem: (item, position) => dispatch(Actions.setFeaturedContentItem(item, position))
});

export default connect(mapStateToProps, mapDispatchToProps)(FeaturedContentManager);
