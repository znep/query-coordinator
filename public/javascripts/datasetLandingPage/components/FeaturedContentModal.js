import React, { PropTypes } from 'react';
import classNames from 'classnames';
import ViewWidget from './ViewWidget';
import { handleKeyPress } from '../lib/a11yHelpers';

var FeaturedContentModal = React.createClass({
  propTypes: {
    isEditingFeaturedContent: PropTypes.bool.isRequired,
    contentList: PropTypes.array.isRequired,
    onClickAddFeaturedItem: PropTypes.func.isRequired,
    onClickEditFeaturedItem: PropTypes.func.isRequired,
    onClickRemoveFeaturedItem: PropTypes.func.isRequired
  },

  getInitialState: function() {
    return {
      showPlaceholderDetails: [false, false, false]
    };
  },

  onClickPlaceholderDetailsButton: function(event) {
    var { showPlaceholderDetails } = this.state;

    showPlaceholderDetails[event.target.dataset.position] = true;

    this.setState({ showPlaceholderDetails });
  },

  renderActionButtons: function(index) {
    var {
      contentList,
      onClickAddFeaturedItem,
      onClickEditFeaturedItem,
      onClickRemoveFeaturedItem
    } = this.props;
    var { showPlaceholderDetails } = this.state;

    var baseProps = {
      className: classNames('btn btn-default'),
      'data-position': index
    };

    function renderAddButton(contentType, text) {
      return (
        <button
          {...baseProps}
          key={text}
          data-content-type={contentType}
          onKeyDown={handleKeyPress(onClickAddFeaturedItem)}
          onClick={onClickAddFeaturedItem}>
          {text}
        </button>
      );
    }

    if (_.isNull(contentList[index])) {
      if (showPlaceholderDetails[index]) {
        return ([
          renderAddButton('internal', I18n.featured_content_modal.visualization),
          renderAddButton('internal', I18n.featured_content_modal.story),
          renderAddButton('external', I18n.featured_content_modal.external)
        ]);
      } else {
        return (
          <button
            {...baseProps}
            onKeyDown={handleKeyPress(this.onClickPlaceholderDetailsButton)}
            onClick={this.onClickPlaceholderDetailsButton}>
            {I18n.add}
          </button>
        );
      }
    }

    return (
      <div>
        <button
          {...baseProps}
          onKeyDown={handleKeyPress(onClickEditFeaturedItem)}
          onClick={onClickEditFeaturedItem}>
          {I18n.edit}
        </button>

        <button
          {...baseProps}
          onKeyDown={handleKeyPress(onClickRemoveFeaturedItem)}
          onClick={onClickRemoveFeaturedItem}>>
          {I18n.remove}
        </button>
      </div>
    );
  },

  renderFeaturedContent: function() {
    var { contentList } = this.props;

    var items = _.map(contentList, (featuredItem, i) => {
      var actionButtons = this.renderActionButtons(i);

      if (_.isNull(featuredItem)) {
        return (
          <div className="featured-item placeholder" key={i}>
            <div className="view-widget-overlay">
              {actionButtons}
            </div>
          </div>
        );
      } else {
        return (
          <div className="featured-item" key={i}>
            <ViewWidget {...featuredItem.featuredView}>
              {actionButtons}
            </ViewWidget>
          </div>
        );
      }
    });

    return (
      <div className="featured-content">
        {items}
      </div>
    );
  },

  render: function() {
    var { isEditingFeaturedContent } = this.props;

    var modalClassNames = classNames('modal modal-overlay modal-full', {
      'modal-hidden': !isEditingFeaturedContent
    });

    return (
      <div id="featured-content-modal" className={modalClassNames} data-modal-dismiss>
        <div className="modal-container">
          <header className="modal-header">
            <h1>{I18n.featured_content_modal.title}</h1>

            <button
              className="btn btn-transparent modal-header-dismiss"
              data-modal-dismiss
              aria-label={I18n.close}>
              <span className="icon-close-2" />
            </button>
          </header>

          <section className="modal-content">
            <p>{I18n.featured_content_modal.introduction}</p>

            {this.renderFeaturedContent()}
          </section>

          <footer className="modal-footer">
            <div className="modal-footer-actions">
              <button className="btn btn-primary btn-sm" data-modal-dismiss>{I18n.done}</button>
            </div>
          </footer>
        </div>
      </div>
    );
  }
});

export default FeaturedContentModal;
