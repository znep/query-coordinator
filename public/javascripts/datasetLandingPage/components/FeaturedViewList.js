import _ from 'lodash';
import React, { PropTypes } from 'react';
import FeaturedView from './FeaturedView';

export var FeaturedViewList = React.createClass({
  propTypes: {
    featuredViews: PropTypes.arrayOf(PropTypes.object).isRequired
  },

  render: function() {
    var props = this.props;

    var featuredViews;
    if (_.isEmpty(props.featuredViews)) {
      var message = I18n.featured_views.no_content_alert_html;
      featuredViews = <div className="alert default" dangerouslySetInnerHTML={{__html: message}}/>;
    } else {
      featuredViews = _.map(props.featuredViews, function(featuredView, i) {
        return <FeaturedView key={i} {...featuredView}/>;
      });
    }

    return (
      <section className="landing-page-section metadata">
        <h2 className="dataset-landing-page-header">
          {I18n.featured_views.title}
        </h2>

        <div className="media-results">
          {featuredViews}
        </div>
      </section>
    );
  }
});

export default FeaturedViewList;
