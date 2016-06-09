import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import ExternalResourceForm from './FeaturedContentModal/ExternalResourceForm';
import FeaturedItemSelector from './FeaturedContentModal/FeaturedItemSelector';
import StoryForm from './FeaturedContentModal/StoryForm';
import { cancelFeaturedItemEdit } from '../actions/featuredContent';

export var FeaturedContentModal = React.createClass({
  propTypes: {
    onCloseModal: PropTypes.func,
    isEditing: PropTypes.bool,
    editType: PropTypes.string
  },

  renderContent: function() {
    var { isEditing, editType } = this.props;

    if (!isEditing) {
      return <FeaturedItemSelector />;
    } else if (editType === 'externalResource') {
      return <ExternalResourceForm />;
    } else if (editType === 'story') {
      return <StoryForm />;
    }
  },

  render: function() {
    var { onCloseModal } = this.props;

    var modalClassNames = 'modal modal-overlay modal-full modal-hidden';

    return (
      <div id="featured-content-modal" className={modalClassNames} data-modal-dismiss>
        <div className="modal-container">
          <header className="modal-header">
            <h1>{I18n.featured_content_modal.header}</h1>

            <button
              className="btn btn-transparent modal-header-dismiss"
              data-modal-dismiss
              aria-label={I18n.close}
              onClick={onCloseModal}>
              <span className="icon-close-2" />
            </button>
          </header>

          {this.renderContent()}
        </div>
      </div>
    );
  }
});

function mapStateToProps(state) {
  return state.featuredContent;
}

function mapDispatchToProps(dispatch) {
  return {
    onCloseModal: function() {
      dispatch(cancelFeaturedItemEdit());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(FeaturedContentModal);
