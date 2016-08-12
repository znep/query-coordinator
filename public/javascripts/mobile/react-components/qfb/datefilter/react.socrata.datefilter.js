import React from 'react';
import FlannelUtils from '../../flannel/flannel';
import './DatePicker.scss';
import DayPicker from './DayPicker.js'; // eslint-disable-line no-unused-vars
import moment from 'moment';

const defaultGapBetweenDates = {
  weeks: 2
};

class SocrataDatefilter extends React.Component {

  constructor(props) {
    super(props);

    var firstCal = (this.props.data.val1) ?
      moment(this.props.data.val1) : moment();

    var secondCal = (this.props.data.val2) ?
      moment(this.props.data.val2) : moment(firstCal, moment.ISO_8601).add(defaultGapBetweenDates);

    this.state = {
      firstCal: firstCal,
      secondCal: secondCal,
      pickerType: this.props.data.dir || 'bt',
      isCorrect: true,
      isApplicable: true
    };
  }

  componentDidMount() {
    FlannelUtils.showOverlay();

    var formattedLabel = this.formattedLabel();
    this.props.labelHandler(formattedLabel);
    this.props.dataHandler(
      this.formattedLabel(),
      this.filterData(),
      this.state.isApplicable,
      this.state.isCorrect);
  }

  prettyDate(dateObj) {
    return moment(dateObj, moment.ISO_8601).format('MM/DD/YYYY');
  }

  formattedLabel() {
    var label;
    var pickerType = this.state.pickerType;

    if (pickerType === 'bt') {
      label = this.prettyDate(this.state.firstCal) + ' - ' + this.prettyDate(this.state.secondCal);
    } else {
      var datePickerString = (pickerType === 'gt') ? 'After ' : 'Before ';
      label = datePickerString + ' ' + this.prettyDate(this.state.firstCal);
    }

    return label;
  }

  filterData() {
    var data = {};
    data.dir = this.state.pickerType;

    switch (data.dir) {
      case 'gt':
        data.val1 = this.state.firstCal;
        data.val2 = null;
        break;
      case 'lt':
        data.val1 = null;
        data.val2 = this.state.firstCal;
        break;
      case 'bt':
        data.val1 = this.state.firstCal;
        data.val2 = this.state.secondCal;
        break;
      default:
        break;
    }
    return data;
  }

  isApplicable() {
    return this.state.pickerType == 'bt' &&
      this.state.firstCal &&
      this.state.secondCal &&
      this.state.firstCal <= this.state.secondCal;
  }

  onChangeType(e) {
    this.setState({
      pickerType: e.target.value
    }, () => {
      this.props.dataHandler(
        this.formattedLabel(),
        this.filterData(),
        this.isApplicable(),
        this.isApplicable()
      );
    });
  }

  handleFirstCalChange(day) {
    this.setState({
      firstCal: day
    }, () => {
      this.props.dataHandler(
        this.formattedLabel(),
        this.filterData(),
        this.isApplicable(),
        this.isApplicable()
      );
    });
  }

  handleSecondCalChange(day) {
    this.setState({
      secondCal: day
    }, () => {
      this.props.dataHandler(
        this.formattedLabel(),
        this.filterData(),
        this.isApplicable(),
        this.isApplicable()
      );
    });
  }

  render() {
    var filterContainerClass = 'filter-dropdown';
    filterContainerClass += (this.state.pickerType === 'bt') ? ' bt' : '';

    var hideRangePickers = (this.state.pickerType === 'bt') ? '' : 'hidden';

    return (
      <div className={ filterContainerClass }>
        <div className="filter-select">
          <i className="icon-arrow-down"></i>
          <select className="picker-category-selector"
            value={this.state.pickerType}
            onChange={this.onChangeType.bind(this)} >
            <option value="bt">Between</option>
            <option value="lt">Before</option>
            <option value="gt">After</option>
          </select>
        </div>
        <div className="pickers-container">
          <DayPicker
            initialDate={ new Date(this.state.firstCal) }
            numberOfMonths={1}
            handleChange={this.handleFirstCalChange.bind(this)} />
          <div className={ hideRangePickers + ' separator' }>to</div>
          <div className={ hideRangePickers }>
            <DayPicker
              initialDate={ new Date(this.state.secondCal) }
              numberOfMonths={1}
              handleChange={this.handleSecondCalChange.bind(this)} />
          </div>
        </div>
      </div>
    );
  }

}

SocrataDatefilter.propTypes = {
  componentId: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  dataHandler: React.PropTypes.func.isRequired,
  labelHandler: React.PropTypes.func
};

export default SocrataDatefilter;