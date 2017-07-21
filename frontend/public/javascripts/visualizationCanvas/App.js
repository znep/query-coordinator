import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import FeedbackPanel from '../common/components/FeedbackPanel';
import { ModeStates } from './lib/constants';
import EditBar from './components/EditBar';
import PreviewBar from './components/PreviewBar';
import InfoPane from './components/InfoPane';
import AuthoringWorkflowModal from './components/AuthoringWorkflowModal';
import ShareVisualizationModal from './components/ShareVisualizationModal';
import EditMenu from './components/EditMenu';
import Visualizations from './components/Visualizations';
import Table from './components/Table';
import FilterBar from './components/FilterBar';
import { FeatureFlags } from 'common/feature_flags';

const SHARE_BUTTON_ENABLED = {
  view: FeatureFlags.value('visualization_canvas_embed_button') === 'always',
  preview: FeatureFlags.value('visualization_canvas_embed_button') === 'always',
  edit: FeatureFlags.value('visualization_canvas_embed_button') !== 'never'
};

export const App = React.createClass({
  propTypes: {
    mode: PropTypes.oneOf([ModeStates.EDIT, ModeStates.PREVIEW, ModeStates.VIEW]).isRequired
  },

  componentDidMount() {
    this.setSiteChromeVisibility();
  },

  componentDidUpdate(newProps) {
    if (newProps.mode !== this.props.mode) {
      this.setSiteChromeVisibility();
    }
  },

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
  },

  renderEditMode() {
    return (
      <div>
        <EditBar />
        <div className="visualization-canvas-body edit-mode">
          <InfoPane />
          <FilterBar isReadOnly={false} />
          <Visualizations isEditable displayShareButtons={SHARE_BUTTON_ENABLED.edit} />
          <Table />
        </div>
        <AuthoringWorkflowModal />
        <ShareVisualizationModal />
        <EditMenu />
        <FeedbackPanel {...window.serverConfig} />
      </div>
    );
  },

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
  },

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
  },

  render() {
    const { mode } = this.props;

    switch (mode) {
      case ModeStates.EDIT: return this.renderEditMode();
      case ModeStates.PREVIEW: return this.renderPreviewMode();
      case ModeStates.VIEW: return this.renderViewMode();

      default:
        throw new Error(`invalid mode: ${mode}`);
    }
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'mode');
}

export default connect(mapStateToProps)(App);
