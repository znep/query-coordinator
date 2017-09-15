import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { initClipboardControl, isCopyingSupported } from '../lib/clipboardControl';

export class ODataModal extends Component {
  componentDidMount() {
    if (isCopyingSupported) {
      const el = ReactDOM.findDOMNode(this);
      initClipboardControl(el.querySelectorAll('.btn.copy'));
    }
  }

  onFocusInput(event) {
    event.target.select();
  }

  onSubmit(event) {
    event.preventDefault();
  }

  renderEndpoint() {
    const { view, onClickCopy } = this.props;

    const copyButton = isCopyingSupported ?
      <span className="input-group-btn">
        <button
          type="button"
          className="btn btn-primary btn-sm copy"
          data-confirmation={I18n.copy_success}
          onClick={onClickCopy}>
          {I18n.copy}
        </button>
      </span> :
      null;

    return (
      <div className="endpoint odata-endpoint">
        <section className="modal-content">
          <h6 id="odata-endpoint" className="endpoint-title">
            {I18n.odata_modal.endpoint_title}
          </h6>

          <form onSubmit={this.onSubmit}>
            <span className="input-group">
              <input
                aria-labelledby="odata-endpoint"
                className="endpoint-input text-input text-input-sm"
                type="text"
                value={view.odataUrl}
                onFocus={this.onFocusInput}
                readOnly />
              {copyButton}
            </span>
          </form>
        </section>
      </div>
    );
  }

  render() {
    return (
      <div id="odata-modal" className="modal modal-overlay modal-hidden" data-modal-dismiss>
        <div className="modal-container">
          <header className="modal-header">
            <h2 className="h2 modal-header-title">{I18n.odata_modal.title}</h2>
            <button
              aria-label={I18n.close}
              className="btn btn-transparent modal-header-dismiss"
              data-modal-dismiss>
              <span className="icon-close-2"></span>
            </button>
          </header>

          <section className="modal-content odata-description">
            <p className="small">{I18n.odata_modal.description}</p>
          </section>

          <section className="modal-content">
            <a
              className="btn btn-default btn-sm documentation-link"
              href="https://dev.socrata.com/odata"
              target="_blank">
              <span className="icon-copy-document"></span>
              {I18n.odata_modal.developer_portal_button}
            </a>
          </section>

          {this.renderEndpoint()}

          <footer className="modal-actions">
            <button className="btn btn-default btn-sm" data-modal-dismiss>
              {I18n.done}
            </button>
          </footer>
        </div>
      </div>
    );
  }
}

ODataModal.propTypes = {
  onClickCopy: PropTypes.func.isRequired,
  view: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

function mapDispatchToProps(dispatch) {
  return {
    onClickCopy() {
      const payload = {
        name: 'Copied OData Link'
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ODataModal);
