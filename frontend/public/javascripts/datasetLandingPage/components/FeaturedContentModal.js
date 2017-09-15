import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ExternalResourceForm from './FeaturedContentModal/ExternalResourceForm';
import FeaturedItemSelector from './FeaturedContentModal/FeaturedItemSelector';
import StoryForm from './FeaturedContentModal/StoryForm';
import ViewSelectorModal from './FeaturedContentModal/ViewSelectorModal';
import { ESCAPE_KEY_CODE } from '../../common/constants';
import { cancelFeaturedItemEdit } from '../actions/featuredContent';

export class FeaturedContentModal extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'onKeyUp');
  }

  componentWillMount() {
    document.addEventListener('keyup', this.onKeyUp);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.onKeyUp);
  }

  onKeyUp(event) {
    const isModalHidden = ReactDOM.findDOMNode(this).classList.contains('modal-hidden');
    const isKeyEscape = event.keyCode === ESCAPE_KEY_CODE;

    if (!isModalHidden && isKeyEscape) {
      this.props.onPressEscape();
    }
  }

  renderContent() {
    const { isEditing, editType } = this.props;

    if (!isEditing) {
      return <FeaturedItemSelector />;
    } else if (editType === 'externalResource') {
      return <ExternalResourceForm />;
    } else if (editType === 'story') {
      return <StoryForm />;
    } else if (editType === 'visualization') {
      return <ViewSelectorModal />;
    }
  }

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
}

FeaturedContentModal.propTypes = {
  isEditing: PropTypes.bool,
  editType: PropTypes.string,
  onPressEscape: PropTypes.func
};

function mapStateToProps(state) {
  return state.featuredContent;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onPressEscape: cancelFeaturedItemEdit
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FeaturedContentModal);
