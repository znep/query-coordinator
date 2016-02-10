import React from 'react';
import ReactDOM from 'react-dom';

import $ from 'jquery'; // eslint-disable-line
import './numberfilter.scss';
import FlannelUtils from '../../flannel/flannel';

class SocrataNumberfilter extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      hasLowerBound: false,
      hasUpperBound: false,
      lowerBound: null,
      upperBound: null,
      isCorrect: true,
      isApplicable: false,
      editingFieldRefName: null
    };

    this.handleKeyboardEvents = this.handleKeyboardEvents.bind(this);
  }

  // LIFECYCLE METHODS
  componentDidMount() {
    FlannelUtils.showOverlay();
  }
  componentDidUpdate() {
    if (this.state.editingFieldRefName) {
      ReactDOM.findDOMNode(this.refs[this.state.editingFieldRefName]).focus();
    }
  }

  formattedLabel() {
    var valuePresenter;

    if (ReactDOM.findDOMNode(this.refs.hasLowerBound).checked &&
      ReactDOM.findDOMNode(this.refs.hasUpperBound).checked) {
      valuePresenter = parseInt(ReactDOM.findDOMNode(this.refs.lower).value) + ' to ' +
        parseInt(ReactDOM.findDOMNode(this.refs.upper).value);
    } else if (ReactDOM.findDOMNode(this.refs.hasUpperBound).checked) {
      valuePresenter = 'less than ' + parseInt(ReactDOM.findDOMNode(this.refs.upper).value);
    } else if (ReactDOM.findDOMNode(this.refs.hasLowerBound).checked) {
      valuePresenter = 'more than ' + parseInt(ReactDOM.findDOMNode(this.refs.lower).value);
    } else {
      valuePresenter = '(all values)';
    }
    return valuePresenter;
  }
  validateFields() {
    var isCorrect;
    var isApplicable;

    if (ReactDOM.findDOMNode(this.refs.hasLowerBound).checked && ReactDOM.findDOMNode(this.refs.hasUpperBound).checked) {
      if (ReactDOM.findDOMNode(this.refs.lower).value.length > 0 &&
        ReactDOM.findDOMNode(this.refs.upper).value.length > 0) {
        isCorrect = (parseInt(ReactDOM.findDOMNode(this.refs.upper).value) > parseInt(ReactDOM.findDOMNode(this.refs.lower).value) ) ? true : false;
        isApplicable = (parseInt(ReactDOM.findDOMNode(this.refs.upper).value) > parseInt(ReactDOM.findDOMNode(this.refs.lower).value) ) ? true : false;
      } else {
        isCorrect = true;
        isApplicable = false;
      }
    } else if (ReactDOM.findDOMNode(this.refs.hasUpperBound).checked) {
      isCorrect = true;
      isApplicable = (ReactDOM.findDOMNode(this.refs.upper).value) ? true : false;
    } else if (ReactDOM.findDOMNode(this.refs.hasLowerBound).checked) {
      isCorrect = true;
      isApplicable = (ReactDOM.findDOMNode(this.refs.lower).value) ? true : false;
    } else {
      isCorrect = true;
      isApplicable = false;
    }

    var dir;

    if (ReactDOM.findDOMNode(this.refs.hasUpperBound).checked &&
      ReactDOM.findDOMNode(this.refs.hasLowerBound).checked) {
      dir = 'bt';
    } else if (ReactDOM.findDOMNode(this.refs.hasLowerBound).checked) {
      dir = 'gt';
    } else if (ReactDOM.findDOMNode(this.refs.hasUpperBound).checked) {
      dir = 'lt';
    }

    var filterObj = {
      dir: dir,
      val1: parseInt(ReactDOM.findDOMNode(this.refs.lower).value) || null,
      val2: parseInt(ReactDOM.findDOMNode(this.refs.upper).value) || null
    };

    this.props.dataHandler(this.formattedLabel(), filterObj, isApplicable, isCorrect);
  }

  onClickLimitCheckbox(whichBound) {
    if (whichBound == 'lower') {
      this.setState({
        hasLowerBound: ReactDOM.findDOMNode(this.refs.hasLowerBound).checked,
        editingFieldRefName: whichBound
      });
    } else {
      this.setState({
        hasUpperBound: ReactDOM.findDOMNode(this.refs.hasUpperBound).checked,
        editingFieldRefName: whichBound
      });
    }
    this.validateFields();
  }
  onClickInputBound(whichBound) {
    var stateObj = {
      editingFieldRefName: whichBound
    };

    if (whichBound == 'lower') {
      if (!ReactDOM.findDOMNode(this.refs.hasLowerBound).checked) {
        stateObj.hasLowerBound = true;
        ReactDOM.findDOMNode(this.refs.hasLowerBound).checked = true;
      }
    } else {
      if (!ReactDOM.findDOMNode(this.refs.hasUpperBound).checked) {
        stateObj.hasUpperBound = true;
        ReactDOM.findDOMNode(this.refs.hasUpperBound).checked = true;
      }
    }
    this.setState(stateObj);
    this.validateFields();
  }
  onChangeInputBound(whichBound) {
    if (whichBound == 'lower') {
      this.setState({ lowerBound: parseInt(this.refs.lower.value, 10) });
    } else {
      this.setState({ upperBound: parseInt(this.refs.upper.value, 10) });
    }
    this.validateFields();
  }



  handleKeyboardEvents(e) {
    if (e.keyCode == 13) {
      // press enter(return) key
      this.props.remoteApply();
    }
  }

  render() {
    var disabledLowerValue = this.state.hasLowerBound ? false : true;
    var disabledUpperValue = this.state.hasUpperBound ? false : true;

    return (
      <div className="qfb-filter-item-flannel-numberfilter">
        <div className="qfb-filter-item-flannel-numberfilter-part">
          <label onClick={ this.onClickLimitCheckbox.bind(this, 'lower') }>
            <input type="checkbox" ref="hasLowerBound" /> Min
          </label>
          <br/>
          <input type="number" pattern="[0-9]*"
            className={ disabledLowerValue && 'disabled' }
            disabled={ disabledLowerValue && 'true' }
            ref="lower"
            onClick={ this.onClickInputBound.bind(this, 'lower') }
            onChange={ this.onChangeInputBound.bind(this, 'lower') }
            onKeyDown={ this.handleKeyboardEvents }
            value={ this.state.lowerBound } />
        </div>
        <div className="qfb-filter-item-flannel-numberfilter-seperator">to</div>
        <div className="qfb-filter-item-flannel-numberfilter-part">
          <label onClick={ this.onClickLimitCheckbox.bind(this, 'upper') }>
            <input type="checkbox" ref="hasUpperBound" /> Max
          </label>
          <br/>
          <input type="number" pattern="[0-9]*"
            className={ disabledUpperValue && 'disabled' }
            disabled={ disabledUpperValue && 'true' }
            ref="upper"
            onClick={ this.onClickInputBound.bind(this, 'upper') }
            onChange={ this.onChangeInputBound.bind(this, 'upper') }
            onKeyDown={ this.handleKeyboardEvents }
            value={ this.state.upperBound } />
        </div>
      </div>
    );
  }
}

SocrataNumberfilter.propTypes = {
  componentId: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  dataHandler: React.PropTypes.func.isRequired,
  remoteApply: React.PropTypes.func
};

export default SocrataNumberfilter;
