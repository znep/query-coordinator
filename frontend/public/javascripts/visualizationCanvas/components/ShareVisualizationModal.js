import _ from 'lodash';
import $ from 'jquery';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { closeShareModal, setEmbedSize } from '../actions';
import { Dropdown, Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import I18n from 'common/i18n';
import { components as SocrataVisualizations } from 'common/visualizations';
import generateEmbedCode from '../../visualization_embed/embedCodeGenerator';

// Embed sizes, in the order they should be presented in the UI.
const EMBED_SIZES = [
  { name: 'small', width: 300, height: 225 }, // 4:3
  { name: 'medium', width: 400, height: 300 }, // 4:3
  { name: 'large', width: 800, height: 600 }, // 4:3
  { name: 'wide', width: 1000, height: 625 } // 8:5
];

const selectOnFocus = (event) => {
  event.target.select();
};


export class ShareVisualizationModal extends Component {

  componentDidUpdate() {
    $(this.visualizationContainer).find('.socrata-visualization').
      trigger('SOCRATA_VISUALIZATION_INVALIDATE_SIZE');
  }

  renderLinkField() {
    const { copyableLinkUrl } = this.props;

    const linkProps = {
      id: 'share-link-field',
      type: 'text',
      value: copyableLinkUrl,
      onFocus: selectOnFocus,
      readOnly: true
    };

    const field = <input {...linkProps} />;

    const notAvailableMessage = (
      <div className="alert info">
        {I18n.t('visualization_canvas.share_modal.no_web_link_available')}
      </div>
    );

    return (
      <div>
        <label htmlFor="share-link-field" className="block-label">
          {I18n.t('visualization_canvas.share_modal.web_link')}
        </label>
        {copyableLinkUrl ? field : notAvailableMessage}
      </div>
    );
  }

  renderEmbedCodeField() {
    const { embedCode } = this.props;

    const textareaProps = {
      id: 'share-embed-code-field',
      value: embedCode,
      onFocus: selectOnFocus,
      readOnly: true
    };

    return (
      <div>
        <label htmlFor="share-embed-code-field" className="block-label">
          {I18n.t('visualization_canvas.share_modal.embed_code')}
        </label>
        <textarea {...textareaProps} />
      </div>
    );
  }

  renderSizeField() {
    const options = EMBED_SIZES.map(({ name, width, height }) => (
      {
        title: `${I18n.t(`visualization_canvas.share_modal.sizes.${name}`)} (${width}x${height})`,
        value: name
      }
    ));

    const dropdownProps = {
      onSelection: this.props.onChooseEmbedSize,
      options,
      value: this.props.embedSize
    };

    return (
      <div>
        <div>{I18n.t('visualization_canvas.share_modal.size_options')}</div>
        <Dropdown {...dropdownProps} />
      </div>
    );
  }

  renderPreview() {
    const { embedSize, vif } = this.props;
    const { width, height } = _.find(EMBED_SIZES, { name: embedSize });

    return (
      <div>
        {I18n.t('visualization_canvas.share_modal.preview')}
        <div style={{ width, height }} ref={(vis) => this.visualizationContainer = vis}>
          <SocrataVisualizations.Visualization vif={vif} />
        </div>
      </div>
    );
  }

  render() {
    const { isActive, onDismiss } = this.props;

    if (!isActive) {
      return null;
    }

    return (
      <Modal className="share-modal" onDismiss={onDismiss} >
        <ModalHeader title={I18n.t('visualization_canvas.share_modal.title')} onDismiss={onDismiss} />

        <ModalContent>
          <form>
            {this.renderLinkField()}
            {this.renderEmbedCodeField()}
            {this.renderSizeField()}
          </form>
          {this.renderPreview()}
        </ModalContent>

        <ModalFooter>
          <button className="btn btn-sm btn-default" onClick={onDismiss}>
            {I18n.t('visualization_canvas.share_modal.close')}
          </button>
        </ModalFooter>
      </Modal>
    );
  }
}

ShareVisualizationModal.propTypes = {
  // Whether or not the modal is active.
  // If false, nothing is rendered.
  isActive: PropTypes.bool.isRequired,

  // Embed code to display to the user.
  embedCode: PropTypes.string.isRequired,

  // Link to display in the "Web Link" box. If not provided, explanatory info
  // text will be rendered.
  copyableLinkUrl: PropTypes.string,

  // Size name to select in the dropdown. See EMBED_SIZES.
  embedSize: PropTypes.oneOf(_.map(EMBED_SIZES, 'name')),

  // Called when the modal is dismissed.
  onDismiss: PropTypes.func.isRequired,

  // Called when the user selects a new embed size.
  onChooseEmbedSize: PropTypes.func.isRequired,

  // VIF to share.
  vif: PropTypes.object
};

function mapStateToProps(state) {
  const { isActive, embedSize, vif } = state.shareModal;
  const { width, height } = _.find(EMBED_SIZES, { name: embedSize }) || {};

  const embedCode = generateEmbedCode(
    vif,
    {
      width,
      height,
      sourceHref: `${state.dataSourceUrl}?referrer=embed`,
      fallbackSourceLinkText: I18n.t('visualization_canvas.share_modal.fallback_link_text')
    }
  );

  return {
    embedCode,
    embedSize,
    isActive,
    copyableLinkUrl: state.visualizationUrl,
    vif
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onDismiss: closeShareModal,
    onChooseEmbedSize: (option) => setEmbedSize(option.value)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ShareVisualizationModal);
