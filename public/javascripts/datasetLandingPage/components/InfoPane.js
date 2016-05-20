import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import DownloadDropdown from './DownloadDropdown';
import collapsible from '../collapsible';
import formatDate from '../lib/formatDate';
import { emitMixpanelEvent } from '../actions';

var contactFormData = window.contactFormData;

export var InfoPane = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired
  },

  componentDidMount: function() {
    var metadataHeight = this.metadataPane.getBoundingClientRect().height;
    var descriptionHeight = this.description.getBoundingClientRect().height;

    if (descriptionHeight < metadataHeight) {
      this.setState({
        descriptionHeight: metadataHeight
      });
    }

    collapsible(this.description, {
      height: 4 * 24 + 2 * 11,
      expandedCallback: this.props.onExpandDescription
    });
  },

  getInitialState: function() {
    return {
      descriptionHeight: null
    };
  },

  render: function() {
    var { view, onClickGrid } = this.props;
    var { descriptionHeight } = this.state;

    var privateIcon;
    var viewDataButton;
    var categoryBadge;
    var downloadDropdown;
    var apiButton;
    var shareButton;
    var moreActions;
    var attributionInfo;
    var descriptionStyle;

    privateIcon = view.isPrivate ?
      <span className="icon-private" title="Private Dataset" /> : null;

    categoryBadge = view.category ?
      <span className="tag-category">{_.capitalize(view.category)}</span> : null;

    viewDataButton = (
      <a href={view.gridUrl} className="btn btn-default btn-sm grid" onClick={onClickGrid}>
        {I18n.action_buttons.data}
      </a>
    );

    downloadDropdown = <DownloadDropdown view={view} />;

    apiButton = (
      <button className="btn btn-default btn-sm api" data-flannel="api-flannel" data-toggle>
        {I18n.action_buttons.api}
      </button>
    );

    shareButton = (
      <button className="btn btn-default btn-sm share" data-modal="share-modal">
        {I18n.action_buttons.share}
      </button>
    );

    // TODO: Remove this feature flag check once we've verified recaptcha 2.0 works as expected
    var contactFormButton = contactFormData.contactFormEnabled ?
      <li><a className="option" data-modal="contact-modal">{I18n.action_buttons.contact_owner}</a></li> :
      null;

    moreActions = (
      <button className="btn btn-default btn-sm dropdown more" data-dropdown data-orientation="bottom">
        <span className="icon-waiting"></span>
        <ul className="dropdown-options">
          {contactFormButton}
          <li><a className="option" data-modal="odata-modal">{I18n.action_buttons.odata}</a></li>
        </ul>
      </button>
    );

    if (view.attribution) {
      attributionInfo = (
        <div className="entry-meta views">
          <span className="meta-title">{I18n.published_by}</span>
          {' '}
          <span className="attribution">{view.attribution}</span>
        </div>
      );
    }

    descriptionStyle = {
      height: descriptionHeight
    };

    return (
      <div className="info-pane result-card">
        <div className="container">
          <div className="entry-header">
            <div className="entry-title">
              <h1 className="info-pane-name">
                {privateIcon}
                {view.name}
              </h1>

              <span className="tag-official">
                <span className="icon-official"></span>
                {I18n.official}
              </span>

              {categoryBadge}
            </div>

            <div className="entry-actions">
              <div className="btn-group">
                {viewDataButton}
                {downloadDropdown}
                {apiButton}
                {shareButton}
                {moreActions}
              </div>
            </div>
          </div>

          <div className="entry-content">
            <div className="entry-main">
              <div className="entry-description-container collapsible">
                <div className="entry-description" ref={(ref) => this.description = ref} style={descriptionStyle}>
                  {view.description}

                  <a className="collapse-toggle more">{I18n.more}</a>
                  <a className="collapse-toggle less">{I18n.less}</a>
                </div>
              </div>
            </div>

            <div className="entry-meta second" ref={(ref) => this.metadataPane = ref}>
              <div className="entry-meta updated">
                <span className="meta-title">{I18n.updated}</span>
                {' '}
                <span className="date">{formatDate(view.lastUpdatedAt)}</span>
              </div>

              {attributionInfo}
            </div>
          </div>
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
    onClickGrid: function() {
      var payload = {
        name: 'Navigated to Gridpage'
      };

      dispatch(emitMixpanelEvent(payload));
    },

    onExpandDescription: function() {
      var payload = {
        name: 'Expanded Details',
        properties: {
          'Expanded Target': 'Descripton'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(InfoPane);
