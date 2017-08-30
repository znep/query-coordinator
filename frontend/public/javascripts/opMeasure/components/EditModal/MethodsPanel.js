import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { setAnalysis, setMethods } from '../../actions/editor';

// Configuration panel for methods and analysis.
export class MethodsPanel extends Component {
  render() {
    const { analysis, methods, onChangeAnalysis, onChangeMethods } = this.props;

    return (
      <form>
        <div className="configuration-field">
          <label className="block-label" htmlFor="methods">Methods</label>
          <textarea
            id="methods"
            className="text-input text-area"
            defaultValue={methods}
            onChange={onChangeMethods} />
        </div>
        <div className="configuration-field">
          <label className="block-label" htmlFor="analysis">Analysis</label>
          <textarea
            id="analysis"
            className="text-input text-area"
            defaultValue={analysis}
            onChange={onChangeAnalysis} />
        </div>
      </form>
    );
  }
}

MethodsPanel.propTypes = {
  analysis: PropTypes.string,
  methods: PropTypes.string,
  onChangeAnalysis: PropTypes.func,
  onChangeMethods: PropTypes.func
};

function mapStateToProps(state) {
  return state.editor.measure.metadata;
}

function mapDispatchToProps(dispatch) {
  const bindEventValue = (func) => (event) => func(event.currentTarget.value);

  return bindActionCreators({
    onChangeAnalysis: bindEventValue(setAnalysis),
    onChangeMethods: bindEventValue(setMethods)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MethodsPanel);
