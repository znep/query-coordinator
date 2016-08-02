import _ from 'lodash';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { initClipboardControl, isCopyingSupported } from '../lib/clipboardControl';

export var ApiFlannel = React.createClass({
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

  onMouseUpInput: function(event) {
    event.preventDefault();
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
      <div className="endpoint api-endpoint">
        <section className="flannel-content">
          <a
            className="btn btn-default btn-sm documentation-link"
            href={view.apiFoundryUrl}
            target="_blank">
            <span className="icon-copy-document"></span>
            {I18n.api_flannel.foundry_button}
          </a>
          <a
            className="btn btn-default btn-sm documentation-link"
            href="https://dev.socrata.com"
            target="_blank">
            <span className="icon-settings"></span>
            {I18n.api_flannel.developer_portal_button}
          </a>
        </section>

        <section className="flannel-content">
          <h6 id="api-endpoint" className="endpoint-title">
            {I18n.api_flannel.endpoint_title}
          </h6>
          <form>
            <span className="input-group">
              <input
                aria-labelledby="api-endpoint"
                className="endpoint-input text-input text-input-sm"
                type="text"
                value={view.resourceUrl}
                readOnly
                onFocus={this.onFocusInput}
                onMouseUp={this.onMouseUpInput} />
              {copyButton}
            </span>
          </form>
        </section>
      </div>
    );
  },

  render: function() {
    return (
      <div
        role="dialog"
        aria-labelledby="api-flannel-title"
        id="api-flannel"
        className="flannel flannel-hidden">
        <header className="flannel-header">
          <h2 id="api-flannel-title" className="flannel-header-title">{I18n.api_flannel.title}</h2>
          <button
            aria-label={I18n.close}
            className="btn btn-transparent flannel-header-dismiss"
            data-flannel-dismiss>
            <span className="icon-close-2"></span>
          </button>
        </header>

        <section className="flannel-content api-description">
          <p className="small">{I18n.api_flannel.description}</p>
        </section>

        {this.renderEndpoint()}
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
        name: 'Copied API Link'
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ApiFlannel);
