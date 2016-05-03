import React from 'react';

import $ from 'jquery'; // eslint-disable-line
import InputRange from 'react-input-range';
import './rangefilter.scss';

class SocrataRangeFilter extends React.Component {

  constructor(props) {
    super(props);

    if (this.props.isLarge) {
      this.domain = this.props.scale;

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
      if (this.props.type == 'calendar_date') {
        this.domain = this.props.scale;

        this.lowerIndex = 0;
        this.upperIndex = this.domain.length - 1;

        this.state = {
          values: {
            min: 0,
            max: this.domain.length - 1
          },
          inputValue: {
            lower: this.inputFieldDate(this.domain[0]),
            upper: this.inputFieldDate(this.domain[this.domain.length - 1])
          },
          errorBoundary: {
            lower: false,
            upper: false
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
  }

  componentDidMount() {

    var filterObj = { dir: 'bt' };
    if (this.props.isLarge) {
      filterObj.val1 = this.domain[0];
      filterObj.val2 = this.domain[this.domain.length - 1];
    } else {
      filterObj.val1 = this.props.rangeMin;
      filterObj.val2 = this.props.rangeMax;
    }

    this.props.dataHandler('(all values)', filterObj, true, true);
  }

  onChangeNumericInputs(whichBound, e) {

    this.changing = whichBound;

    if (whichBound == 'lower') {
      var lowerValue = (e.target.value == '') ? this.props.rangeMin : parseFloat(e.target.value);

      this.setState({
        inputValue: {
          lower: e.target.value,
          upper: this.state.inputValue.upper
        },
        values: {
          min: lowerValue,
          max: this.state.values.max
        }
      }, this.validateNumericData);
    } else {
      var upperValue = (e.target.value == '') ? this.props.rangeMax : parseFloat(e.target.value);

      this.setState({
        inputValue: {
          lower: this.state.inputValue.lower,
          upper: e.target.value
        },
        values: {
          min: this.state.values.min,
          max: upperValue
        }
      }, this.validateNumericData);
    }
  }

  onChangeDateInputs(whichBound, e) {

    this.changing = whichBound;
    var selectedDate = new Date(e.target.value);

    if (whichBound == 'lower') {

      for (var i = 0; i < this.domain.length - 1; i++) {
        if (selectedDate.getTime() >= this.domain[i].getTime() && selectedDate.getTime() < this.domain[i + 1].getTime()) {
          this.lowerIndex = i;
        } else if (selectedDate.getTime() >= this.domain[this.domain.length - 1].getTime()) {
          this.lowerIndex = this.domain.length - 1;
        } else if (selectedDate.getTime() <= this.domain[0].getTime())  {
          this.lowerIndex = 0;
        }
      }

      if (selectedDate.getTime() > this.domain[this.upperIndex].getTime()) {
        this.setState({
          inputValue: {
            lower: e.target.value,
            upper: this.state.inputValue.upper
          },
          errorBoundary: {
            lower: true,
            upper: false
          }
        });
        this.props.warningHandler(true, 'Min cannot exceed Max');
      } else {
        this.props.warningHandler(false, '');

        this.setState({
          values: {
            min: this.lowerIndex,
            max: this.state.values.max
          },
          inputValue: {
            lower: e.target.value,
            upper: this.state.inputValue.upper
          },
          errorBoundary: {
            lower: false,
            upper: false
          }
        }, function() {

          var filterObj = {
            dir: 'bt',
            val1: this.timeStamp(this.domain[this.state.values.min]),
            val2: this.timeStamp(this.domain[this.state.values.max])
          };
          this.props.dataHandler(
            this.displayDate(this.domain[this.state.values.min]) + ' - ' +
            this.displayDate(this.domain[this.state.values.max]), filterObj, true, true);
        });

      }

    } else if (whichBound == 'upper') {
      for (var j = 1; j < this.domain.length; j++) {
        if (selectedDate.getTime() <= this.domain[j].getTime() && selectedDate.getTime() > this.domain[j - 1].getTime()) {
          this.upperIndex = j;
        } else if (selectedDate.getTime() <= this.domain[0].getTime()) {
          this.upperIndex = 0;
        } else if (selectedDate.getTime() > this.domain[this.domain.length - 1].getTime())  {
          this.upperIndex = this.domain.length - 1;
        }
      }

      if (selectedDate.getTime() < this.domain[this.lowerIndex].getTime()) {
        this.setState({
          inputValue: {
            lower: this.state.inputValue.lower,
            upper: e.target.value
          },
          errorBoundary: {
            lower: false,
            upper: true
          }
        });
        this.props.warningHandler(true, 'Max cannot be smaller than Min');
      } else {
        this.props.warningHandler(false, '');
        this.setState({
          values: {
            min: this.state.values.min,
            max: this.upperIndex
          },
          inputValue: {
            lower: this.state.inputValue.lower,
            upper: e.target.value
          },
          errorBoundary: {
            lower: false,
            upper: false
          }
        }, function() {

          var filterObj = {
            dir: 'bt',
            val1: this.inputFieldDate(this.domain[this.state.values.min]),
            val2: this.inputFieldDate(this.domain[this.state.values.max])
          };
          this.props.dataHandler(
            this.displayDate(this.domain[this.state.values.min]) + ' - ' +
            this.displayDate(this.domain[this.state.values.max]), filterObj, true, true);
        });
      }
    }
  }

  validateNumericData() {
    if (this.state.values.min > this.state.values.max) {

      if (this.changing == 'upper') {
        this.setState({ errorBoundary: {
            lower: false,
            upper: true
          }
        });
        this.props.warningHandler(true, 'Max cannot be smaller than Min');
      } else if (this.changing == 'lower') {
        this.setState({ errorBoundary: {
            lower: true,
            upper: false
          }
        });
        this.props.warningHandler(true, 'Min cannot exceed Max');
      }
    } else {
      var filterObj = {
        dir: 'bt',
        val1: this.state.values.min,
        val2: this.state.values.max
      };
      this.setState({ errorBoundary: {
          lower: false,
          upper: false
        }
      });
      this.props.warningHandler(false, '');
      this.props.dataHandler(filterObj.val1 + ' - ' + filterObj.val2, filterObj, true, true);
    }
  }

  inputFieldDate(dateObject) {

    var yyyy = dateObject.getFullYear().toString();
    var mm = (dateObject.getMonth() + 1).toString();
    var dd  = dateObject.getDate().toString();

    return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]);
  }

  displayDate(dateObject) {

    var yyyy = dateObject.getFullYear().toString();
    var mm = (dateObject.getMonth() + 1).toString();
    var dd  = dateObject.getDate().toString();

    return (mm[1] ? mm : '0' + mm[0]) + '/' + (dd[1] ? dd : '0' + dd[0]) + '/' + yyyy;
  }

  timeStamp(dateObject) {

    var aMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return aMonths[dateObject.getMonth()] + '-' + dateObject.getFullYear();
  }

  handleValuesChange(component, values) {

    var formattedLabel = '';
    var filterObj = {};
    this.lowerIndex = values.min;
    this.upperIndex = values.max;

    if (this.props.isLarge) {
      if (this.props.type == 'calendar_date') {
        var lowerDate = this.timeStamp(this.domain[values.min]);
        var upperDate = this.timeStamp(this.domain[values.max]);

        var labelsObject = {
          min: (values.min == 0) ? 'No Min' : lowerDate,
          max: (values.max == this.domain.length - 1) ? 'No Max' : upperDate
        };
      } else {
        labelsObject = {
          min: (values.min == this.domain[0]) ? 'No Min' : this.domain[values.min],
          max: (values.max == this.domain.length - 1) ? 'No Max' : this.domain[values.max]
        };
      }

      this.setState({
        values: values,
        valueLabels: labelsObject
      });

      if (values.min == 0 && values.max == this.domain.length - 1) {
        formattedLabel = '(all values)';
        filterObj.dir = null;
      } else if (values.min == 0) {
        filterObj.dir = 'lt';
        formattedLabel = 'Less than ' + this.formattedLabel(values.max);
      } else if (values.max == this.domain.length - 1) {
        filterObj.dir = 'gt';
        formattedLabel = 'More than ' + this.formattedLabel(values.min);
      } else {
        filterObj.dir = 'bt';
        formattedLabel = this.formattedLabel(values.min) + ' - ' + this.formattedLabel(values.max);
      }

      filterObj.val1 = values.min == 0 ? null : this.domain[values.min];
      filterObj.val2 = values.max == this.domain.length - 1 ? null : this.domain[values.max];

      this.props.dataHandler(formattedLabel, filterObj, true, true);
    } else {
      if (this.props.type == 'calendar_date') {
        this.setState({
          values: values,
          inputValue: {
            lower: this.inputFieldDate(this.domain[values.min]),
            upper: this.inputFieldDate(this.domain[values.max])
          }
        });

        filterObj = {
          dir: 'bt',
          val1: this.timeStamp(this.domain[this.state.values.min]),
          val2: this.timeStamp(this.domain[this.state.values.max])
        };
        this.props.dataHandler(
          this.displayDate(this.domain[this.state.values.min]) + ' - ' +
          this.displayDate(this.domain[this.state.values.max]), filterObj, true, true);
      } else {
        this.setState({
          values: values,
          inputValue: {
            lower: values.min,
            upper: values.max
          }
        });

        if (values.min == this.props.rangeMin && values.max == this.props.rangeMax) {
            formattedLabel = '(all values)';
            filterObj.dir = null;
        } else if (values.min == this.props.rangeMin) {
          formattedLabel = 'Less than ' + values.max;
          filterObj.dir = 'lt';
        } else if (values.max == this.props.rangeMax) {
          formattedLabel = 'More than ' + values.min;
          filterObj.dir = 'gt';
        } else {
          formattedLabel = values.min + ' - ' + values.max;
          filterObj.dir = 'bt';
        }

        filterObj.val1 = values.min == this.props.rangeMin ? null : values.min;
        filterObj.val2 = values.max == this.props.rangeMax ? null : values.max;

        this.props.dataHandler(formattedLabel, filterObj, true, true);
      }

    }
  }

  formattedLabel(value) {
    if (this.props.type == 'calendar_date') {
      if (this.props.isLarge) {
        this.timeStamp(this.domain[value]);
      }
    } else {
      return value;
    }
  }

  render() {

    if (this.props.isLarge) {
      return (<div className="large-dataset">
        <InputRange
              minValue={ 0 }
              maxValue={ this.domain.length - 1 }
              step={ 1 }
              value={ this.state.values }
              onChange={ this.handleValuesChange.bind(this) } />
        <div className="rangeLabels">
          <div>{ this.state.valueLabels.min }</div>
          <div>{ this.state.valueLabels.max }</div>
        </div>
      </div>);
    } else {
      var inputClassLower = 'range-input-field range-input-field-lower';
      inputClassLower = this.state.errorBoundary.lower ? inputClassLower + ' is-error' : inputClassLower;

      var inputClassUpper = 'range-input-field range-input-field-upper';
      inputClassUpper = this.state.errorBoundary.upper ? inputClassUpper + ' is-error' : inputClassUpper;

      switch (this.props.type) {
        case 'int':
          return (<div className="small-dataset">
            <InputRange
                  minValue={ this.props.rangeMin }
                  maxValue={ this.props.rangeMax }
                  step={ 1 }
                  value={ this.state.values }
                  onChange={ this.handleValuesChange.bind(this) } />
            <div className="range-inputs-container">
              <div className="range-input-part">
                <input type="number" pattern="-?[1-9][0-9]*"
                  className={ inputClassLower }
                  placeholder="Min"
                  value={ this.state.inputValue.lower }
                  onChange={ this.onChangeNumericInputs.bind(this, 'lower') }/>
              </div>
              <div className="range-input-part">
                <input type="number" pattern="-?[1-9][0-9]*"
                  className={ inputClassUpper }
                  placeholder="Max"
                  value={ this.state.inputValue.upper }
                  onChange={ this.onChangeNumericInputs.bind(this, 'upper') }/>
              </div>
            </div>
          </div>);
        case 'calendar_date':
          return (<div className="small-dataset">
            <InputRange
                  minValue={ 0 }
                  maxValue={ this.domain.length - 1 }
                  step={ 1 }
                  value={ this.state.values }
                  onChange={ this.handleValuesChange.bind(this) } />
            <div className="range-inputs-container">
              <div className="range-input-part">
                <input type="date"
                  className={ inputClassLower }
                  placeholder="Min"
                  value={ this.state.inputValue.lower }
                  onChange={ this.onChangeDateInputs.bind(this, 'lower') }/>
              </div>
              <div className="range-input-part">
                <input type="date"
                  className={ inputClassUpper }
                  placeholder="Max"
                  value={ this.state.inputValue.upper }
                  onChange={ this.onChangeDateInputs.bind(this, 'upper') }/>
              </div>
            </div>
          </div>);
        default:
          break;
      }

    }
  }
}

SocrataRangeFilter.propTypes = {
  componentId: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  scale: React.PropTypes.array,
  rangeMin: React.PropTypes.oneOfType([
    React.PropTypes.object,
    React.PropTypes.number]),
  rangeMax: React.PropTypes.oneOfType([
    React.PropTypes.object,
    React.PropTypes.number])
};

export default SocrataRangeFilter;
