import React from 'react';
import { connect } from 'react-redux';
import { rowSelectionCancel } from '../actions/goalTableActions';
import GoalTableRow from './GoalTableRow';

class GoalTableBody extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      multipleRowSelection: false
    };
  }

  shouldComponentUpdate(nextProps) {
    return this.props.goals !== nextProps.goals;
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      multipleRowSelection: nextProps.multipleRowSelection
    });
  }

  onClick(event) {
    if (event.button === 0) {
      event.preventDefault();

      if (this.state.multipleRowSelection && !event.shiftKey) {
        this.props.rowSelectionCancel();
      }
    }
  }

  render() {
    return <tbody onClick={ this.onClick.bind(this) }>
      { this.props.goals.map(goal => <GoalTableRow
        key={ goal.get('id') }
        goal={ goal }
        dashboard={ this.props.dashboards.get(goal.get('base_dashboard')) }
        translations={ this.props.translations }
      />) }
    </tbody>;
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  goals: state.getIn(['goalTableData', 'goals']),
  dashboards: state.getIn(['goalTableData', 'dashboards']),
  multipleRowSelection: state.getIn(['goalTableData', 'multipleRowSelection'])
});

const mapDispatchToProps = dispatch => ({
  rowSelectionCancel: () => dispatch(rowSelectionCancel())
});

export default connect(mapStateToProps, mapDispatchToProps)(GoalTableBody);
