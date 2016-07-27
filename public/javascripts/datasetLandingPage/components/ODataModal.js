import _ from 'lodash';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { initClipboardControl, isCopyingSupported } from '../lib/clipboardControl';

export var ODataModal = React.createClass({
  propTypes: {
    onClickCopy: PropTypes.func.isRequired,
    view: PropTypes.object.isRequired
  },

  componentDidMount: function() {
    if (isCopyingSupported) {
      var el = ReactDOM.findDOMNode(this);
      initClipboardControl(el.querySelectorAll('.btn.copy'));
    }
  },

  onFocusInput: function(event) {
    event.target.select();
  },

  renderEndpoint: function() {
    var { view, onClickCopy } = this.props;

    var copyButton = isCopyingSupported ?
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

          <form>
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
  },

  render: function() {
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
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

function mapDispatchToProps(dispatch) {
  return {
    onClickCopy: function() {
      var payload = {
        name: 'Copied OData Link'
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ODataModal);
