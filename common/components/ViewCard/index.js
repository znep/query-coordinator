import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import $ from 'jquery';
import 'dotdotdot';
import purify from 'common/purify';

/**
 * ViewCard
 * The ViewCard component renders a card used to present information about an asset (dataset, chart,
 * map, Data Lens page, etc.). It is composed of four sections stacked vertically:
 *   - The title bar, meant to contain a clickable link to the view, an icon representing the type
 *     of the asset, and a padlock icon if the view is private.
 *   - The metadata row, displaying the day at which the view was last updated and the number of
 *     times it has been viewed.
 *   - An image, typically a preview of the view.
 *   - A description.
 * The title and description are automatically ellipsified using dotdotdot. Buttons, spinners, or
 * other elements may be rendered as an overlay centered over the main content by specifying them
 * as children of the component.
 */
class ViewCard extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'shouldEllipsify',
      'ellipsify',
      'renderOverlay'
    ]);
  }

  componentDidMount() {
    this.$name = $(this.name);
    this.$description = $(this.description);
    this.ellipsify();
  }

  componentWillUpdate(newProps) {
    if (this.shouldEllipsify(this.props, newProps)) {
      this.$name.trigger('destroy.dot');
      this.$description.trigger('destroy.dot');
    }
  }

  componentDidUpdate(prevProps) {
    if (this.shouldEllipsify(prevProps, this.props)) {
      this.ellipsify();
    }
  }

  shouldEllipsify(prevProps, newProps) {
    return prevProps.name !== newProps.name || prevProps.description !== newProps.description;
  }

  ellipsify() {
    this.$name.dotdotdot({ height: 50, watch: true });
    this.$description.dotdotdot({ height: 75, watch: true });
  }

  renderOverlay() {
    if (React.Children.count(this.props.children) > 0) {
      return (
        <div className="view-card-overlay">
          {this.props.children}
        </div>
      );
    }
  }

  render() {
    var {
      description,
      icon,
      imageUrl,
      isPrivate,
      linkProps,
      metadataLeft,
      metadataRight,
      name,
      onClick,
      url
    } = this.props;

    const privateIcon = isPrivate ?
      <span className="icon socrata-icon-private" /> : null;

    const previewImageStyling = { backgroundImage: `url(${imageUrl})` };
    const image = _.isString(imageUrl) && !_.isEmpty(imageUrl) ?
      (
        <div className="preview-image" style={previewImageStyling} title={name}>
          <span className="aria-not-displayed">Preview image</span>
        </div>
      ) : <span className={`${icon} x-large-icon`}></span>;

    return (
      <div className="result-card media view-card">
        <div className="entry-header">
          <div className="entry-title">
            <h3 className="entry-name">
              {privateIcon}
              <a {...linkProps} href={url} onClick={onClick} ref={el => this.name = el}>
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
            <span className="date">{metadataLeft}</span>
          </div>
          <div className="second">
            <span className="date">{metadataRight}</span>
          </div>
        </div>

        <div className="entry-content">
          <div className="entry-main">
            <a {...linkProps} href={url} onClick={onClick}>
              <div className="img-wrapper">
                {image}
              </div>
            </a>
            <div className="entry-description" ref={el => this.description = el}>
              <div dangerouslySetInnerHTML={{ __html: purify(description) }} />
            </div>
          </div>
        </div>

        {this.renderOverlay()}
      </div>
    );
  }
}

ViewCard.propTypes = {
  /**
   * The children of a ViewCard are rendered as an overlay centered on top of the main content.
   * This is typically used to render buttons in the context of an asset selector, but could also
   * be used for a loading spinner. Render the component without children to avoid rendering the
   * overlay.
   */
  children: PropTypes.node,

  /**
   * The description prop renders a description in the lower area of the ViewCard. The description
   * will automatically be ellipsified using dotdotdot if it is longer than 3 lines of text.  If
   * this prop is omitted, the description area will render blank.
   */
  description: PropTypes.string,

  /**
   * The icon prop specifies an icon that will be rendered in the upper-left corner of the
   * element.  A large version of the icon will also be used as a fallback if the imageUrl prop
   * is not specified.  For a list of icons, see
   * http://socrata.github.io/styleguide/elements.html#icons.
   */
  icon: PropTypes.string,

  /**
   * The imageUrl prop specifies the URL of an image that will be rendered in the center of the
   * card using an <img> tag. The contents of the alt tag of the image will be the name prop. The
   * image will take up the full width of the ViewCard and will be centered vertically inside the
   * available area.
   */
  imageUrl: PropTypes.string,

  /**
   * If the isPrivate prop is set to true, a yellow private icon will be rendered to the left of
   * the ViewCard's title.
   */
  isPrivate: PropTypes.bool,

  /**
   * The linkProps prop, if specified, should contain an object of attributes that will be merged
   * into the anchor tag that surrounds both the header and the image.  A common use case is
   * applying the target="_blank" attribute to open the link to the view in a new tab.
   */
  linkProps: PropTypes.object,

  /**
   * The metadataLeft prop is a piece of text that will be rendered on the left side of the
   * metadata row.
   */
  metadataLeft: PropTypes.string,

  /**
   * The metadataRight prop is a piece of text that will be rendered on the right side of the
   * metadata row.
   */
  metadataRight: PropTypes.string,

  /**
   * The name prop contains the string that will be rendered at the top of the card. It is
   * rendered as a header and links to the url prop. The header is ellipsified using
   * dotdotdot if it exceeds two lines in length.
   */
  name: PropTypes.string,

  /**
   * The onClick prop is a handler called when either the title or image are clicked. It is passed
   * the raw pooled event instance from React.
   */
  onClick: PropTypes.func,

  /**
   * The url prop contains a link to the view. It may be specified as either an absolute URL or a
   * relative URL.
   */
  url: PropTypes.string
};

export default ViewCard;
