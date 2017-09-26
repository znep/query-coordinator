import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Provider } from 'react-redux';

import FeedbackPanel from '../common/components/FeedbackPanel';
import { ModeStates } from './lib/constants';
import PreviewBar from './components/PreviewBar';
import EditBar from './components/EditBar';
import EditModal from './components/EditModal/EditModal';
import InfoPane from './components/InfoPane';
import PaneTabs from './components/PaneTabs';
import SummaryPane from './components/SummaryPane';
import MetadataPane from './components/MetadataPane';
import ReportingPeriodSelector from './components/ReportingPeriodSelector';
import MetricCard from './components/MetricCard';

// Outermost component for the page.
export class App extends Component {
  componentDidMount() {
    this.setSiteChromeVisibility();
  }

  componentDidUpdate(prevProps) {
    const { store } = this.props;
    const { store: prevStore } = prevProps;
    const { mode } = store.getState().view;
    const { mode: prevMode } = prevStore.getState().view;

    if (prevMode !== mode) {
      this.setSiteChromeVisibility();
    }
  }

  setSiteChromeVisibility() {
    const { store } = this.props;
    const { mode } = store.getState().view;

    switch (mode) {
      case ModeStates.EDIT:
        document.body.classList.add('hide-site-chrome');
        document.body.classList.remove('preview-mode');
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
        <div className="measure-body edit-mode">
          <EditBar />
          <InfoPane />
          <div className="measure-content">
            <div className="measure-panes">
              <PaneTabs />
              <SummaryPane />
              <MetadataPane />
            </div>

            <div className="measure-sidebar">
              <ReportingPeriodSelector />
              <MetricCard />
            </div>
          </div>
          <FeedbackPanel {...window.serverConfig} />
          <EditModal />
        </div>
      </Provider>
    );
  }

  renderPreviewMode() {
    const { store } = this.props;

    return (
      <Provider store={store}>
        <div className="measure-body preview-mode">
          <PreviewBar />
          <InfoPane />
          <div className="measure-content">
            <div className="measure-panes">
              <PaneTabs />
              <SummaryPane />
              <MetadataPane />
            </div>

            <div className="measure-sidebar">
              <ReportingPeriodSelector />
              <MetricCard />
            </div>
          </div>
          <FeedbackPanel {...window.serverConfig} />
        </div>
      </Provider>
    );
  }

  renderViewMode() {
    const { store } = this.props;

    return (
      <Provider store={store}>
        <div className="measure-body">
          <InfoPane />
          <div className="measure-content">
            <div className="measure-panes">
              <PaneTabs />
              <SummaryPane />
              <MetadataPane />
            </div>

            <div className="measure-sidebar">
              <ReportingPeriodSelector />
              <MetricCard />
            </div>
          </div>
          <FeedbackPanel {...window.serverConfig} />
        </div>
      </Provider>
    );
  }

  render() {
    const { store } = this.props;
    const { mode } = store.getState().view;

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
