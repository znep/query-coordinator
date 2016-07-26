import utils from 'socrata-utils';
import React, { PropTypes } from 'react';
import MultilineEllipsis from 'react-dotdotdot';
import { getIconClassForDisplayType } from '../lib/displayTypeMetadata';
import formatDate from '../lib/formatDate';
import purify from '../lib/purify';

var ViewWidget = React.createClass({
  propTypes: {
    children: PropTypes.node,
    description: PropTypes.string,
    displayType: PropTypes.string,
    id: PropTypes.string,
    imageUrl: PropTypes.string,
    isExternal: PropTypes.bool,
    isPrivate: PropTypes.bool,
    name: PropTypes.string,
    onClick: PropTypes.func,
    updatedAt: PropTypes.string,
    url: PropTypes.string,
    viewCount: PropTypes.number
  },

  renderOverlay: function() {
    if (React.Children.count(this.props.children) > 0) {
      return (
        <div className="view-widget-overlay">
          {this.props.children}
        </div>
      );
    }
  },

  render: function() {
    var {
      name,
      id,
      imageUrl,
      isExternal,
      description,
      url,
      displayType,
      updatedAt,
      viewCount,
      isPrivate
    } = this.props;

    var icon = getIconClassForDisplayType(displayType);
    var metadataRow;
    var linkProps;

    if (isExternal) {
      icon = 'icon-external-square';

      metadataRow = (
        <div className="entry-meta">
          <span className="date">{I18n.view_widget.external_content}</span>
        </div>
      );

      linkProps = {
        target: '_blank',
        rel: 'nofollow external'
      };
    } else {
      var viewCountLabel = viewCount ?
        `${utils.formatNumber(viewCount)} ${I18n.view_widget.views}` :
          null;
      var updatedAtLabel = updatedAt ? formatDate(updatedAt) : null;

      metadataRow = (
        <div className="entry-meta">
          <div className="first">
            <span className="date">{updatedAtLabel}</span>
          </div>
          <div className="second">
            <span className="date">{viewCountLabel}</span>
          </div>
        </div>
      );

      linkProps = {};
    }

    var privateIcon = isPrivate ?
      <span className="icon icon-private" /> : null;

    var showPreviewImage = isExternal ||
      window.serverConfig.featureFlags.displayDatasetLandingPagePreviewImages;
    var image = _.isString(imageUrl) && !_.isEmpty(imageUrl) && showPreviewImage ?
      <img src={imageUrl} alt={name} /> :
      <span className={`${icon} x-large-icon`}></span>;

    var ariaLabel = `${I18n.related_views.view} ${name}`;

    return (
      <div className="result-card media view-widget" data-id={id} data-type={displayType}>
        <div className="entry-header">
          <div className="entry-title">
            <h3 className="entry-name">
              {privateIcon}
              <a {...linkProps} href={url} aria-label={ariaLabel} onClick={this.props.onClick}>
                <MultilineEllipsis clamp={2} ellipsis="...">
                  {name}
                </MultilineEllipsis>
              </a>
            </h3>
          </div>
          <div aria-hidden className="entry-view-type">
            <span className={icon} />
          </div>
        </div>

        {metadataRow}

        <div className="entry-content">
          <div className="entry-main">
            <a {...linkProps} href={url} aria-label={ariaLabel} onClick={this.props.onClick}>
              <div className="img-wrapper">
                {image}
              </div>
            </a>
            <div className="entry-description">
              <MultilineEllipsis clamp={3} ellipsis="...">
                <div dangerouslySetInnerHTML={{ __html: purify(description) }} />
              </MultilineEllipsis>
            </div>
          </div>
        </div>

        {this.renderOverlay()}
      </div>
    );
  }
});

export default ViewWidget;
