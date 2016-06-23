import React from 'react';
import { connect } from 'react-redux';
import GoalTableRow from './GoalTableRow';

class GoalTableBody extends React.Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps) {
    return this.props.goals !== nextProps.goals;
  }

  render() {
    return <tbody>
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
  translations: state.getIn(['goalTableData', 'translations']),
  goals: state.getIn(['goalTableData', 'goals']),
  dashboards: state.getIn(['goalTableData', 'dashboards'])
});

const mapDispatchToProps = dispatch => ({});// eslint-disable-line no-unused-vars

export default connect(mapStateToProps, mapDispatchToProps)(GoalTableBody);
