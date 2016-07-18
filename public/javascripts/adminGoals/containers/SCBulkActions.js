import React from 'react';
import { connect } from 'react-redux';
import { openEditMultipleItemsModal } from '../actions/bulkEditActions';

import SCButton from '../components/SCButton';

function SCBulkActions(props) {
  const editTitle = props.translations.getIn(['admin', 'bulk_edit', 'button_title']);

  return (
    <div>
      <SCButton simple disabled={ props.selectedRowsCount < 1 } onClick={ props.openEditMultipleItemsModal }>{ editTitle }</SCButton>
    </div>
  );
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  selectedRowsCount: state.getIn(['goalTableData', 'selectedRows']).count()
});

const mapDispatchToProps = dispatch => ({
  openEditMultipleItemsModal: () => dispatch(openEditMultipleItemsModal())
});

export default connect(mapStateToProps, mapDispatchToProps)(SCBulkActions);
