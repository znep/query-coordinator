import _ from 'lodash';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { initClipboardControl, isCopyingSupported } from '../lib/clipboardControl';
import { handleKeyPress } from '../lib/a11yHelpers';
import { UID_REGEX } from '../lib/constants';

export const ApiFlannel = React.createClass({
  propTypes: {
    onClickCopy: PropTypes.func.isRequired,
    view: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      resourceType: this.props.view.resourceName ? 'name' : 'canonical'
    };
  },

  componentDidMount() {
    if (isCopyingSupported) {
      const el = ReactDOM.findDOMNode(this);
      initClipboardControl(el.querySelectorAll('.btn.copy'));
    }
  },

  onFocusInput(event) {
    event.target.select();
  },

  onMouseUpInput(event) {
    event.preventDefault();
  },

  getResourceTypes() {
    const { view } = this.props;
    const resourceTypes = {};

    resourceTypes.canonical = {
      label: I18n.api_flannel.canonical,
      url: view.resourceUrl
    };

    if (!_.isEmpty(view.resourceName)) {
      resourceTypes.name = {
        label: I18n.api_flannel.name,
        url: view.resourceUrl.replace(UID_REGEX, view.resourceName)
      };
    }

    return resourceTypes;
  },

  renderResourceToggle() {
    const { resourceType } = this.state;
    const resourceTypes = this.getResourceTypes();

    if (_.size(resourceTypes) < 2) {
      return null;
    }

    const setResourceType = (newResourceType) => {
      return () => {
        this.setState({ resourceType: newResourceType });
      };
    };

    const dropdownOptions = _.map(resourceTypes, (type, key) => {
      return (
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
      );
    });

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
          <ul role="menu" aria-label={I18n.api_flannel.resource_type} className="dropdown-options">
            {dropdownOptions}
          </ul>
        </div>
      </span>
    );
  },

  renderEndpoint() {
    const { view, onClickCopy } = this.props;
    const { resourceType } = this.state;
    const resourceTypes = this.getResourceTypes();

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
  },

  render() {
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
    onClickCopy() {
      const payload = {
        name: 'Copied API Link'
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ApiFlannel);
