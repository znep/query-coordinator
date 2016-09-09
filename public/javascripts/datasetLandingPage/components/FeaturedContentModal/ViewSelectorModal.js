import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import {
  cancelFeaturedItemEdit,
  saveFeaturedItem,
  requestDerivedViews
} from '../../actions/featuredContent';
import BootstrapAlert from '../BootstrapAlert';
import FeaturedContentModalHeader from './FeaturedContentModalHeader';
import FormFooter from './FormFooter';
import ViewSelector from './ViewSelector';

export var ViewSelectorModal = React.createClass({
  propTypes: {
    bootstrapUrl: PropTypes.string,
    hasSaveError: PropTypes.bool,
    hasViewFetchError: PropTypes.bool,
    isLoading: PropTypes.bool,
    isSaving: PropTypes.bool,
    isSavingViewUid: PropTypes.string,
    isSaved: PropTypes.bool,
    onClickCancel: PropTypes.func,
    onClickChoose: PropTypes.func,
    onClickClose: PropTypes.func,
    fetchViews: PropTypes.func,
    viewList: PropTypes.array.isRequired
  },

  componentWillMount() {
    this.props.fetchViews();
  },

  componentDidMount() {
    ReactDOM.findDOMNode(this).querySelector('h2').focus();
  },

  I18n: I18n.featured_content_modal.view_selector_modal,

  renderBackButton() {
    var { onClickCancel } = this.props;
    return (
      <button className="btn btn-default btn-simple btn-xs back-button" onClick={onClickCancel}>
        <span className="icon-arrow-prev" />
        {I18n.back}
      </button>
    );
  },

  renderContent() {
    var {
      hasSaveError,
      hasViewFetchError,
      isLoading,
      isSaved,
      isSaving,
      isSavingViewUid,
      onClickChoose,
      viewList
    } = this.props;

    if (isLoading) {
      return (
        <span className="spinner-default spinner-large" />
      );
    } else if (hasViewFetchError) {
      return (
        <div className="alert warning">
          <span>{this.I18n.view_fetch_error}</span>
        </div>
      );
    } else {
      var viewSelectorProps = {
        hasSaveError: hasSaveError,
        isSaved: isSaved,
        isSaving: isSaving,
        isSavingViewUid: isSavingViewUid,
        onClickChoose: onClickChoose,
        renderNoViews: this.renderNoViews,
        viewList: viewList
      };

      return (
        <ViewSelector {...viewSelectorProps} />
      );
    }
  },

  renderNoViews() {
    var { bootstrapUrl } = this.props;

    return <BootstrapAlert bootstrapUrl={bootstrapUrl} />;
  },

  renderFooter() {
    var { onClickCancel } = this.props;
    var footerProps = {
      cancelText: I18n.cancel,
      onClickCancel: onClickCancel
    };

    return <FormFooter {...footerProps} />;
  },

  renderSaveError() {
    var { hasSaveError } = this.props;
    if (hasSaveError) {
      return (
        <div className="alert error">{I18n.featured_content_modal.save_error_message}</div>
      );
    }
  },

  render() {
    var { onClickClose } = this.props;

    return (
      <div className="modal-container">
        <FeaturedContentModalHeader onClickClose={onClickClose} />

        <div className="modal-content">
          <div className="container">
            {this.renderBackButton()}
            <h2 tabIndex="0">{this.I18n.header}</h2>
            <p>{this.I18n.message}</p>
            {this.renderSaveError()}
            {this.renderContent()}
          </div>
        </div>

        {this.renderFooter()}
      </div>
    );
  }
});

// Merge state.featuredContent.externalResource to top-level for convenience.
function mapStateToProps(state) {
  return {
    bootstrapUrl: state.view.bootstrapUrl,
    ...state.featuredContent,
    ...state.featuredContent.viewSelector
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onClickCancel() {
      dispatch(cancelFeaturedItemEdit());
    },

    onClickChoose(uid) {
      dispatch(saveFeaturedItem({
        featuredLensUid: uid
      }));
    },

    onClickClose() {
      dispatch(cancelFeaturedItemEdit());
    },

    fetchViews() {
      dispatch(requestDerivedViews());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewSelectorModal);
