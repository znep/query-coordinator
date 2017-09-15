import _ from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import FeaturedViewCard from '../FeaturedViewCard';
import FeaturedContentModalHeader from './FeaturedContentModalHeader';
import { getEditTypeFromFeaturedItem } from '../../lib/featuredContent';

import { emitMixpanelEvent } from '../../actions/mixpanel';

import {
  addFeaturedItem,
  cancelFeaturedItemEdit,
  editFeaturedItem,
  removeFeaturedItem
} from '../../actions/featuredContent';

export class FeaturedItemSelector extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showPlaceholderDetails: [false, false, false]
    };

    _.bindAll(this, 'onClickPreAdd');
  }

  componentDidMount() {
    ReactDOM.findDOMNode(this).querySelector('h2').focus();
  }

  // When we click the add button that shows more add buttons.
  onClickPreAdd(position) {
    const { isBlobby, isHref } = this.props;
    const { showPlaceholderDetails } = this.state;

    showPlaceholderDetails[position] = true;

    if (isBlobby || isHref) {
      return this.props.onClickAdd('externalResource', position);
    }

    this.setState({ showPlaceholderDetails });
  }

  renderAddButton(index, type, text) {
    const { onClickAdd } = this.props;

    return (
      <button
        className="btn btn-default btn-wide"
        key={text}
        onClick={_.partial(onClickAdd, type, index)}>
        {text}
      </button>
    );
  }

  renderEditButton(index) {
    const { contentList, onClickEdit } = this.props;

    return (
      <button
        className="btn btn-alternate-2 edit-button"
        key="change"
        onClick={_.partial(onClickEdit, index, contentList[index])}>
        <span className="icon-edit" />
        {I18n.change}
      </button>
    );
  }

  renderRemoveButton(index) {
    const { contentList, isRemoving, removePosition, onClickRemove } = this.props;

    let contents;
    let onClick;
    let style;

    if (isRemoving && removePosition === index) {
      contents = <div className="spinner-default spinner-btn-primary" />;
      onClick = null;
      style = { paddingBottom: 6 };
    } else {
      contents = <div><span className="icon-close" />{I18n.remove}</div>;
      onClick = _.partial(onClickRemove, index, contentList[index]);
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
  }

  renderActionButtons(index) {
    const { contentList } = this.props;
    const { showPlaceholderDetails } = this.state;

    if (_.isNull(contentList[index])) {
      if (showPlaceholderDetails[index]) {
        if (window.serverConfig.featureFlags.stories_enabled) {
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
            className="btn btn-alternate-2 btn-inverse btn-wide"
            onClick={_.partial(this.onClickPreAdd, index)}>
            {`${I18n.add}...`}
          </button>
        );
      }
    } else {
      return [this.renderEditButton(index), this.renderRemoveButton(index)];
    }
  }

  renderFooter() {
    const { onClickDone } = this.props;

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
  }

  renderContent() {
    const { contentList, isRemoving, removePosition, isBlobby, isHref } = this.props;

    const introduction = (isBlobby || isHref) ?
      I18n.featured_content_modal.introduction_external :
      I18n.featured_content_modal.introduction;

    const items = _.map(contentList, (featuredItem, i) => {
      const actionButtons = this.renderActionButtons(i);
      const className = classNames('featured-item', {
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
            <FeaturedViewCard featuredItem={featuredItem}>
              {actionButtons}
            </FeaturedViewCard>
          </div>
        );
      }
    });

    return (
      <div className="modal-content">
        <div className="container">
          <h2 tabIndex="0">{I18n.featured_content_modal.title}</h2>

          <p>{introduction}</p>

          <div className="featured-content">
            {items}
          </div>

          {this.renderRemoveError()}
        </div>
      </div>
    );
  }

  renderRemoveError() {
    const { hasRemoveError } = this.props;

    if (!hasRemoveError) {
      return null;
    }

    return (
      <div className="alert error remove-error">
        {I18n.featured_content_modal.remove_error}
      </div>
    );
  }

  render() {
    const { onClickClose } = this.props;

    return (
      <div className="modal-container">
        <FeaturedContentModalHeader onClickClose={onClickClose} />
        {this.renderContent()}
        {this.renderFooter()}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    ...state.featuredContent,
    isBlobby: state.view.isBlobby,
    isHref: state.view.isHref
  };
}

function mapDispatchToProps(dispatch) {
  function getMixpanelEditType(featuredItem) {
    switch (getEditTypeFromFeaturedItem(featuredItem)) {
      case 'visualization':
        return 'Visualization';

      case 'story':
        return 'Story';

      case 'externalResource':
        return 'External Resource';

      default:
        return 'Unknown';
    }
  }

  return {
    onClickAdd(type, position) {
      const mixpanelPayload = {
        name: 'Clicked to Add a Featured Item',
        properties: {
          'Item Type': _.upperFirst(type),
          'Item Position': position
        }
      };

      dispatch(emitMixpanelEvent(mixpanelPayload));
      dispatch(addFeaturedItem(type, position));
    },

    onClickClose() {
      dispatch(cancelFeaturedItemEdit());
    },

    onClickDone() {
      dispatch(cancelFeaturedItemEdit());
    },

    onClickEdit(position, featuredItem) {
      const mixpanelPayload = {
        name: 'Clicked to Edit a Featured Item',
        properties: {
          'Item Type': getMixpanelEditType(featuredItem),
          'Item Position': position
        }
      };

      dispatch(emitMixpanelEvent(mixpanelPayload));
      dispatch(editFeaturedItem(featuredItem));
    },

    onClickRemove(position, featuredItem) {
      const mixpanelPayload = {
        name: 'Clicked to Remove a Featured Item',
        properties: {
          'Item Type': getMixpanelEditType(featuredItem),
          'Item Position': position
        }
      };

      /* eslint-disable no-alert */
      if (window.confirm(I18n.featured_content_modal.remove_prompt)) {
        dispatch(emitMixpanelEvent(mixpanelPayload));
        dispatch(removeFeaturedItem(position));
      }
      /* eslint-enable no-alert */
    }
  };
}

FeaturedItemSelector.propTypes = {
  contentList: PropTypes.array.isRequired,
  hasRemoveError: PropTypes.bool,
  isBlobby: PropTypes.bool,
  isHref: PropTypes.bool,
  isRemoving: PropTypes.bool,
  onClickAdd: PropTypes.func,
  onClickClose: PropTypes.func,
  onClickDone: PropTypes.func,
  onClickEdit: PropTypes.func,
  onClickRemove: PropTypes.func,
  removePosition: PropTypes.number,
  renderHeader: PropTypes.func
};

FeaturedItemSelector.defaultProps = {
  onClickAdd: _.noop,
  onClickDone: _.noop,
  onClickEdit: _.noop,
  onClickRemove: _.noop
};

export default connect(mapStateToProps, mapDispatchToProps)(FeaturedItemSelector);
