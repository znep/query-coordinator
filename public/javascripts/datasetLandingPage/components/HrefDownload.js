import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { isUserAdminOrPublisher } from '../lib/user';

export var HrefDownload = React.createClass({
  propTypes: {
    view: PropTypes.object.isRequired
  },

  renderManagePrompt() {
    var { view } = this.props;

    if (!isUserAdminOrPublisher()) {
      return null;
    }

    return (
      <div className="alert default edit-prompt">
        <span className="edit-prompt-message">
          {I18n.href_download.edit_prompt_message}
        </span>

        <a href={view.editMetadataUrl} className="btn btn-sm btn-default edit-prompt-button">
          {I18n.href_download.edit_prompt_button}
        </a>
      </div>
    );
  },

  renderContent() {
    var { allAccessPoints } = this.props.view;

    if (_.isEmpty(allAccessPoints)) {
      return;
    }

    var content = _.map(allAccessPoints, (accessPoint, i) => {
      var buttons = _.map(accessPoint.urls, (url, mimeType) =>
        <a
          className="btn btn-primary btn-sm download all-caps"
          href={url}
          target="_blank"
          key={mimeType}>
          {mimeType}
        </a>
      );

      if (accessPoint.describedBy) {
        buttons.push(
          <a
            key="data-dictionary"
            className="btn btn-simple btn-sm download"
            href={accessPoint.describedBy}
            target="_blank">
            {I18n.href_download.data_dictionary}
          </a>
        );
      }

      return (
        <div key={i} className="download-object">
          <div className="download-title">
            {accessPoint.title}
          </div>

          <p className="download-description">
            {accessPoint.description}
          </p>

          <div className="download-buttons">
            {buttons}
          </div>
        </div>
      );
    });

    return (
      <div className="section-content">
        {content}
      </div>
    );
  },

  render() {
    var { view } = this.props;
    var { isHref } = view;

    if (!isHref) {
      return null;
    }

    return (
      <section className="landing-page-section href-download download-section">
        <h2 className="landing-page-section-header">
          {I18n.href_download.title}
        </h2>

        {this.renderManagePrompt()}
        {this.renderContent()}
      </section>
    );
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(HrefDownload);
