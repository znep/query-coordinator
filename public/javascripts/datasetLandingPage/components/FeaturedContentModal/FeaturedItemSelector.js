import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import FeaturedItemWidget from '../FeaturedItemWidget';

import {
  addFeaturedItem,
  cancelFeaturedItemEdit,
  editFeaturedItem,
  removeFeaturedItem
} from '../../actions/featuredContent';

export var FeaturedItemSelector = React.createClass({
  propTypes: {
    contentList: PropTypes.array.isRequired,
    hasRemoveError: PropTypes.bool,
    isRemoving: PropTypes.bool,
    onClickAdd: PropTypes.func,
    onClickDone: PropTypes.func,
    onClickEdit: PropTypes.func,
    onClickRemove: PropTypes.func,
    removePosition: PropTypes.number
  },

  getDefaultProps: function() {
    return {
      onClickAdd: _.noop,
      onClickDone: _.noop,
      onClickEdit: _.noop,
      onClickRemove: _.noop
    };
  },

  getInitialState: function() {
    return {
      showPlaceholderDetails: [false, false, false]
    };
  },

  // When we click the add button that shows more add buttons.
  onClickPreAdd: function(position) {
    var { showPlaceholderDetails } = this.state;

    showPlaceholderDetails[position] = true;

    this.setState({ showPlaceholderDetails });
  },

  renderAddButton: function(index, type, text) {
    var { onClickAdd } = this.props;

    return (
      <button
        className="btn btn-default btn-wide"
        key={text}
        onClick={_.partial(onClickAdd, type, index)}>
        {text}
      </button>
    );
  },

  renderEditButton: function(index) {
    var { contentList, onClickEdit } = this.props;

    return (
      <button
        className="btn btn-alternate-2 edit-button"
        key="change"
        onClick={_.partial(onClickEdit, contentList[index])}>
        <span className="icon-edit" />
        {I18n.change}
      </button>
    );
  },

  renderRemoveButton: function(index) {
    var { isRemoving, removePosition, onClickRemove } = this.props;

    var contents;
    var onClick;
    var style;

    if (isRemoving && removePosition === index) {
      contents = <div className="spinner-default spinner-btn-primary" />;
      onClick = null;
      style = { paddingBottom: 6 };
    } else {
      contents = <div><span className="icon-close" />{I18n.remove}</div>;
      onClick = _.partial(onClickRemove, index);
      style = null;
    }

    return (
      <button
        className="btn btn-alternate-1 btn-inverse remove-button"
        key="remove"
        onClick={onClick}
        style={style}>
        {contents}
      </button>
    );
  },

  renderActionButtons: function(index) {
    var { contentList } = this.props;
    var { showPlaceholderDetails } = this.state;

    if (_.isNull(contentList[index])) {
      if (showPlaceholderDetails[index]) {
        if (window.serverConfig.featureFlags.storiesEnabled) {
          return ([
            this.renderAddButton(index, 'visualization', I18n.featured_content_modal.visualization),
            this.renderAddButton(index, 'story', I18n.featured_content_modal.story),
            this.renderAddButton(index, 'externalResource', I18n.featured_content_modal.external)
          ]);
        } else {
          return ([
            this.renderAddButton(index, 'visualization', I18n.featured_content_modal.visualization),
            this.renderAddButton(index, 'externalResource', I18n.featured_content_modal.external)
          ]);
        }
      } else {
        return (
          <button
            className="btn btn-alternate-2 btn-inverse"
            onClick={_.partial(this.onClickPreAdd, index)}>
            {`${I18n.add}...`}
          </button>
        );
      }
    } else {
      return [this.renderEditButton(index), this.renderRemoveButton(index)];
    }
  },

  renderFooter: function() {
    var { onClickDone } = this.props;

    return (
      <footer className="modal-footer">
        <div className="modal-footer-actions">
          <button
            key="done"
            className="btn btn-primary btn-sm done-button"
            data-modal-dismiss
            onClick={onClickDone}>
            {I18n.done}
          </button>
        </div>
      </footer>
    );
  },

  renderContent: function() {
    var { contentList, isRemoving, removePosition } = this.props;

    var items = _.map(contentList, (featuredItem, i) => {
      var actionButtons = this.renderActionButtons(i);
      var className = classNames('featured-item', {
        'placeholder': _.isEmpty(featuredItem),
        'show-buttons': isRemoving && removePosition === i
      });

      if (!_.isObject(featuredItem)) {
        return (
          <div className={className} key={i}>
            <div className="view-widget-overlay">
              {actionButtons}
            </div>
          </div>
        );
      } else {
        return (
          <div className={className} key={i}>
            <FeaturedItemWidget {...featuredItem}>
              {actionButtons}
            </FeaturedItemWidget>
          </div>
        );
      }
    });

    return (
      <section className="modal-content">
        <h2>{I18n.featured_content_modal.title}</h2>

        <p>{I18n.featured_content_modal.introduction}</p>

        <div className="featured-content">
          {items}
        </div>

        {this.renderRemoveError()}
      </section>
    );
  },

  renderRemoveError: function() {
    var { hasRemoveError } = this.props;

    if (!hasRemoveError) {
      return null;
    }

    return (
      <div className="alert error remove-error">
        {I18n.featured_content_modal.remove_error}
      </div>
    );
  },

  render: function() {
    return (
      <div>
        {this.renderContent()}
        {this.renderFooter()}
      </div>
    );
  }
});

function mapStateToProps(state) {
  return state.featuredContent;
}

function mapDispatchToProps(dispatch) {
  return {
    onClickAdd: function(type, position) {
      dispatch(addFeaturedItem(type, position));
    },

    onClickDone: function() {
      dispatch(cancelFeaturedItemEdit());
    },

    onClickEdit: function(position) {
      dispatch(editFeaturedItem(position));
    },

    onClickRemove: function(position) {
      /* eslint-disable no-alert */
      if (window.confirm(I18n.featured_content_modal.remove_prompt)) {
        dispatch(removeFeaturedItem(position));
      }
      /* eslint-enable no-alert */
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(FeaturedItemSelector);
