/**
  A view card "manager" is a wrapper around a FeaturedContentViewCard
  that adds functionality to edit or remove the view card.
*/

import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import { handleKeyPress } from '../../common/helpers/keyPressHelpers';
import * as Actions from '../actions/featuredContent';

import FeaturedContentViewCard from './FeaturedContentViewCard';

export class FeaturedContentViewCardManager extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hovering: false
    };

    _.bindAll(this, ['setHovering', 'renderViewCardOverlay']);
  }

  setHovering(hoveringState) {
    this.setState({ hovering: hoveringState });
  }

  renderViewCardOverlay() {
    const cardOverlayClasses = classNames('overlay', {
      hidden: !this.state.hovering
    });

    return (
      <div
        className="hover-target"
        role="button"
        tabIndex={0}
        onMouseOver={() => this.setHovering(true)}
        onFocus={() => this.setHovering(true)}
        onMouseOut={() => this.setHovering(false)}
        onBlur={() => this.setHovering(false)}
        onClick={(e) => {
          e.preventDefault();
          this.props.openManager(this.props.position);
        }}
        onKeyDown={handleKeyPress(() => this.props.openManager(this.props.position))}>
        <div className={cardOverlayClasses}>
          <div className="buttons">
            <button
              className="change-button btn btn-primary"
              onClick={(e) => {
                e.preventDefault();
                this.props.openManager(this.props.position);
              }}>
              <span className="socrata-icon-edit"></span>
              {_.get(I18n, 'manager.change')}
            </button>
            <button
              className="remove-button btn btn-alternate-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                this.props.removeFeaturedContentItem(this.props.position);
              }}>
              <span className="socrata-icon-close"></span>
              {_.get(I18n, 'manager.remove')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <FeaturedContentViewCard {...this.props}>
        {this.renderViewCardOverlay()}
      </FeaturedContentViewCard>
    );
  }
}

FeaturedContentViewCardManager.propTypes = {
  // Action dispatchers:
  removeFeaturedContentItem: PropTypes.func,
  // ViewCard props:
  contentType: PropTypes.string,
  description: PropTypes.string,
  displayType: PropTypes.string,
  icon: PropTypes.string,
  imageUrl: PropTypes.string,
  isPrivate: PropTypes.bool,
  linkProps: PropTypes.object,
  metadataLeft: PropTypes.string,
  metadataRight: PropTypes.string,
  name: PropTypes.string.isRequired,
  openManager: PropTypes.func.isRequired,
  position: PropTypes.number,
  previewImage: PropTypes.string,
  resource_id: PropTypes.number,
  rowsUpdatedAt: PropTypes.number,
  uid: PropTypes.string,
  url: PropTypes.string.isRequired,
  viewCount: PropTypes.number
};

FeaturedContentViewCardManager.defaultProps = {
  isPrivate: false,
  position: 0,
  viewCount: 0
};

const mapDispatchToProps = dispatch => ({
  removeFeaturedContentItem: (position) => dispatch(Actions.removeFeaturedContentItem(position))
});

export default connect(null, mapDispatchToProps)(FeaturedContentViewCardManager);
