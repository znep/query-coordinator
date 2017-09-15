import PropTypes from 'prop-types';
import React from 'react';

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
  text: PropTypes.string.isRequired,
  goal: PropTypes.object.isRequired
};

export default GoalEditLink;
