import React, { PropTypes } from 'react';

var FeaturedContent = React.createClass({
  propTypes: {
    contentList: PropTypes.array.isRequired
  },

  renderManagePrompt: function() {
    var { currentUser } = serverConfig;

    if (!currentUser) {
      return;
    }

    return (
      <div className="alert default manage-prompt">
        <span className="manage-prompt-message">
          {I18n.featured_content.manage_prompt.message}
        </span>

        <button
          className="btn btn-sm btn-default manage-prompt-button"
          data-modal="featured-content-modal">
          {I18n.featured_content.manage_prompt.button}
        </button>
      </div>
    );
  },

  render: function() {
    var { contentList } = this.props;
    var { currentUser } = serverConfig;

    if (!serverConfig.featureFlags.defaultToDatasetLandingPage) {
      return null;
    }

    if (!_.any(contentList) && !currentUser) {
      return null;
    }

    return (
      <section className="landing-page-section featured-content">
        <h2 className="landing-page-section-header">
          {I18n.featured_content.title}
        </h2>

        {this.renderManagePrompt()}
      </section>
    );
  }
});

export default FeaturedContent;
