import _ from 'lodash';
import classNames from 'classnames';
import React, { PropTypes } from 'react';
import ViewWidget from '../ViewWidget';

export var ViewSelector = React.createClass({
  propTypes: {
    hasSaveError: PropTypes.bool,
    isSaved: PropTypes.bool,
    isSaving: PropTypes.bool,
    isSavingViewUid: PropTypes.string,
    onClickChoose: PropTypes.func,
    renderNoViews: PropTypes.func,
    viewList: PropTypes.array.isRequired
  },

  I18n: I18n.featured_content_modal.internal_resource_selector,

  renderChooseButton: function(viewUid) {
    var { onClickChoose, isSaving, isSaved, isSavingViewUid, hasSaveError } = this.props;
    var isSavingSelf = (isSavingViewUid === viewUid);
    var renderSavingButton = (isSaving && isSavingSelf);
    var renderSavedButton = (isSaved && isSavingSelf);
    var renderErrorButton = (hasSaveError && isSavingSelf);

    var chooseButtonClassName = classNames({
      'btn': true,
      'btn-primary': true,
      'view-select': true,
      'btn-busy': renderSavingButton,
      'btn-success': renderSavedButton,
      'btn-error': renderErrorButton
    });

    var chooseButtonContents;

    if (renderSavingButton) {
      chooseButtonContents = <div className="spinner-default spinner-btn-primary" />;
    } else if (renderSavedButton) {
      chooseButtonContents = `${I18n.saved}!`;
    } else if (renderErrorButton) {
      chooseButtonContents = I18n.error;
    } else {
      chooseButtonContents = I18n.choose;
    }

    return (
      <button
        className={chooseButtonClassName}
        disabled={renderSavingButton}
        onClick={_.partial(onClickChoose, viewUid)}>
        {chooseButtonContents}
      </button>
    );
  },

  render: function() {
    var { viewList, renderNoViews } = this.props;
    var renderChooseButton = this.renderChooseButton;
    var viewContent;

    if (viewList.length === 0) {
      viewContent = renderNoViews();
    } else {
      viewContent = _.map(viewList, function(relatedView, i) {
        return (
          <ViewWidget {...relatedView} key={i}>
            {renderChooseButton(relatedView.id)}
          </ViewWidget>
        );
      });
    }

    return (
      <div className="internal-view-list">
        {viewContent}
      </div>
    );
  }
});

export default ViewSelector;
