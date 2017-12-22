import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';

import FeedbackPanel from '../common/components/FeedbackPanel';
import { ModeStates } from './lib/constants';
import PreviewBar from './components/PreviewBar';
import EditBar from './components/EditBar';
import EditModal from './components/EditModal/EditModal';
import InfoPane from './components/InfoPane';
import PaneTabs from './components/PaneTabs';
import SummaryPane from './components/SummaryPane';
import MetadataPane from './components/MetadataPane';

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

    const { mode } = this.props;

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

  render() {
    const { activePane, mode } = this.props;

    const isEditing = mode === ModeStates.EDIT;
    const isPreviewing = mode === ModeStates.PREVIEW;

    const measureBodyClasses = classnames('measure-body', {
      'edit-mode': isEditing,
      'preview-mode': isPreviewing
    });

    return (
      <div className={measureBodyClasses}>
        {isPreviewing && <PreviewBar />}
        {isEditing && <EditBar />}

        <div>
          <InfoPane />
          <div className="measure-content">
            <div className="measure-panes">
              <PaneTabs />
              {activePane === 'summary' && <SummaryPane />}
              {activePane === 'metadata' && <MetadataPane />}
            </div>
          </div>
          <FeedbackPanel {...window.serverConfig} />
        </div>

        {isEditing && <EditModal />}
      </div>
    );
  }
}

App.propTypes = {
  activePane: PropTypes.string.isRequired,
  mode: PropTypes.oneOf(_.values(ModeStates)).isRequired
};

App.defaultProps = {
  activePane: 'summary'
};

function mapStateToProps(state) {
  return state.view;
}

export default connect(mapStateToProps)(App);
