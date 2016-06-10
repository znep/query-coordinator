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
    onClickAdd: PropTypes.func,
    onClickDone: PropTypes.func,
    onClickEdit: PropTypes.func,
    onClickRemove: PropTypes.func
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

  renderActionButtons: function(index) {
    var {
      contentList,
      onClickAdd,
      onClickEdit,
      onClickRemove
    } = this.props;
    var { showPlaceholderDetails } = this.state;

    function renderAddButton(type, text) {
      var clickHandler = _.partial(onClickAdd, type, index);

      return (
        <button
          className="btn btn-default btn-wide"
          key={text}
          onClick={clickHandler}>
          {text}
        </button>
      );
    }

    if (_.isNull(contentList[index])) {
      if (showPlaceholderDetails[index]) {
        return ([
          renderAddButton('visualization', I18n.featured_content_modal.visualization),
          renderAddButton('story', I18n.featured_content_modal.story),
          renderAddButton('externalResource', I18n.featured_content_modal.external)
        ]);
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
      return ([
        <button
          className="btn btn-alternate-2 edit-button"
          key="change"
          onClick={_.partial(onClickEdit, contentList[index])}>
          <span className="icon-edit" />
          {I18n.change}
        </button>,

        <button
          className="btn btn-alternate-1 btn-inverse remove-button"
          key="remove"
          onClick={_.partial(onClickRemove, index)}>
          <span className="icon-close" />
          {I18n.remove}
        </button>
      ]);
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
    var { contentList } = this.props;

    var items = _.map(contentList, (featuredItem, i) => {
      var actionButtons = this.renderActionButtons(i);

      if (!_.isObject(featuredItem)) {
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
      </section>
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
      dispatch(removeFeaturedItem(position));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(FeaturedItemSelector);
