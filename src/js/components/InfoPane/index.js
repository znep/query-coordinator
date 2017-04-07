import _ from 'lodash';
import React, { PropTypes } from 'react';
import $ from 'jquery';
import classNames from 'classnames';
import collapsible from '../../common/collapsible';
import purify from '../../common/purify';
import { translate as t } from '../../common/I18n';
import SocrataIcon from '../SocrataIcon';


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
     * in the description; it will be sanitized to prevent security vulnerabilities.
     */
    description: PropTypes.string,

    /**
     * The number of lines to truncate the description to.  If unspecified, defaults to 4.
     */
    descriptionLines: PropTypes.number,

    /**
     * The optional footer prop can be a string or an HTML element.  It is rendered below the
     * description.  HTML is allowed in the footer; it will be sanitized to prevent security
     * vulnerabilities.
     */
    footer: PropTypes.node,

    /**
     * The provenance is used to display an authority badge icon and text.
     */
    provenance: PropTypes.oneOf(['official', 'community', null]),

    /**
     * The provenanceIcon is used to display the appropriate icon for the authority badge
     */
    provenanceIcon: PropTypes.oneOf(['official2', 'community', null]),

    /**
     * The hideProvenance is used to conditionally hide the authority badge depending on feature flags.
     */
    hideProvenance: PropTypes.bool,

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
    renderButtons: PropTypes.func,

    /**
     * If the isPaneCollapsible prop is true, only the the InfoPane header is initially visible
     * and a More Info/Less Info toggle allows the InfoPane content to be shown
     */
    isPaneCollapsible: PropTypes.bool
  },

  getDefaultProps() {
    return {
      descriptionLines: 4,
      onExpandDescription: _.noop,
      isPaneCollapsible: true
    };
  },

  getInitialState() {
    return {
      paneCollapsed: this.props.isPaneCollapsible,
      firstPaneExpansion: true
    };
  },

  componentDidMount() {
    this.$description = $(this.description);
    if (!this.state.paneCollapsed) {
      this.ellipsify();
    }
  },

  componentWillUpdate(nextProps) {
    if (this.shouldEllipsify(this.props, nextProps)) {
      this.$description.trigger('destroy.dot');
      this.resetParentHeight();
    }
  },

  componentDidUpdate(prevProps) {
    if (this.shouldEllipsify(prevProps, this.props)) {
      this.ellipsify();
    }

    // If the InfoPane is initially collapsed, then we need to do the initial
    // ellipsify here because ellipsify needs to have the description visible to
    // work properly
    if (this.state.firstPaneExpansion && !this.state.paneCollapsed) {
      this.ellipsify();
    }
  },

  resetParentHeight() {
    this.description.parentElement.style.height = 'auto';
  },

  shouldEllipsify(prevProps, nextProps) {
    return prevProps.description !== nextProps.description;
  },

  ellipsify() {
    if (this.metadataPane && this.description && this.description.firstChild) {
      const metadataHeight = this.metadataPane.getBoundingClientRect().height;
      const descriptionHeight = this.description.firstChild.getBoundingClientRect().height;

      if (descriptionHeight < metadataHeight) {
        this.description.style.height = `${metadataHeight}px`;
      }
    }

    const { descriptionLines, onExpandDescription } = this.props;
    const descriptionLineHeight = 24;
    const descriptionPadding = 11;
    const height = descriptionLines * descriptionLineHeight + 2 * descriptionPadding;

    collapsible(this.description, {
      height,
      expandedCallback: onExpandDescription
    });

    // We use firstPaneExpansion to determine if the InfoPane is collapsible, is initially
    // rendered collapsed, and is being expanded for the first time. That way we know that
    // we need to call ellipsify when we expand the InfoPane for the first time.
    if (this.state.firstPaneExpansion && this.props.isPaneCollapsible) {
      this.setState({ firstPaneExpansion: !this.state.firstPaneExpansion });
    }
  },

  toggleInfoPaneVisibility() {
    this.togglePaneButton.blur();

    this.setState({
      paneCollapsed: !this.state.paneCollapsed
    });
  },

  renderCollapsePaneToggle() {
    const { paneCollapsed } = this.state;
    const { isPaneCollapsible } = this.props;

    if (!isPaneCollapsible) {
      return null;
    }

    const buttonClassName = classNames('btn-transparent collapse-info-pane-btn', {
      'hide': !isPaneCollapsible
    });
    const buttonContent = paneCollapsed ?
      <span>{t('info_pane.more_info')} <SocrataIcon name="arrow-down" /> </span> :
      <span>{t('info_pane.less_info')} <SocrataIcon name="arrow-up" /> </span>;

    return (
      <div>
        <button
          className={buttonClassName}
          ref={(el) => this.togglePaneButton = el}
          onClick={this.toggleInfoPaneVisibility}>
          {buttonContent}
        </button>
      </div>
    );
  },

  renderDescription() {
    const { description } = this.props;

    return (
      <div className="entry-description-container collapsible">
        <div className="entry-description" ref={(el) => this.description = el}>
          <div dangerouslySetInnerHTML={{ __html: purify(description) }} />

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
        <div className="entry-meta topics">
          {footer}
        </div>
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
      isPrivate,
      name,
      renderButtons,
      provenance,
      provenanceIcon,
      hideProvenance,
      isPaneCollapsible
    } = this.props;

    const { paneCollapsed } = this.state;

    const privateIcon = isPrivate ?
      <span
        className="socrata-icon-private"
        aria-label={t('info_pane.private_notice')}
        title={t('info_pane.private_notice')} /> : null;

    const categoryBadge = category ? <span className="tag-category">{_.upperFirst(category)}</span> : null;

    const buttons = renderButtons ? <div className="entry-actions">{renderButtons(this.props)}</div> : null;

    const provenanceBadge = (hideProvenance || !provenance) ? null :
      <span className={`tag-${provenance}`}>
        <span aria-hidden className={`socrata-icon-${provenanceIcon}`}></span>
        {t(`info_pane.${provenance}`)}
      </span>;

    const contentClassName = classNames('entry-content', {
      'hide': paneCollapsed && isPaneCollapsible
    });

    return (
      <div className="info-pane result-card">
        <div className="container">
          <div className="entry-header dataset-landing-page-header">
            <div className="entry-header-contents">
              <div className="entry-title">
                <h1 className="info-pane-name">
                  {privateIcon}
                  {name}
                </h1>

                {provenanceBadge}
                {categoryBadge}
              </div>

              {buttons}
            </div>
            {this.renderCollapsePaneToggle()}
          </div>

          <div className={contentClassName}>
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
