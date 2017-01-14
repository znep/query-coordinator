import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import { closeModal } from '../actions/modal';
import { ViewCard } from 'socrata-components';
import { getIconClassForDisplayType } from 'socrata-components/common/displayTypeMetadata';
import { getDateLabel, getViewCountLabel, getAriaLabel } from '../../datasetLandingPage/lib/viewCardHelpers';

export class Card extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['onClick', 'setHovering', 'viewCardProps']);
    this.state = {
      hovering: false
    };
  }

  onClick(cardProps) {
    console.log(cardProps);
    this.props.dispatchCloseModal();
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
          onMouseOver={() => this.setHovering(true)}
          onMouseOut={() => this.setHovering(false)}>
          <div className={cardOverlayClasses}>
            <button
              className="select-button btn btn-primary"
              onClick={() => this.onClick(cardProps)}>
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
  dispatchCloseModal: PropTypes.func.isRequired
};

Card.defaultProps = {
  link: '',
  name: '',
  type: '',
  viewCount: 0,
  dispatchCloseModal: _.noop
};

function mapDispatchToProps(dispatch) {
  return {
    dispatchCloseModal: function() {
      dispatch(closeModal());
    }
  };
}

export default connect(null, mapDispatchToProps)(Card);
