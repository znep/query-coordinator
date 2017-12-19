import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { setAnalysis, setMethods } from '../../actions/editor';

// Configuration panel for methods and analysis.
export class MethodsPanel extends Component {
  render() {
    const { measure, onChangeAnalysis, onChangeMethods } = this.props;
    const methods = _.get(measure, 'metadata.methods', '');
    const analysis = _.get(measure, 'metadata.analysis', '');

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
  measure: PropTypes.shape({
    analysis: PropTypes.string,
    methods: PropTypes.string
  }),
  onChangeAnalysis: PropTypes.func,
  onChangeMethods: PropTypes.func
};

function mapStateToProps(state) {
  return state.editor.measure;
}

function mapDispatchToProps(dispatch) {
  const bindEventValue = (func) => (event) => func(event.currentTarget.value);

  return bindActionCreators({
    onChangeAnalysis: bindEventValue(setAnalysis),
    onChangeMethods: bindEventValue(setMethods)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MethodsPanel);
