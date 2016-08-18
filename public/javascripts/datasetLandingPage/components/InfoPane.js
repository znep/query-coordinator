import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import DownloadDropdown from './DownloadDropdown';
import collapsible from '../collapsible';
import formatDate from '../lib/formatDate';
import { emitMixpanelEvent } from '../actions/mixpanel';

export var InfoPane = React.createClass({
  propTypes: {
    onClickGrid: PropTypes.func.isRequired,
    onDownloadData: PropTypes.func.isRequired,
    onExpandDescription: PropTypes.func.isRequired,
    view: PropTypes.object.isRequired
  },

  componentDidMount: function() {
    var metadataHeight = this.metadataPane.getBoundingClientRect().height;
    var descriptionHeight = this.description.getBoundingClientRect().height;
    var descriptionLineHeight = 24;
    var descriptionPadding = 11;

    if (descriptionHeight < metadataHeight) {
      this.description.style.height = `${metadataHeight}px`;
    }

    collapsible(this.description, {
      height: 4 * descriptionLineHeight + 2 * descriptionPadding,
      expandedCallback: this.props.onExpandDescription
    });
  },

  renderMoreActions: function() {
    var { view } = this.props;

    var contactFormLink = (
      <li>
        <a tabIndex="0" role="button" className="option" data-modal="contact-form">
          {I18n.action_buttons.contact_owner}
        </a>
      </li>
    );

    var commentLink = (
      <li>
        <a className="option" href={`${view.gridUrl}?pane=feed`}>
          {I18n.action_buttons.comment}
        </a>
      </li>
    );

    var odataLink = view.isBlobby ? null : (
      <li>
        <a tabIndex="0" role="button" className="option" data-modal="odata-modal">
          {I18n.action_buttons.odata}
        </a>
      </li>
    );

    return (
      <div className="btn btn-simple btn-sm dropdown more" data-dropdown data-orientation="bottom">
        <span aria-hidden className="icon-waiting"></span>
        <ul className="dropdown-options">
          {contactFormLink}
          {commentLink}
          {odataLink}
        </ul>
      </div>
    );
  },

  render: function() {
    var { view, onClickGrid, onDownloadData } = this.props;

    var privateIcon;
    var viewDataButton;
    var categoryBadge;
    var manageButton;
    var downloadDropdown;
    var apiButton;
    var shareButton;
    var attributionInfo;

    privateIcon = view.isPrivate ?
      <span
        className="icon-private"
        aria-label={I18n.private_notice}
        title={I18n.private_notice} /> : null;

    categoryBadge = view.category ?
      <span className="tag-category">{_.upperFirst(view.category)}</span> : null;

    viewDataButton = view.isBlobby ? null : (
      <a
        href={view.gridUrl}
        id="tour-anchor"
        className="btn btn-simple btn-sm unstyled-link grid"
        onClick={onClickGrid}
        target="_blank">
        {I18n.action_buttons.data}
        <span className="icon-external" />
      </a>
    );

    manageButton = view.isBlobby ?
      <a
        href={`${view.gridUrl}?pane=manage`}
        className="btn btn-simple btn-sm unstyled-link manage"
        target="_blank">
        {I18n.manage_dataset}
      </a> :
      null;

    downloadDropdown = <DownloadDropdown view={view} onDownloadData={onDownloadData} />;

    apiButton = view.isBlobby ? null : (
      <button className="btn btn-simple btn-sm api" data-flannel="api-flannel" data-toggle>
        {I18n.action_buttons.api}
      </button>
    );

    shareButton = (
      <button className="btn btn-simple btn-sm share" data-modal="share-modal">
        {I18n.action_buttons.share}
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

    return (
      <div className="info-pane result-card">
        <div className="container">
          <div className="entry-header dataset-landing-page-header">
            <div className="entry-title">
              <h1 className="info-pane-name">
                {privateIcon}
                {view.name}
              </h1>

              <span className="tag-official">
                <span aria-hidden className="icon-official"></span>
                {I18n.official}
              </span>

              {categoryBadge}
            </div>

            <div className="entry-actions">
              <div className="btn-group">
                {viewDataButton}
                {manageButton}
                {downloadDropdown}
                {apiButton}
                {shareButton}
                {this.renderMoreActions()}
              </div>
            </div>
          </div>

          <div className="entry-content">
            <div className="entry-main">
              <div className="entry-description-container collapsible">
                <div className="entry-description" ref={(ref) => this.description = ref}>
                  {view.description}

                  <button className="collapse-toggle more">{I18n.more}</button>
                  <button className="collapse-toggle less">{I18n.less}</button>
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

    onDownloadData: function(event) {
      var payload = {
        name: 'Downloaded Data',
        properties: {
          'Type': event.target.dataset.type
        }
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
