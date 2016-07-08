import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import FeaturedItemWidget from './FeaturedItemWidget';
import { isUserAdminOrPublisher } from '../lib/user';

export var FeaturedContent = React.createClass({
  propTypes: {
    contentList: PropTypes.array.isRequired
  },

  focusModal: function() {
    var featuredContentModal = document.querySelector('#featured-content-modal');
    if (featuredContentModal) {
      featuredContentModal.focus();
    }
  },

  renderManagePrompt: function() {
    if (!isUserAdminOrPublisher()) {
      return null;
    }

    return (
      <div className="alert default manage-prompt">
        <span className="manage-prompt-message">
          {I18n.featured_content.manage_prompt.message}
        </span>

        <button
          className="btn btn-sm btn-default manage-prompt-button"
          data-modal="featured-content-modal"
          onClick={this.focusModal}>
          {I18n.featured_content.manage_prompt.button}
        </button>
      </div>
    );
  },

  renderFeaturedContent: function() {
    var { contentList } = this.props;

    var widgets = _.map(_.compact(contentList), (featuredItem, i) =>
      <FeaturedItemWidget key={i} {...featuredItem} />
    );

    return <div className="media-results">{widgets}</div>;
  },

  render: function() {
    var { contentList } = this.props;
    var { defaultToDatasetLandingPage } = window.serverConfig.featureFlags;

    if (!defaultToDatasetLandingPage || (!_.some(contentList) && !isUserAdminOrPublisher())) {
      return null;
    }

    return (
      <section className="landing-page-section featured-content">
        <h2 className="landing-page-section-header">
          {I18n.featured_content.title}
        </h2>

        {this.renderManagePrompt()}
        {this.renderFeaturedContent()}
      </section>
    );
  }
});

function mapStateToProps(state) {
  return _.pick(state.featuredContent, 'contentList');
}

export default connect(mapStateToProps)(FeaturedContent);
