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

  componentWillMount() {
    document.addEventListener('keyup', this.onKeyUp);
  },

  componentWillUnmount() {
    document.removeEventListener('keyup', this.onKeyUp);
  },

  onKeyUp(event) {
    var isModalHidden = ReactDOM.findDOMNode(this).classList.contains('modal-hidden');
    var isKeyEscape = event.keyCode === ESCAPE_KEY_CODE;

    if (!isModalHidden && isKeyEscape) {
      this.props.onPressEscape();
    }
  },

  renderContent() {
    var { isEditing, editType } = this.props;

    if (!isEditing) {
      return <FeaturedItemSelector />;
    } else if (editType === 'externalResource') {
      return <ExternalResourceForm />;
    } else if (editType === 'story') {
      return <StoryForm />;
    } else if (editType === 'visualization') {
      return <ViewSelectorModal />;
    }
  },

  render() {
    return (
      <div
        id="featured-content-modal"
        className="modal modal-overlay modal-full modal-hidden"
        data-modal-dismiss>
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
