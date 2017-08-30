import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import FeedbackPanel from '../common/components/FeedbackPanel';
import { ModeStates } from './lib/constants';
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
    if (prevProps.mode !== this.props.mode) {
      this.setSiteChromeVisibility();
    }
  }

  setSiteChromeVisibility() {
    switch (this.props.mode) {
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
    return (
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
    );
  }

  renderPreviewMode() {
    // TODO: Add <PreviewBar /> as first child of .preview-mode
    return (
      <div className="measure-body preview-mode">
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
    );
  }

  renderViewMode() {
    return (
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
    );
  }

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
}

App.propTypes = {
  mode: PropTypes.oneOf(_.values(ModeStates))
};

function mapStateToProps(state) {
  return state.view;
}

export default connect(mapStateToProps)(App);
