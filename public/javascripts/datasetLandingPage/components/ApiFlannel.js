import _ from 'lodash';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions';
import initClipboardControl from '../lib/clipboardControl';

export var ApiFlannel = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired
  },

  getInitialState: function() {
    var formats = _.chain(this.props.view).
      concat(this.props.view.geospatialChildLayers).
      indexBy('id').
      mapValues(_.constant('json')).
      value();

    return {
      currentFormats: formats
    };
  },

  componentDidMount: function() {
    var el = ReactDOM.findDOMNode(this);
    initClipboardControl(el.querySelectorAll('.btn.copy'));
  },

  onFocusInput: function(event) {
    event.target.select();
  },

  onMouseUpInput: function(event) {
    event.preventDefault();
  },

  onClickFormatOption: function(viewId) {
    return function(event) {
      var formats = this.state.currentFormats;
      formats[viewId] = event.target.dataset.value;

      this.setState({
        currentFormats: formats
      });
    }.bind(this);
  },

  render: function() {
    var self = this;
    var { view, onClickCopy } = this.props;
    var { currentFormats } = this.state;

    var multiGeoLayerNotice = view.geospatialChildLayers.length > 1 ?
      <span>{I18n.api_flannel.multiple_geo_layers}</span> : null;

    function renderEndpoint(subview, showAsLayer, i) {
      var endpointFormatSelector = null;

      var formatToggleHandler = self.onClickFormatOption(subview.id);

      if (subview.isGeospatial) {
        endpointFormatSelector = (
          <span className="input-group-btn">
            <div className="btn btn-default btn-simple btn-sm dropdown endpoint-format-selector" data-dropdown data-selectable data-orientation="bottom">
              <span>JSON</span><span className="icon-arrow-down"></span>
              <ul className="dropdown-options">
                <li><a className="option" data-value="json" onMouseUp={formatToggleHandler}>JSON</a></li>
                <li><a className="option" data-value="geojson" onMouseUp={formatToggleHandler}>GeoJSON</a></li>
              </ul>
            </div>
          </span>
        );
      }

      var currentFormat = currentFormats[subview.id];
      var currentUrl = subview.resourceUrl.replace(/\w*json$/, currentFormat);

      return (
        <div className="endpoint api-endpoint" key={i}>
          <section className="flannel-content">
            {showAsLayer ? <h6 className="layer-name">{subview.name}</h6> : null}
            <a className="btn btn-default btn-sm documentation-link" href={subview.apiFoundryUrl} target="_blank">
              <span className="icon-copy-document"></span>
              {I18n.api_flannel.foundry_button}
            </a>
            <a className="btn btn-default btn-sm documentation-link" href="https://dev.socrata.com" target="_blank">
              <span className="icon-settings"></span>
              {I18n.api_flannel.developer_portal_button}
            </a>
          </section>
          <section className="flannel-content">
            <h6 className="endpoint-title">{I18n.api_flannel.endpoint_title}</h6>
            <form>
              <span className="input-group">
                <input className="endpoint-input text-input text-input-sm" type="text" value={currentUrl} readOnly onFocus={self.onFocusInput} onMouseUp={self.onMouseUpInput}/>
                {endpointFormatSelector}
                <span className="input-group-btn">
                  <button type="button" className="btn btn-primary btn-sm copy" data-confirmation={I18n.copy_success} onClick={onClickCopy}>
                    {I18n.copy}
                  </button>
                </span>
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
      endpoints = renderEndpoint(view.geospatialChildLayers[0], false);
    } else {
      endpoints = renderEndpoint(view, false);
    }

    return (
      <div id="api-flannel" className="flannel flannel-hidden">
        <header className="flannel-header">
          <h4 className="flannel-header-title">{I18n.api_flannel.title}</h4>
          <button className="btn btn-transparent flannel-header-dismiss" data-flannel-dismiss>
            <span className="icon-close-2"></span>
          </button>
        </header>
        <section className="flannel-content api-description">
          <p className="small">{I18n.api_flannel.description}</p>
          {multiGeoLayerNotice}
        </section>

        {endpoints}
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
