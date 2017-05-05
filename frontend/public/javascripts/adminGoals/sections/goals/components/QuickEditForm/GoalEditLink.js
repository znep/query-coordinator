import * as Selectors from '../../selectors';
import React, { PropTypes } from 'react';
import * as ReactRedux  from 'react-redux';

class GoalEditLink extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { goal, text } = this.props;

    const baseDashboardId = goal.get('base_dashboard');
    const categoryId = goal.getIn(['category', 'id']) || 'uncategorized';
    const goalId = goal.get('id');
    const goalEditPageUrl = `/stat/goals/${baseDashboardId}/${categoryId}/${goalId}/edit`;

    return (
      <a href={ goalEditPageUrl } className="external-link" target="_blank">
        { text }
        <span className="icon-external"/>
      </a>
    );
  }
}

GoalEditLink.propTypes = {
  text: PropTypes.string.isRequired
};

const mapStateToProps = state => ({
  goal: Selectors.getQuickEditGoal(state)
});

export default ReactRedux.connect(mapStateToProps, null)(GoalEditLink);
