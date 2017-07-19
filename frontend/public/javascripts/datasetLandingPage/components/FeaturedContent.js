import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import FeaturedViewCard from './FeaturedViewCard';
import { userHasRight } from '../../common/user';
import * as Rights from '../../common/rights';

export class FeaturedContent extends Component {
  renderManagePrompt() {
    const { isBlobby, isHref } = this.props;

    if (!userHasRight(Rights.edit_others_datasets)) {
      return null;
    }

    const translationKey = (isBlobby || isHref) ? 'message_external' : 'message';
    const message = I18n.featured_content.manage_prompt[translationKey];

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
  }

  renderFeaturedContent() {
    const { contentList } = this.props;

    if (_.every(contentList, _.isNull)) {
      return null;
    }

    const cards = _.map(_.compact(contentList), (featuredItem, i) =>
      <FeaturedViewCard key={i} featuredItem={featuredItem} />
    );

    return <div className="media-results">{cards}</div>;
  }

  render() {
    const { contentList } = this.props;

    if (!_.some(contentList) && !userHasRight(Rights.create_datasets)) {
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
}

FeaturedContent.propTypes = {
  contentList: PropTypes.array.isRequired,
  isBlobby: PropTypes.bool,
  isHref: PropTypes.bool
};

function mapStateToProps(state) {
  return {
    isBlobby: state.view.isBlobby,
    isHref: state.view.isHref,
    contentList: state.featuredContent.contentList
  };
}

export default connect(mapStateToProps)(FeaturedContent);
