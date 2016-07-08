import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ExternalResourceForm from './FeaturedContentModal/ExternalResourceForm';
import FeaturedItemSelector from './FeaturedContentModal/FeaturedItemSelector';
import StoryForm from './FeaturedContentModal/StoryForm';
import ViewSelectorModal from './FeaturedContentModal/ViewSelectorModal';
import { ESCAPE_KEY_CODE } from '../lib/constants';
import { cancelFeaturedItemEdit } from '../actions/featuredContent';

export var FeaturedContentModal = React.createClass({
  propTypes: {
    isEditing: PropTypes.bool,
    editType: PropTypes.string,
    onPressEscape: PropTypes.func
  },

  componentWillMount: function() {
    document.addEventListener('keyup', this.onKeyUp);
  },

  componentDidUpdate: function(prevProps) {
    if (!this.props.isEditing && prevProps.isEditing) {
      this.resetFocus();
    }
  },

  componentWillUnmount: function() {
    document.removeEventListener('keyup', this.onKeyUp);
  },

  onKeyUp: function(event) {
    var isModalHidden = ReactDOM.findDOMNode(this).classList.contains('modal-hidden');
    var isKeyEscape = event.keyCode === ESCAPE_KEY_CODE;

    if (!isModalHidden && isKeyEscape) {
      this.props.onPressEscape();
    }
  },

  resetFocus: function() {
    ReactDOM.findDOMNode(this).focus();
  },

  renderContent: function() {
    var { isEditing, editType } = this.props;

    var props = {
      resetFocus: this.resetFocus
    };

    if (!isEditing) {
      return <FeaturedItemSelector {...props} />;
    } else if (editType === 'externalResource') {
      return <ExternalResourceForm {...props} />;
    } else if (editType === 'story') {
      return <StoryForm {...props} />;
    } else if (editType === 'visualization') {
      return <ViewSelectorModal {...props} />;
    }
  },

  render: function() {
    var modalClassNames = 'modal modal-overlay modal-full modal-hidden';

    return (
      <div
        id="featured-content-modal"
        className={modalClassNames}
        data-modal-dismiss
        tabIndex="0">
        {this.renderContent()}
      </div>
    );
  }
});

function mapStateToProps(state) {
  return state.featuredContent;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onPressEscape: cancelFeaturedItemEdit
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FeaturedContentModal);
