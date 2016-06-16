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

  render: function() {
    var { view, onClickCopy } = this.props;

    var multipleGeoLayerNotice = view.geospatialChildLayers.length > 1 ?
      <p className="small">{I18n.odata_modal.multiple_geo_layers}</p> : null;

    function renderEndpoint(subview, showAsLayer, i) {
      var title;

      if (showAsLayer) {
        title = (
          <h6 id={`odata-endpoint-${i}`} className="layer-name">
            {subview.name} {I18n.odata_modal.endpoint_title}
          </h6>
        );
      } else {
        title = (
          <h6 id={`odata-endpoint-${i}`} className="endpoint-title">
            {I18n.odata_modal.endpoint_title}
          </h6>
        );
      }

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
        <div className="endpoint odata-endpoint" key={i}>
          <section className="modal-content">
            {title}
            <form>
              <span className="input-group">
                <input
                  aria-labelledby={`odata-endpoint-${i}`}
                  className="endpoint-input text-input text-input-sm"
                  type="text"
                  value={subview.odataUrl}
                  readOnly />
                {copyButton}
              </span>
            </form>
          </section>
        </div>
      );
    }

    var endpoints;
    if (view.geospatialChildLayers.length > 1) {
      endpoints = view.geospatialChildLayers.map(_.partial(renderEndpoint, _, true, _));
    } else if (view.geospatialChildLayers.length === 1) {
      endpoints = renderEndpoint(view.geospatialChildLayers[0], false, 0);
    } else {
      endpoints = renderEndpoint(view, false, 0);
    }

    return (
      <div id="odata-modal" className="modal modal-overlay modal-hidden" data-modal-dismiss>
        <div className="modal-container">
          <header className="modal-header">
            <h5 className="h5 modal-header-title">{I18n.odata_modal.title}</h5>
            <button
              aria-label={I18n.close}
              className="btn btn-transparent modal-header-dismiss"
              data-modal-dismiss>
              <span className="icon-close-2"></span>
            </button>
          </header>
          <section className="modal-content odata-description">
            <p className="small">{I18n.odata_modal.description}</p>
            {multipleGeoLayerNotice}
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

          {endpoints}

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
