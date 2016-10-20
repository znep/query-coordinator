import _ from 'lodash';
import React, { PropTypes } from 'react';
import collapsible from '../../common/collapsible';
import { translate as t } from '../../common/I18n';

/**
 * The InfoPane is a component that is designed to render a hero element with useful information
 * about a dataset.  The component prominently features the title of the asset, a description that
 * is automatically ellipsified, various badges indicating the privacy, provenance, and category
 * of the asset, several areas for custom metadata to be displayed, and an area meant to be used
 * for buttons.
 */
const InfoPane = React.createClass({
  propTypes: {

    /**
     * An optional string representing the category of the asset.
     */
    category: PropTypes.string,

    /**
     * A string containing the description of the asset.  It will be ellipsified using dotdotdot,
     * and will have a control for expanding and collapsing the full description.  HTML is allowed
     * in the description; it is important to sanitize this prop to prevent security
     * vulnerabilities.
     */
    description: PropTypes.string,

    /**
     * The number of lines to truncate the description to.  If unspecified, defaults to 4.
     */
    descriptionLines: PropTypes.number,

    /**
     * The optional footer prop can be a string or an HTML element.  It is rendered below the
     * description.  The content may contain HTML, meaning that it is important to sanitize the
     * content before passing it to this component.
     */
    footer: PropTypes.node,

    /**
     * If the isOfficial prop is true, a badge indicating the asset's official status is displayed.
     */
    isOfficial: PropTypes.bool,

    /**
     * If the isPrivate prop is true, a badge indicating the asset's visibility is displayed.
     */
    isPrivate: PropTypes.bool,

    /**
     * The metadata prop is an object meant to contain two arbitrary pieces of metadata about the
     * asset.  The two sections are named "first" and "second" and should be objects, each
     * containing a "label" and "content" key.  They are rendered to the right of the description.
     */
    metadata: PropTypes.shape({
      first: PropTypes.shape({
        label: PropTypes.node.isRequired,
        content: PropTypes.node.isRequired
      }),
      second: PropTypes.shape({
        label: PropTypes.node.isRequired,
        content: PropTypes.node.isRequired
      })
    }),

    /**
     * The title of the asset, displayed in an h1 tag.
     */
    name: PropTypes.string,

    /**
     * A function that is called when the full description is expanded.
     */
    onExpandDescription: PropTypes.func,

    /**
     * An optional function that should return content to be rendered in the upper-right hand corner
     * of the info pane.
     */
    renderButtons: PropTypes.func
  },

  getDefaultProps() {
    return {
      descriptionLines: 4,
      onExpandDescription: _.noop
    };
  },

  componentDidMount() {
    if (this.metadataPane && this.description) {
      const metadataHeight = this.metadataPane.getBoundingClientRect().height;
      const descriptionHeight = this.description.getBoundingClientRect().height;

      if (descriptionHeight < metadataHeight) {
        this.description.style.height = `${metadataHeight}px`;
      }
    }

    const { descriptionLines, onExpandDescription } = this.props;
    const descriptionLineHeight = 24;
    const descriptionPadding = 11;

    collapsible(this.description, {
      height: descriptionLines * descriptionLineHeight + 2 * descriptionPadding,
      expandedCallback: onExpandDescription
    });
  },

  renderDescription() {
    const { description } = this.props;

    return (
      <div className="entry-description-container collapsible">
        <div className="entry-description" ref={(el) => this.description = el}>
          <div dangerouslySetInnerHTML={{ __html: description }} />

          <button className="collapse-toggle more">{t('info_pane.more')}</button>
          <button className="collapse-toggle less">{t('info_pane.less')}</button>
        </div>
      </div>
    );
  },

  renderFooter() {
    const { footer } = this.props;

    if (!footer) {
      return null;
    }

    return (
      <div className="entry-meta first">
        <div className="entry-meta topics" dangerouslySetInnerHTML={{ __html: footer }} />
      </div>
    );
  },

  renderMetadata() {
    const { metadata } = this.props;

    if (!metadata) {
      return null;
    }

    const metadataLeft = metadata.first ?
      <div className="entry-meta updated">
        <span className="meta-title">{metadata.first.label}</span>
        {' '}
        <span className="date">{metadata.first.content}</span>
      </div> : null;

    const metadataRight = metadata.second ?
      <div className="entry-meta views">
        <span className="meta-title">{metadata.second.label}</span>
        {' '}
        <span className="date">{metadata.second.content}</span>
      </div> : null;

    return (
      <div className="entry-meta second" ref={(el) => this.metadataPane = el}>
        {metadataLeft}
        {metadataRight}
      </div>
    );
  },

  render() {
    const {
      category,
      isOfficial,
      isPrivate,
      name,
      renderButtons
    } = this.props;

    const privateIcon = isPrivate ?
      <span
        className="icon-private"
        aria-label={t('info_pane.private_notice')}
        title={t('info_pane.private_notice')} /> : null;

    const categoryBadge = category ?
      <span className="tag-category">{_.upperFirst(category)}</span> : null;

    const officialBadge = isOfficial ?
      <span className="tag-official">
        <span aria-hidden className="icon-official"></span>
        {t('info_pane.official')}
      </span> : null;

    const buttons = renderButtons ?
      <div className="entry-actions">{renderButtons(this.props)}</div> :
      null;

    return (
      <div className="info-pane result-card">
        <div className="container">
          <div className="entry-header dataset-landing-page-header">
            <div className="entry-title">
              <h1 className="info-pane-name">
                {privateIcon}
                {name}
              </h1>

              {officialBadge}
              {categoryBadge}
            </div>

            {buttons}
          </div>

          <div className="entry-content">
            <div className="entry-main">
              {this.renderDescription()}
              {this.renderFooter()}
            </div>

            {this.renderMetadata()}
          </div>
        </div>
      </div>
    );
  }
});

export default InfoPane;
