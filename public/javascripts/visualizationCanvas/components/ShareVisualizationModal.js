import React, { PropTypes, Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { closeShareModal, setEmbedSize } from '../actions';
import { Dropdown, Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';
import { t } from '../lib/I18n';
import { generateEmbedCode, components as SocrataVisualizations } from 'socrata-visualizations';

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


  renderLinkField() {
    const { copyableLinkUrl } = this.props;

    const props = {
      id: 'share-link-field',
      type: 'text',
      value: copyableLinkUrl,
      onFocus: selectOnFocus,
      readOnly: true
    };

    return (
      <div>
        <label htmlFor="share-link-field" className="block-label">
          {t('share_modal.web_link')}
        </label>
        <input {...props} />
      </div>
    );
  }

  renderEmbedCodeField() {
    const { embedCode } = this.props;

    const props = {
      id: 'share-embed-code-field',
      value: embedCode,
      onFocus: selectOnFocus,
      readOnly: true
    };

    return (
      <div>
        <label htmlFor="share-embed-code-field" className="block-label">
          {t('share_modal.embed_code')}
        </label>
        <textarea {...props} />
      </div>
    );
  }

  renderSizeField() {
    const options = EMBED_SIZES.map((size) => (
      {
        title: `${t(`share_modal.sizes.${size.name}`)} (${size.width}x${size.height})`,
        value: size.name
      }
    ));

    const props = {
      onSelection: this.props.onChooseEmbedSize,
      options,
      value: this.props.embedSize
    };

    return (
      <div>
        <div>{t('share_modal.size_options')}</div>
        <Dropdown {...props} />
      </div>
    );
  }

  renderPreview() {
    const { embedSize, vif } = this.props;
    const { width, height } = _.find(EMBED_SIZES, { name: embedSize });

    return (
      <div>
        {t('share_modal.preview')}
        <div style={{ width, height }}>
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
        <ModalHeader title={t('share_modal.title')} onDismiss={onDismiss} />

        <ModalContent>
          <form>
            {this.renderLinkField()}
            {this.renderEmbedCodeField()}
            {this.renderSizeField()}
          </form>
          {this.renderPreview()}
        </ModalContent>

        <ModalFooter>
          <button className="btn" onClick={onDismiss}>{t('share_modal.close')}</button>
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

  // Link to display in the "Web Link" box.
  copyableLinkUrl: PropTypes.string.isRequired,

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
  const copyableLinkUrl = `https://${window.location.host}/d/${state.view.id}`;
  const sourceHref = `https://${window.location.host}/d/${state.view.id}?referrer=embed`;

  const { width, height } = _.find(EMBED_SIZES, { name: embedSize }) || {};

  const embedCode = generateEmbedCode(
    vif,
    {
      sourceHref,
      width,
      height,
      fallbackSourceLinkText: t('share_modal.fallback_visualization_text')
    }
  );

  return {
    embedCode,
    embedSize,
    isActive,
    copyableLinkUrl,
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
