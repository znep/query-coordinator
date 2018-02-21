import React from 'react';

const TableBodyPlaceholder = () => {
  return (
    <tbody id="table-body-placeholder">
      <div className="dsmp-message-section">
        <span className="dsmp-tablebody-message">{I18n.data_preview.table_placeholder_message}</span>
      </div>
    </tbody>
  );
};

export default TableBodyPlaceholder;
