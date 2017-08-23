import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { initClipboardControl, isCopyingSupported } from '../lib/clipboardControl';
import { handleKeyPress } from '../../common/a11yHelpers';

export class ApiModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      resourceType: this.props.view.namedResourceUrl ? 'name' : 'canonical'
    };

    _.bindAll(this,
      'onFocusInput',
      'onMouseUpInput'
    );
  }

  componentDidMount() {
    if (isCopyingSupported) {
      const el = ReactDOM.findDOMNode(this);
      initClipboardControl(el.querySelectorAll('.btn.copy'));
    }
  }

  onFocusInput(event) {
    event.target.select();
  }

  onMouseUpInput(event) {
    event.preventDefault();
  }

  onSubmit(event) {
    event.preventDefault();
  }

  getResourceTypes() {
    const { view } = this.props;
    const resourceTypes = {};

    resourceTypes.canonical = {
      label: I18n.api_modal.json,
      url: view.resourceUrl
    };

    if (!_.isEmpty(view.namedResourceUrl)) {
      resourceTypes.name = {
        label: I18n.api_modal.name,
        url: view.namedResourceUrl
      };
    }

    if (view.geoJsonResourceUrl) {
      resourceTypes.geoJson = {
        label: I18n.api_modal.geojson,
        url: view.geoJsonResourceUrl
      };
    }

    resourceTypes.csv = {
      label: I18n.api_modal.csv,
      url: view.csvResourceUrl
    };

    return resourceTypes;
  }

  renderResourceToggle() {
    const { resourceType } = this.state;
    const resourceTypes = this.getResourceTypes();

    const setResourceType = (newResourceType) => (
      () => {
        this.setState({ resourceType: newResourceType });
      }
    );

    const dropdownOptions = _.map(resourceTypes, (type, key) => (
      <li key={key}>
        {/* These links have empty hrefs so browsers let you tab to them */}
        <a
          role="menuitem"
          href=""
          className="option"
          onMouseUp={setResourceType(key)}
          onKeyDown={handleKeyPress(setResourceType(key))}>
          {type.label}
        </a>
      </li>
    ));

    return (
      <span className="input-group-btn">
        <div
          className="dropdown btn btn-sm btn-default resource-toggle"
          data-orientation="bottom"
          data-selectable
          data-dropdown
          tabIndex="0">
          <span aria-hidden>{resourceTypes[resourceType].label}</span>
          <span className="socrata-icon-arrow-down" role="presentation" />
          <ul role="menu" aria-label={I18n.api_modal.resource_type} className="dropdown-options">
            {dropdownOptions}
          </ul>
        </div>
      </span>
    );
  }

  renderEndpoint() {
    const { view, onClickCopy } = this.props;
    const { resourceType } = this.state;
    const enableDatasetLandingPageFoundryLinks =
      serverConfig.featureFlags.enable_dataset_landing_page_foundry_links;
    const resourceTypes = this.getResourceTypes();
    let foundryLinks = null;

    if (enableDatasetLandingPageFoundryLinks) {
      foundryLinks = (
        <section className="modal-content">
          <a
            className="btn btn-default btn-sm documentation-link"
            href={view.apiFoundryUrl}
            target="_blank">
            <span className="icon-copy-document"></span>
            {I18n.api_modal.foundry_button}
          </a>
          <a
            className="btn btn-default btn-sm documentation-link"
            href="https://dev.socrata.com"
            target="_blank">
            <span className="icon-settings"></span>
            {I18n.api_modal.developer_portal_button}
          </a>
        </section>
      );
    }

    // TODO: copyButton code is identical with ODataModal. Maybe should have a CopyButton component.
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
      <div className="endpoint api-endpoint">
        {foundryLinks}

        <section className="modal-content">
          <h6 id="api-endpoint" className="endpoint-title">
            {I18n.api_modal.endpoint_title}
          </h6>
          <form onSubmit={this.onSubmit}>
            <span className="input-group">
              <input
                aria-labelledby="api-endpoint"
                className="endpoint-input text-input text-input-sm"
                type="text"
                value={resourceTypes[resourceType].url}
                readOnly
                onFocus={this.onFocusInput}
                onMouseUp={this.onMouseUpInput} />
              {this.renderResourceToggle()}
              {copyButton}
            </span>
          </form>
        </section>
      </div>
    );
  }

  render() {
    return (
      <div id="api-modal" className="modal modal-overlay modal-hidden"
        aria-labelledby="api-modal-title"
        data-modal-dismiss>
        <div className="modal-container">
          <header className="modal-header">
            <h2 id="api-modal-title" className="modal-header-title">{I18n.api_modal.title}</h2>
            <button
              aria-label={I18n.close}
              className="btn btn-transparent modal-header-dismiss"
              data-modal-dismiss>
              <span className="icon-close-2"></span>
            </button>
          </header>

          <section className="modal-content api-description">
            <p className="small">{I18n.api_modal.description}</p>
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

ApiModal.propTypes = {
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
        name: 'Copied API Link'
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ApiModal);
