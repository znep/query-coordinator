import * as React from 'react';
import * as ReactRedux from 'react-redux';

import * as State from '../../state';
import * as Helpers from '../../../../helpers';

import './BulkEditSaveProgress.scss';

class BulkEditSaveProgress extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { translations, taskTotalCount, taskCompletedCount } = this.props;
    const progressMessage =
      Helpers.translator(
        translations,
        'admin.bulk_edit.items_progress',
        taskCompletedCount,
        taskTotalCount,
        Math.floor(taskCompletedCount * 100 / taskTotalCount)
      );

    return (
      <div className="bulk-edit-save-progress">
        <div className="spinner-default spinner-large" />
        <div>{ progressMessage }</div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const bulkEdit = State.getBulkEdit(state);
  const saveStatus = bulkEdit.get('saveStatus').toJS();

  return {
    ...saveStatus,
    translations: state.get('translations')
  };
};

export default ReactRedux.connect(mapStateToProps)(BulkEditSaveProgress);
