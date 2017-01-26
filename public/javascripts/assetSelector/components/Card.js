import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { closeAssetSelector } from '../actions/modal';
import { ViewCard } from 'socrata-components';
import { getIconClassForDisplayType } from 'socrata-components/common/displayTypeMetadata';
import { getDateLabel, getViewCountLabel, getAriaLabel } from '../../datasetLandingPage/lib/viewCardHelpers';
import { handleKeyPress } from '../lib/a11yHelpers';

export class Card extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['onSelect', 'setHovering', 'viewCardProps']);
    this.state = {
      hovering: false
    };
  }

  onSelect(cardProps) {
    console.log(cardProps);
    this.props.dispatchCloseAssetSelector();
  }

  setHovering(hoveringState) {
    this.setState({ hovering: hoveringState });
  }

  viewCardProps() {
    return {
      name: this.props.name,
      description: this.props.description,
      url: this.props.link,
      icon: getIconClassForDisplayType(this.props.type),
      metadataLeft: getDateLabel(this.props.updatedAt),
      metadataRight: getViewCountLabel(this.props.viewCount),
      imageUrl: this.props.previewImageUrl,
      isPrivate: !this.props.isPublic,
      linkProps: {
        target: '_blank',
        'aria-label': getAriaLabel(this.props)
      }
    };
  }

  render() {
    const cardProps = this.viewCardProps();
    const cardOverlayClasses = [
      'overlay',
      this.state.hovering ? '' : 'hidden'
    ].filter((className) => className).join(' ');

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
              Select{/* TODO: Localization */}
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
  previewImageUrl: PropTypes.string,
  provenance: PropTypes.string,
  tags: PropTypes.array,
  type: PropTypes.string.isRequired,
  updatedAt: PropTypes.string,
  viewCount: PropTypes.number.isRequired,
  dispatchCloseAssetSelector: PropTypes.func.isRequired
};

Card.defaultProps = {
  link: '',
  name: '',
  type: '',
  viewCount: 0,
  dispatchCloseAssetSelector: _.noop
};

function mapDispatchToProps(dispatch) {
  return {
    dispatchCloseAssetSelector: function() {
      dispatch(closeAssetSelector());
    }
  };
}

export default connect(null, mapDispatchToProps)(Card);
