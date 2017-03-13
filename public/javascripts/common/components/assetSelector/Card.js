import React, { PropTypes } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { ViewCard } from 'socrata-components';
import { getIconClassForDisplayType } from 'socrata-components/common/displayTypeMetadata';
import { getDateLabel, getViewCountLabel, getAriaLabel } from '../../helpers/viewCardHelpers';
import { handleKeyPress } from '../../helpers/keyPressHelpers';

export class Card extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hovering: false
    };

    _.bindAll(this, ['onSelect', 'setHovering', 'viewCardProps']);
  }

  onSelect(cardProps) {
    this.props.onSelect(cardProps);
    this.props.onClose();
  }

  setHovering(hoveringState) {
    this.setState({ hovering: hoveringState });
  }

  viewCardProps() {
    const { description, id, isPublic, link, name, previewImageUrl, type, updatedAt, viewCount } = this.props;

    return {
      name,
      id,
      description,
      url: link,
      icon: getIconClassForDisplayType(type),
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
    const cardProps = this.viewCardProps();
    const cardOverlayClasses = classNames('overlay', {
      hidden: !this.state.hovering
    });

    return (
      <ViewCard {...cardProps}>
        <div
          className="hover-target"
          role="button"
          tabIndex={0}
          onMouseOver={() => this.setHovering(true)}
          onFocus={() => this.setHovering(true)}
          onMouseOut={() => this.setHovering(false)}
          onBlur={() => this.setHovering(false)}
          onClick={() => this.onSelect(cardProps)}
          onKeyDown={handleKeyPress(() => this.onSelect(cardProps))}>
          <div className={cardOverlayClasses}>
            <button className="select-button btn btn-primary">
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