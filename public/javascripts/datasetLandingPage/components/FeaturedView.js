import _ from 'lodash';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { getIconClassForDisplayType } from '../lib/displayTypeMetadata';
import formatDate from '../lib/formatDate';
import { emitMixpanelEvent } from '../actions';

export var FeaturedView = React.createClass({
  propTypes: {
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    description: PropTypes.string,
    url: PropTypes.string.isRequired,
    isPrivate: PropTypes.bool,
    updatedAt: PropTypes.string.isRequired,
    viewCount: PropTypes.number.isRequired
  },

  componentDidMount: function() {
    var $el = $(ReactDOM.findDOMNode(this));

    var titleLineHeight = 24;
    var descriptionLineHeight = 19;
    var descriptionPadding = 8;

    // Collapse title to 2 lines.
    $el.find('.entry-title').dotdotdot({
      height: 2 * titleLineHeight
    });

    // Collapse description to 3 lines.
    $el.find('.entry-description').dotdotdot({
      height: 3 * descriptionLineHeight + 2 * descriptionPadding
    });
  },

  render: function() {
    var { name, id, description, url, displayType, updatedAt, viewCount } = this.props;

    var icon = getIconClassForDisplayType(displayType);

    var privateIcon = this.props.isPrivate ?
      <span className="icon icon-private" /> : null;

    return (
      <div className="result-card media" data-id={id} data-type={displayType}>
        <div className="entry-header">
          <div className="entry-title">
            <h3 className="entry-name">
              {privateIcon} <a href={url} onClick={this.props.onClickWidget}>{name}</a>
            </h3>
          </div>
          <div className="entry-view-type">
            <span className={icon} />
          </div>
        </div>
        <div className="entry-meta">
          <div className="first">
            <span className="date">{formatDate(updatedAt)}</span>
          </div>
          <div className="second">
            <span className="date">{viewCount} views</span>
          </div>
        </div>
        <div className="entry-content">
          <div className="entry-main">
            <div className="img-wrapper">
              <a href={url} onClick={this.props.onClickWidget}>
                <span className={icon + ' x-large-icon'}></span>
              </a>
            </div>
            <div className="entry-description" dangerouslySetInnerHTML={{__html: description}} />
          </div>
        </div>
      </div>
    );
  }
});

function mapDispatchToProps(dispatch) {
  return {
    onClickWidget: function(event) {
      var resultCard = event.target.closest('.result-card');
      var payload = {
        name: 'Clicked a Related View',
        properties: {
          'Related View Id': resultCard.dataset.id,
          'Related View Type': resultCard.dataset.type
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(_.identity, mapDispatchToProps)(FeaturedView);
