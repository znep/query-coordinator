import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import FeaturedItemWidget from './FeaturedItemWidget';
import { isUserAdminOrPublisher } from '../lib/user';

export var FeaturedContent = React.createClass({
  propTypes: {
    contentList: PropTypes.array.isRequired,
    isBlobby: PropTypes.bool
  },

  renderManagePrompt: function() {
    var { isBlobby } = this.props;

    if (!isUserAdminOrPublisher()) {
      return null;
    }

    var message = I18n.featured_content.manage_prompt[isBlobby ? 'message_blob' : 'message'];

    return (
      <div className="alert default manage-prompt">
        <span className="manage-prompt-message">
          {message}
        </span>

        <button
          className="btn btn-sm btn-default manage-prompt-button"
          data-modal="featured-content-modal">
          {I18n.featured_content.manage_prompt.button}
        </button>
      </div>
    );
  },

  renderFeaturedContent: function() {
    var { contentList } = this.props;

    if (_.every(contentList, _.isNull)) {
      return null;
    }

    var widgets = _.map(_.compact(contentList), (featuredItem, i) =>
      <FeaturedItemWidget key={i} {...featuredItem} />
    );

    return <div className="media-results">{widgets}</div>;
  },

  render: function() {
    var { contentList } = this.props;

    if (!_.some(contentList) && !isUserAdminOrPublisher()) {
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
  return {
    isBlobby: state.view.isBlobby,
    contentList: state.featuredContent.contentList
  };
}

export default connect(mapStateToProps)(FeaturedContent);
