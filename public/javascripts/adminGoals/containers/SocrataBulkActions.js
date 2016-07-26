import React from 'react';
import { connect } from 'react-redux';
import { openEditMultipleItemsModal } from '../actions/bulkEditActions';

import SocrataButton from '../components/SocrataButton';

function SocrataBulkActions(props) {
  const editTitle = props.translations.getIn(['admin', 'bulk_edit', 'button_title']);

  return (
    <div className="bulk-actions">
      <SocrataButton simple disabled={ props.selectedRowsCount < 2 } onClick={ props.openEditMultipleItemsModal }>{ editTitle }</SocrataButton>
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

export default connect(mapStateToProps, mapDispatchToProps)(SocrataBulkActions);
