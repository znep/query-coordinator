import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Provider } from 'react-redux';
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

export class App extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'setSiteChromeVisibility',
      'renderEditMode',
      'renderPreviewMode',
      'renderViewMode'
    ]);
  }

  componentDidMount() {
    this.setSiteChromeVisibility();
  }

  componentDidUpdate(prevProps) {
    const { store } = this.props;
    const { store: prevStore } = prevProps;
    const { mode } = store.getState();
    const { mode: prevMode } = prevStore.getState();

    if (prevMode !== mode) {
      this.setSiteChromeVisibility();
    }
  }

  setSiteChromeVisibility() {
    const { store } = this.props;
    const { mode } = store.getState();

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
    const { store } = this.props;

    return (
      <Provider store={store} >
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
      </Provider>
    );
  }

  renderPreviewMode() {
    const { store } = this.props;

    return (
      <Provider store={store} >
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
      </Provider>
    );
  }

  renderViewMode() {
    const { store } = this.props;

    return (
      <Provider store={store} >
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
      </Provider>
    );
  }

  render() {
    const { store } = this.props;
    const { mode } = store.getState();

    switch (mode) {
      case ModeStates.EDIT: return this.renderEditMode();
      case ModeStates.PREVIEW: return this.renderPreviewMode();
      case ModeStates.VIEW: return this.renderViewMode();

      default:
        throw new Error(`invalid mode: ${mode}`);
    }
  }
}

App.propTypes = {
  store: PropTypes.object.isRequired
};

export default App;
