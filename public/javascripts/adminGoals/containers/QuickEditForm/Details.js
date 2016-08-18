import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import { connect } from 'react-redux';
import { fetchOptions } from '../../constants';

class GoalDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const goal = this.props.goal;

    if (goal.get('datasetId')) {
      fetch(`/api/views/${goal.get('datasetId')}.json`, _.clone(fetchOptions)).
        then(response => response.json()).
        then(metadata => {
          this.setState({
            datasetUpdatedAt: _.get(metadata, 'rowsUpdatedAt', null),
            datasetOwner: _.get(metadata, 'owner', null)
          });
        });
    } else {
      this.setState({
        datasetUpdatedAt: null,
        datasetOwner: null
      });
    }
  }

  render() {
    const { goal, translations } = this.props;
    const { datasetOwner, datasetUpdatedAt } = this.state;

    return (
      <div className="goal-quick-edit-details">
        <h6>{ translations.getIn(['admin', 'quick_edit', 'goal_updated']) }</h6>
        <div>{ moment(goal.get('updated_at')).format('ll') }</div>

        <h6>{ translations.getIn(['admin', 'quick_edit', 'goal_owner']) }</h6>
        <div>{ goal.getIn(['created_by', 'displayName']) }</div>

        <h6>{ translations.getIn(['admin', 'quick_edit', 'dashboard']) }</h6>
        <div>
          <a href={ `/stat/goals/${goal.base_dashboard}` } target="_blank" className="externalLink">
            { goal.get('dashboardName') }
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

export default connect(mapStateToProps, null)(GoalDetails);
