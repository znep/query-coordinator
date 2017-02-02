import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { VelocityComponent } from 'velocity-react';
import EditBar from './components/EditBar';
import PreviewBar from './components/PreviewBar';
import InfoPane from './components/InfoPane';
import AddVisualizationButton from './components/AddVisualizationButton';
import AuthoringWorkflowModal from './components/AuthoringWorkflowModal';
import EditMenu from './components/EditMenu';
import EditableVisualizations from './components/EditableVisualizations';
import Visualizations from './components/Visualizations';
import Table from './components/Table';
import FilterBar from './components/FilterBar';

export const App = React.createClass({
  propTypes: {
    mode: PropTypes.oneOf(['edit', 'preview']).isRequired
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

    if (mode === 'edit') {
      document.body.classList.add('hide-site-chrome');
      document.body.classList.remove('preview-mode');
    } else {
      document.body.classList.remove('hide-site-chrome');
      document.body.classList.add('preview-mode');
    }
  },

  /* EditableVisualizations are visualization with an edit button
     See EditableVisualizations component for a more verbose explanation
  */
  renderEditMode() {
    return (
      <div>
        <EditBar />
        <div className="visualization-canvas-body">
          <InfoPane />
          <FilterBar />
          <AddVisualizationButton />
          <EditableVisualizations />
          <Table />
        </div>
        <AuthoringWorkflowModal />
        <EditMenu />
      </div>
    );
  },

  renderPreviewMode() {
    return (
      <div>
        <PreviewBar />
        <div className="visualization-canvas-body">
          <InfoPane />
          <FilterBar />
          <Visualizations />
          <Table />
        </div>
      </div>
    );
  },

  render() {
    const { mode } = this.props;
    let contents;

    switch (mode) {
      case 'edit':
        contents = this.renderEditMode();
        break;

      case 'preview':
        contents = this.renderPreviewMode();
        break;

      default:
        throw new Error(`invalid mode: ${mode}`);
    }

    return (
      <VelocityComponent animation={{ opacity: 1 }} runOnMount duration={275}>
        <div style={{ opacity: 0 }}>
          {contents}
        </div>
      </VelocityComponent>
    );
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'mode');
}

export default connect(mapStateToProps)(App);
