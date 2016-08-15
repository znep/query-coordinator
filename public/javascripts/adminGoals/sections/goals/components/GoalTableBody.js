import * as React from 'react';
import * as Selectors from '../selectors';
import * as ReactRedux from 'react-redux';

import GoalTableRow from './GoalTableRow';

function GoalTableBody(props) {
  const goals = props.goals.map(goal => <GoalTableRow key={ goal.get('id') } goal={ goal }/>);
  return <tbody>{goals}</tbody>;
}

const mapStateToProps = state => ({
  goals: Selectors.getPaginatedGoals(state)
});

export default ReactRedux.connect(mapStateToProps)(GoalTableBody);
