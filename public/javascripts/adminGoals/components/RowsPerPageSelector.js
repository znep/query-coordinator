import React from 'react';
import { connect } from 'react-redux';
import { setRowsPerPage } from '../actions/goalTableActions';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

class RowsPerPageSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = { selectedValue: this.props.rowsPerPage };
  }

  valueChanged(selected) {
    this.setState({
      selectedValue: selected.value
    });

    this.props.valueChanged(selected.value);
  }

  render() {
    let options = _.map([25, 50, 100, 250], value => ({ label: value, value }));

    return <div className="rowsPerPageContainer">
      { this.props.translations.getIn(['admin', 'listing', 'rows_per_page']) }:
      <Select
        options={options}
        value={ this.state.selectedValue }
        clearable={ false }
        onChange={this.valueChanged.bind(this) }
      />
    </div>;
  }
}

const mapStateToProps = state => ({
  translations: state.getIn(['goalTableData', 'translations']),
  rowsPerPage: state.getIn(['goalTableData', 'rowsPerPage'])
});

const mapDispatchToProps = dispatch => ({
  valueChanged: (value) => {
    dispatch(setRowsPerPage(parseInt(value)));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(RowsPerPageSelector);
