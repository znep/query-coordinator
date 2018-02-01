import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { FeedbackPanel } from 'common/components';
import { FeatureFlags } from 'common/feature_flags';

import { updateName } from './actions';
import Alert from './components/Alert';
import AuthoringWorkflowModal from './components/AuthoringWorkflowModal';
import EditBar from './components/EditBar';
import EditMenu from './components/EditMenu';
import FilterBar from './components/FilterBar';
import InfoPane from './components/InfoPane';
import PreviewBar from './components/PreviewBar';
import ShareVisualizationModal from './components/ShareVisualizationModal';
import SigninModal from './components/SigninModal';
import Table from './components/Table';
import Visualizations from './components/Visualizations';
import { ModeStates } from './lib/constants';

const SHARE_BUTTON_ENABLED = {
  view: FeatureFlags.value('visualization_canvas_embed_button') === 'always',
  preview: FeatureFlags.value('visualization_canvas_embed_button') === 'always',
  edit: FeatureFlags.value('visualization_canvas_embed_button') !== 'never'
};

export class App extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, ['setSiteChromeVisibility', 'renderEditMode', 'renderPreviewMode', 'renderViewMode']);
  }

  componentDidMount() {
    this.setSiteChromeVisibility();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.mode !== this.props.mode) {
      this.setSiteChromeVisibility();
    }
  }

  setSiteChromeVisibility() {
    const { mode } = this.props;

    const adminHeader = document.body.querySelector('#site-chrome-admin-header');

    switch (mode) {
      case ModeStates.EDIT:
        document.body.classList.add('hide-site-chrome');
        document.body.classList.remove('preview-mode');
        if (adminHeader) {
          adminHeader.classList.add('site-chrome-small');
        }
        return;

      case ModeStates.PREVIEW:
        document.body.classList.remove('hide-site-chrome');
        document.body.classList.add('preview-mode');
        return;

      case ModeStates.VIEW:
        document.body.classList.remove('hide-site-chrome');
        document.body.classList.remove('preview-mode');
        return;

      default:
        return;
    }
  }

  renderEditMode() {
    const { onNameChanged, alert } = this.props;

    const alertBox = alert ? <Alert /> : null;
    const containerClasses = classNames({
      'alert-active': !_.isNull(alertBox)
    });

    return (
      <div className={containerClasses}>
        <EditBar />
        {alertBox}
        <div className="visualization-canvas-body edit-mode">
          <InfoPane onNameChanged={onNameChanged} />
          <FilterBar isReadOnly={false} />
          <Visualizations isEditable displayShareButtons={SHARE_BUTTON_ENABLED.edit} />
          <Table />
        </div>
        <AuthoringWorkflowModal />
        <ShareVisualizationModal />
        <SigninModal />
        <EditMenu />
      </div>
    );
  }

  renderPreviewMode() {
    return (
      <div>
        <PreviewBar />
        <div className="visualization-canvas-body preview-mode">
          <InfoPane />
          <FilterBar />
          <Visualizations displayShareButtons={SHARE_BUTTON_ENABLED.preview} />
          <Table />
          <FeedbackPanel {...window.serverConfig} />
        </div>
        <ShareVisualizationModal />
      </div>
    );
  }

  renderViewMode() {
    return (
      <div>
        <div className="visualization-canvas-body">
          <InfoPane />
          <FilterBar />
          <Visualizations displayShareButtons={SHARE_BUTTON_ENABLED.view} />
          <Table />
          <FeedbackPanel {...window.serverConfig} />
        </div>
        <ShareVisualizationModal />
      </div>
    );
  }

  render() {
    const { mode } = this.props;

    switch (mode) {
      case ModeStates.EDIT:
        return this.renderEditMode();
      case ModeStates.PREVIEW:
        return this.renderPreviewMode();
      case ModeStates.VIEW:
        return this.renderViewMode();

      default:
        throw new Error(`invalid mode: ${mode}`);
    }
  }
}

App.propTypes = {
  // App mode, e.g. edit, preview, or view
  mode: PropTypes.oneOf(_.values(ModeStates)).isRequired,

  // Function that responds to the viz-can name being changed
  onNameChanged: PropTypes.func.isRequired,

  // Information to display in an alert box
  alert: PropTypes.object
};

function mapStateToProps(state) {
  return _.pick(state, 'mode', 'alert');
}

function mapDispatchToProps(dispatch) {
  return {
    onNameChanged: name => dispatch(updateName({ name }))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
