import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment';

class GoalTableBody extends React.Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps) {
    return this.props.goals !== nextProps.goals;
  }

  renderRow(goal) {
    return <tr key={goal.get('id')}>
      <td><input type="checkbox" /></td>
      <td>{ goal.get('name') }</td>
      <td>{ goal.getIn(['created_by', 'displayName']) }</td>
      <td>{ moment(goal.get('updated_at')).format('ll') }</td>
      <td>{ this.props.translations.getIn(['admin', 'goal_values', goal.get('is_public') ? 'status_public' : 'status_private']) }</td>
      <td>{ this.props.translations.getIn(['measure', 'progress', goal.get('prevailingMeasureProgress')]) }</td>
      <td>{ this.props.dashboards.get(goal.get('base_dashboard')).get('name') }</td>
      <td>&nbsp;</td>
    </tr>;
  }

  render() {
    let rows = this.props.goals.map(goal => this.renderRow(goal));
    return <tbody>
      { rows }
    </tbody>;
  }
}

const mapStateToProps = state => ({
  translations: state.getIn(['goalTableData', 'translations']),
  goals: state.getIn(['goalTableData', 'goals']),
  dashboards: state.getIn(['goalTableData', 'dashboards'])
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(GoalTableBody);
