import utils from 'socrata-utils';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { getIconClassForDisplayType } from '../lib/displayTypeMetadata';
import formatDate from '../lib/formatDate';

var ViewWidget = React.createClass({
  propTypes: {
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    description: PropTypes.string,
    displayType: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    isPrivate: PropTypes.bool,
    updatedAt: PropTypes.string.isRequired,
    viewCount: PropTypes.number.isRequired,
    onClick: PropTypes.func
  },

  componentDidMount: function() {
    var $el = $(ReactDOM.findDOMNode(this));

    var titleLineHeight = 24;
    var descriptionLineHeight = 19;
    var descriptionPadding = 8;

    // Collapse title to 2 lines.
    $el.find('.entry-title').dotdotdot({
      height: 2 * titleLineHeight
    });

    // Collapse description to 3 lines.
    $el.find('.entry-description').dotdotdot({
      height: 3 * descriptionLineHeight + 2 * descriptionPadding
    });
  },

  render: function() {
    var { name, id, description, url, displayType, updatedAt, viewCount } = this.props;

    var icon = getIconClassForDisplayType(displayType);

    var privateIcon = this.props.isPrivate ?
      <span className="icon icon-private" /> : null;

    var ariaLabel = `${I18n.popular_views.view} ${name}`;

    return (
      <div className="result-card media" data-id={id} data-type={displayType}>
        <div className="entry-header">
          <div className="entry-title">
            <h3 className="entry-name">
              {privateIcon}
              <a href={url} aria-label={ariaLabel} onClick={this.props.onClick}>
                {name}
              </a>
            </h3>
          </div>
          <div aria-hidden className="entry-view-type">
            <span className={icon} />
          </div>
        </div>
        <div className="entry-meta">
          <div className="first">
            <span className="date">{formatDate(updatedAt)}</span>
          </div>
          <div className="second">
            <span className="date">{utils.formatNumber(viewCount)} views</span>
          </div>
        </div>
        <div className="entry-content">
          <div className="entry-main">
            <a href={url} aria-label={ariaLabel} onClick={this.props.onClick}>
              <div className="img-wrapper">
                <span className={`${icon} x-large-icon`}></span>
              </div>
            </a>
            <div className="entry-description" dangerouslySetInnerHTML={{ __html: description }} />
          </div>
        </div>
      </div>
    );
  }
});

export default ViewWidget;
