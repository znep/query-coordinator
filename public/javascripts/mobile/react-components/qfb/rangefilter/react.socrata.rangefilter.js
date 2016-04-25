import React from 'react';
import ReactDOM from 'react-dom';

import $ from 'jquery'; // eslint-disable-line
import InputRange from 'react-input-range';
import './rangefilter.scss';
// import FlannelUtils from '../../flannel/flannel';

class SocrataRangeFilter extends React.Component {

  constructor(props) {
    super(props);

    this.domain = this.props.scale;

    if (this.props.isLarge) {
      console.log('This is a large dataset');
    } else {
      console.log('This is a small dataset');
    }

    if (this.props.isLarge) {
      this.state = {
        values: {
          min: 0,
          max: this.domain.length - 1
        },
        valueLabels: {
          min: 'No Min',
          max: 'No Max'
        }
      };

    } else {
      this.state = {
        values: {
          min: this.props.rangeMin,
          max: this.props.rangeMax
        },
        inputValue: {
          lower: this.props.rangeMin,
          upper: this.props.rangeMax
        },
        errorBoundary: {
          lower: false,
          upper: false
        }
      };
    }

  }

  componentDidMount() {
    if(this.props.isLarge) {
      var filterObj = {
        dir: 'bt',
        val1: this.domain[0],
        val2: this.domain[this.domain.length-1]
      };

      this.props.dataHandler('(all values)', filterObj, true, true);
    } else {
      var filterObj = {
        dir: 'bt',
        val1: this.props.rangeMin,
        val2: this.props.rangeMax
      };

      this.props.dataHandler('(all values)', filterObj, true, true);
    }
  }

  onChangeVal(whichBound, e) {

    if(whichBound == 'lower') {
      // Changing LOWER range limit
      this.setState({
        inputValue: {
          lower: e.target.value,
          upper: this.state.inputValue.upper
        }
      });

      // VALIDATION
      if(e.target.value == '') {
        this.setState({
          values: {
            min: this.props.rangeMin,
            max: this.state.values.max
          }
        }, function() {
          var filterObj = {
            dir: 'bt',
            val1: this.state.values.min,
            val2: this.state.values.max
          };
          this.props.dataHandler(filterObj.val1 + ' - ' + filterObj.val2, filterObj, true, true);
        });
        this.props.warningHandler(false, '');
        this.setState({ errorBoundary: {
            lower: false,
            upper: this.state.errorBoundary.upper
          }
        });
      } else if(e.target.value > this.state.values.max) {
        // lower bound is greater than upper bound ---- Warning!
        this.props.warningHandler(true, 'The min cannot exceed the max');
        this.setState({ errorBoundary: {
            lower: true,
            upper: this.state.errorBoundary.upper
          }
        });
      } else if(e.target.value > this.props.rangeMax || e.target.value < this.props.rangeMin ) {
        // lower bound exceeds either upper or lower limit ---- Warning!
        this.props.warningHandler(true, 'The min cannot exceed range limits');
        this.setState({ errorBoundary: {
            lower: true,
            upper: this.state.errorBoundary.upper
          }
        });
      } else {

        this.setState({
          values: {
            min: parseFloat(e.target.value),
            max: this.state.values.max
          }
        }, function() {
          var filterObj = {
            dir: 'bt',
            val1: this.state.values.min,
            val2: this.state.values.max
          };
          this.props.dataHandler(filterObj.val1 + ' - ' + filterObj.val2, filterObj, true, true);
        });
        this.props.warningHandler(false, '');
        this.setState({ errorBoundary: {
            lower: false,
            upper: this.state.errorBoundary.upper
          }
        });
      }
    } else {
      // Changing UPPER range limit
      this.setState({
        inputValue: {
          lower: this.state.inputValue.lower,
          upper: e.target.value
        }
      });

      // VALIDATION
      if(e.target.value == '') {
        console.log('validation stuck 1');
        this.setState({
          values: {
            min: this.state.values.min,
            max: this.props.rangeMax
          }
        }, function() {
          var filterObj = {
            dir: 'bt',
            val1: this.state.values.min,
            val2: this.state.values.max
          };
          this.props.dataHandler(filterObj.val1 + ' - ' + filterObj.val2, filterObj, true, true);
        });
        this.props.warningHandler(false, '');
        this.setState({ errorBoundary: {
            lower: this.state.errorBoundary.lower,
            upper: false
          }
        });
      } else if(e.target.value < this.state.values.min) {
        // upper bound is greater than lower bound ---- Warning!
        this.props.warningHandler(true, 'The max cannot be smaller than the min');
        this.setState({ errorBoundary: {
            lower: this.state.errorBoundary.lower,
            upper: true
          }
        });
      } else if(e.target.value > this.props.rangeMax || e.target.value < this.props.rangeMin ) {
        console.log('validation stuck 3');
        // upper bound exceeds either upper or lower limit ---- Warning!
        this.props.warningHandler(true, 'The max cannot exceed range limits');
        this.setState({ errorBoundary: {
            lower: this.state.errorBoundary.lower,
            upper: true
          }
        });
      } else {
        this.setState({
          values: {
            min: this.state.values.min,
            max: parseFloat(e.target.value)
          }
        }, function() {
          var filterObj = {
            dir: 'bt',
            val1: this.state.values.min,
            val2: this.state.values.max
          };
          this.props.dataHandler(filterObj.val1 + ' - ' + filterObj.val2, filterObj, true, true);
        });
        this.props.warningHandler(false, '');
        this.setState({ errorBoundary: {
            lower: this.state.errorBoundary.lower,
            upper: false
          }
        });
      }
    }
  }

  handleValuesChange(component, values) {

    var formattedLabel = '';
    var filterObj = {};

    if(this.props.isLarge) {
      var labelsObject = {
        min: (values.min == this.domain[0]) ? 'No Min' : this.domain[values.min],
        max: (values.max == this.domain.length - 1) ? 'No Max' : this.domain[values.max]
      };

      this.setState({
        values: values,
        valueLabels: labelsObject
      });

      if (values.min == 0 && values.max == this.domain.length - 1)
      {
        formattedLabel = '(all values)';
        filterObj['dir'] = null;
      }
        else if (values.min == 0)
      {
        formattedLabel = 'Less than ' + values.max;
        filterObj['dir'] = 'lt';
      }
        else if (values.max == this.domain.length - 1)
      {
        formattedLabel = 'More than ' + values.min;
        filterObj['dir'] = 'gt';
      } else {
        formattedLabel = values.min + ' - ' + values.max;
        filterObj['dir'] = 'bt';
      }

      filterObj['val1'] = values.min == 0 ? null : this.domain[values.min];
      filterObj['val2'] = values.max == this.domain.length - 1 ? null : this.domain[values.max];

      this.props.dataHandler(formattedLabel, filterObj, true, true);
    } else {
      this.setState({
        values: values,
        inputValue: {
          lower: values.min,
          upper: values.max,
        }
      });

      console.log(this.props.rangeMin);
      if (values.min == this.props.rangeMin && values.max == this.props.rangeMax)
        {
          formattedLabel = '(all values)';
          filterObj['dir'] = null;
        }
          else if (values.min == this.props.rangeMin)
        {
          formattedLabel = 'Less than ' + values.max;
          filterObj['dir'] = 'lt';
        }
          else if (values.max == this.props.rangeMax)
        {
          formattedLabel = 'More than ' + values.min;
          filterObj['dir'] = 'gt';
        } else {
          formattedLabel = values.min + ' - ' + values.max;
          filterObj['dir'] = 'bt';
        }

        filterObj['val1'] = values.min == this.props.rangeMin ? null : values.min;
        filterObj['val2'] = values.max == this.props.rangeMax ? null : values.max;

        this.props.dataHandler(formattedLabel, filterObj, true, true);
      }
  }

  render() {

    if (this.props.isLarge) {
      return (<div className="large-dataset">
        <InputRange
              minValue={ 0 }
              maxValue={ this.domain.length - 1 }
              step={1}
              value={ this.state.values }
              onChange={ this.handleValuesChange.bind(this) } />
        <div className="rangeLabels">
          <div>{ this.state.valueLabels.min }</div>
          <div>{ this.state.valueLabels.max }</div>
        </div>
      </div>);
    } else {
      var inputClassLower = "range-input-field range-input-field-lower";
      inputClassLower = this.state.errorBoundary.lower ? inputClassLower + " is-error" : inputClassLower;

      var inputClassUpper = "range-input-field range-input-field-upper";
      inputClassUpper = this.state.errorBoundary.upper ? inputClassUpper + " is-error" : inputClassUpper;

      return (<div className="small-dataset">
        <InputRange
              minValue={ this.props.rangeMin }
              maxValue={ this.props.rangeMax }
              step={1}
              value={ this.state.values }
              onChange={ this.handleValuesChange.bind(this) } />
        <div className="range-inputs-container">
          <div className="range-input-part">
            <input type="number" pattern="[0-9]*"
              className={ inputClassLower }
              placeholder="Lower limit"
              value={ this.state.inputValue.lower }
              onChange={ this.onChangeVal.bind(this, 'lower') }/>
          </div>
          <div className="range-input-part">
            <input type="number" pattern="[0-9]*"
              className={ inputClassUpper }
              placeholder="Upper limit"
              value={ this.state.inputValue.upper }
              onChange={ this.onChangeVal.bind(this, 'upper') }/>
          </div>
        </div>
      </div>);
    }
  }

}

SocrataRangeFilter.propTypes = {
  componentId: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  scale: React.PropTypes.array,
  rangeMin: React.PropTypes.number,
  rangeMax: React.PropTypes.number
};

export default SocrataRangeFilter;
