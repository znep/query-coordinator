import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import I18n from 'common/i18n';

import { FeatureFlags } from 'common/feature_flags';
import ViewCard from 'common/components/ViewCard';
import { getIconClassForDisplayType } from 'common/displayTypeMetadata';
import { getDateLabel, getViewCountLabel, getAriaLabel } from 'common/viewCardHelpers';
import { handleKeyPress } from 'common/dom_helpers/keyPressHelpers';

export class ResultCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hovering: false
    };
  }

  onSelect(cardProps) {
    this.props.onSelect(cardProps);
    if (this.props.closeOnSelect) {
      this.props.onClose();
    }
  }

  setHovering(hoveringState) {
    this.setState({ hovering: hoveringState });
  }

  // This is what will be returned (onSelect) when a user selects a Card.
  ceteraResultProps() {
    return _.merge(
      _.pick(this.props, 'name', 'description', 'domain', 'id', 'updatedAt', 'viewCount'),
      {
        displayType: this.props.type,
        imageUrl: this.props.previewImageUrl,
        isPrivate: !this.props.isPublic,
        url: this.props.link
      }
    );
  }

  viewCardProps() {
    const { description, domain, id, isPublic, link, name, previewImageUrl, type, updatedAt, viewCount } = this.props;
    const currentDomain = _.get(window, 'serverConfig.domain', window.location.hostname);
    const isFederated = domain !== currentDomain;

    // EN-19924: USAID sadtimes
    const displayType = (FeatureFlags.value('usaid_features_enabled') && type === 'href') ?
      'data_asset' : type;

    return {
      name,
      id,
      description,
      url: link,
      icon: getIconClassForDisplayType(displayType),
      metadataLeft: getDateLabel(updatedAt),
      metadataRight: getViewCountLabel(viewCount),
      imageUrl: previewImageUrl,
      isFederated,
      isPrivate: !isPublic,
      linkProps: {
        target: '_blank',
        'aria-label': getAriaLabel(this.props)
      }
    };
  }

  render() {
    const scope = 'shared.asset_browser.result_card_container';
    const cardOverlayClasses = classNames('overlay', {
      hidden: !this.state.hovering
    });

    const selectModeOverlay = this.props.selectMode ? (
      <div
        className="hover-target"
        role="button"
        tabIndex={0}
        onMouseOver={() => this.setHovering(true)}
        onFocus={() => this.setHovering(true)}
        onMouseOut={() => this.setHovering(false)}
        onBlur={() => this.setHovering(false)}
        onClick={() => this.onSelect(this.ceteraResultProps())}
        onKeyDown={handleKeyPress(() => this.onSelect(this.ceteraResultProps()))}>
        <div className={cardOverlayClasses}>
          <button
            alt={`${I18n.t('select_mode.select', { scope })} ${this.props.name}`}
            className="select-button btn btn-primary">
            {I18n.t('select_mode.select', { scope })}
          </button>
        </div>
      </div>
    ) : null;

    return (
      <ViewCard {...this.viewCardProps()}>
        {selectModeOverlay}
      </ViewCard>
    );
  }
}

ResultCard.propTypes = {
  categories: PropTypes.array,
  closeOnSelect: PropTypes.bool,
  createdAt: PropTypes.string,
  description: PropTypes.string,
  domain: PropTypes.string,
  id: PropTypes.string,
  isFederated: PropTypes.bool,
  isPublic: PropTypes.bool,
  link: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  previewImageUrl: PropTypes.string,
  provenance: PropTypes.string,
  selectMode: PropTypes.bool.isRequired,
  tags: PropTypes.array,
  type: PropTypes.string.isRequired,
  updatedAt: PropTypes.string,
  viewCount: PropTypes.number.isRequired
};

ResultCard.defaultProps = {
  closeOnSelect: true,
  id: '',
  link: '',
  name: '',
  onClose: _.noop,
  onSelect: _.noop,
  type: '',
  viewCount: 0
};

export default ResultCard;
