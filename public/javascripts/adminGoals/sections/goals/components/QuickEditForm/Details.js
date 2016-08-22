import _ from 'lodash';
import moment from 'moment';

import * as React from 'react';
import * as ReactRedux from 'react-redux';

class GoalDetails extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { goal, translations } = this.props;

    const datasetUpdatedAt = goal.getIn(['coreView', 'updatedAt'], null);
    const datasetOwner = goal.getIn(['coreView', 'owner', 'displayName'], null);

    return (
      <div className="goal-quick-edit-details">
        <h6>{ translations.getIn(['admin', 'quick_edit', 'goal_updated']) }</h6>
        <div>{ moment(goal.get('updated_at')).format('ll') }</div>

        <h6>{ translations.getIn(['admin', 'quick_edit', 'goal_owner']) }</h6>
        <div>{ goal.get('owner_name') }</div>

        <h6>{ translations.getIn(['admin', 'quick_edit', 'dashboard']) }</h6>
        <div>
          <a href={ `/stat/goals/${goal.get('base_dashboard')}` } target="_blank" className="external-link">
            { goal.getIn(['dashboard', 'name']) }
            <span className="icon-external" />
          </a>
        </div>

        <h6>{ translations.getIn(['admin', 'quick_edit', 'category']) }</h6>
        <div>{ goal.getIn(['category', 'name']) }</div>

        <h6>{ translations.getIn(['admin', 'quick_edit', 'dataset_updated']) }</h6>
        <div>{ datasetUpdatedAt ? moment.unix(datasetUpdatedAt).format('ll') : '—' }</div>

        <h6>{ translations.getIn(['admin', 'quick_edit', 'dataset_owner']) }</h6>
        <div>{ _.get(datasetOwner, 'displayName', '—') }</div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations')
});

export default ReactRedux.connect(mapStateToProps, null)(GoalDetails);
