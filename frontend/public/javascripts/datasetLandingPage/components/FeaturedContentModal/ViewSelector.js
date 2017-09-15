import _ from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ViewCard } from 'common/components';
import { getViewCardPropsForView } from '../../../common/helpers/viewCardHelpers';

export class ViewSelector extends Component {
  constructor(props) {
    super(props);
    this.I18n = I18n.featured_content_modal.internal_resource_selector;
  }

  renderChooseButton(viewUid) {
    const { onClickChoose, isSaving, isSaved, isSavingViewUid, hasSaveError } = this.props;
    const isSavingSelf = (isSavingViewUid === viewUid);
    const renderSavingButton = (isSaving && isSavingSelf);
    const renderSavedButton = (isSaved && isSavingSelf);
    const renderErrorButton = (hasSaveError && isSavingSelf);

    const chooseButtonClassName = classNames({
      'btn': true,
      'btn-primary': true,
      'view-select': true,
      'btn-busy': renderSavingButton,
      'btn-success': renderSavedButton,
      'btn-error': renderErrorButton
    });

    let chooseButtonContents;

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
  }

  render() {
    const { viewList, renderNoViews } = this.props;
    let viewContent;

    if (viewList.length === 0) {
      viewContent = renderNoViews();
    } else {
      viewContent = _.map(viewList, (relatedView, i) => (
        <ViewCard {...getViewCardPropsForView(relatedView)} key={i}>
          {this.renderChooseButton(relatedView.id)}
        </ViewCard>
      ));
    }

    return (
      <div className="internal-view-list">
        {viewContent}
      </div>
    );
  }
}

ViewSelector.propTypes = {
  hasSaveError: PropTypes.bool,
  isSaved: PropTypes.bool,
  isSaving: PropTypes.bool,
  isSavingViewUid: PropTypes.string,
  onClickChoose: PropTypes.func,
  renderNoViews: PropTypes.func,
  viewList: PropTypes.array.isRequired
};

export default ViewSelector;
