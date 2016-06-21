import React from 'react';
import { connect } from 'react-redux';
import { toggleAllRows } from '../actions/goalTableActions';

class GoalTableHead extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <thead>
      <tr>
        <th><input type="checkbox" onClick={ this.props.toggleAllRows } /></th>
        <th>{ this.props.translations.getIn(['admin', 'listing', 'title']) }</th>
        <th>{ this.props.translations.getIn(['admin', 'listing', 'owner']) }</th>
        <th>{ this.props.translations.getIn(['admin', 'listing', 'updated_at']) }</th>
        <th>{ this.props.translations.getIn(['admin', 'listing', 'visibility']) }</th>
        <th>{ this.props.translations.getIn(['admin', 'listing', 'goal_status']) }</th>
        <th>{ this.props.translations.getIn(['admin', 'listing', 'dashboard']) }</th>
        <th>&nbsp;</th>
      </tr>
    </thead>;
  }
}

const mapStateToProps = state => ({
  translations: state.getIn(['goalTableData', 'translations'])
});

const mapDispatchToProps = dispatch => ({
  toggleAllRows: () => dispatch(toggleAllRows())
});

export default connect(mapStateToProps, mapDispatchToProps)(GoalTableHead);
