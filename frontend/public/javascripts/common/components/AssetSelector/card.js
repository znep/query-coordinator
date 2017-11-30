import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import ViewCard from 'common/components/ViewCard';
import { getIconClassForDisplayType } from 'common/displayTypeMetadata';
import { getDateLabel, getViewCountLabel, getAriaLabel } from '../../helpers/viewCardHelpers';
import { handleKeyPress } from 'common/dom_helpers/keyPressHelpers';
import { FeatureFlags } from 'common/feature_flags';

export class Card extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hovering: false
    };

    _.bindAll(this, ['onSelect', 'ceteraResultProps', 'setHovering', 'viewCardProps']);
  }

  onSelect(cardProps) {
    this.props.onSelect(cardProps);
    this.props.onClose();
  }

  setHovering(hoveringState) {
    this.setState({ hovering: hoveringState });
  }

  // This is what will be returned (onSelect) when a user selects a Card.
  ceteraResultProps() {
    return _.merge(
      _.pick(this.props, 'name', 'description', 'id', 'updatedAt', 'viewCount'),
      {
        displayType: this.props.type,
        imageUrl: this.props.previewImageUrl,
        isPrivate: !this.props.isPublic,
        url: this.props.link
      }
    );
  }

  viewCardProps() {
    const { description, id, isPublic, link, name, previewImageUrl, type, updatedAt, viewCount } = this.props;

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
      isPrivate: !isPublic,
      linkProps: {
        target: '_blank',
        'aria-label': getAriaLabel(this.props)
      }
    };
  }

  render() {
    const cardOverlayClasses = classNames('overlay', {
      hidden: !this.state.hovering
    });

    return (
      <ViewCard {...this.viewCardProps()}>
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
              alt={`${_.get(I18n, 'common.asset_selector.action_buttons.select')} ${this.props.name}`}
              className="select-button btn btn-primary">
              {_.get(I18n, 'common.asset_selector.action_buttons.select')}
            </button>
          </div>
        </div>
      </ViewCard>
    );
  }
}

Card.propTypes = {
  categories: PropTypes.array,
  createdAt: PropTypes.string,
  description: PropTypes.string,
  id: PropTypes.string,
  isFederated: PropTypes.bool,
  isPublic: PropTypes.bool,
  link: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  previewImageUrl: PropTypes.string,
  provenance: PropTypes.string,
  tags: PropTypes.array,
  type: PropTypes.string.isRequired,
  updatedAt: PropTypes.string,
  viewCount: PropTypes.number.isRequired
};

Card.defaultProps = {
  id: '',
  link: '',
  name: '',
  onClose: _.noop,
  onSelect: _.noop,
  type: '',
  viewCount: 0
};

export default Card;
