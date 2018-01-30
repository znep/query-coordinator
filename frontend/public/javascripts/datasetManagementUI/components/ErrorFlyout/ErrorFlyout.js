import PropTypes from 'prop-types';
import React from 'react';
import TypeIcon from 'datasetManagementUI/components/TypeIcon/TypeIcon';
import { singularOrPlural } from 'datasetManagementUI/lib/util';
import { commaify } from '../../../common/formatNumber';

export function getErrorFlyoutId(transform) {
  return `transform-status-flyout-${transform.id}`;
}

const ErrorFlyout = ({ transform }) => {
  const SubI18n = I18n.show_output_schema.column_header;

  const flyoutId = getErrorFlyoutId(transform);

  const msgTemplate = singularOrPlural(
    transform.error_count,
    SubI18n.column_status_flyout.error_msg_singular,
    SubI18n.column_status_flyout.error_msg_plural
  );

  const canonicalTypeName = transform.output_soql_type;

  return (
    <div id={flyoutId} className="transform-status-flyout flyout flyout-hidden">
      <section className="flyout-content">
        {msgTemplate.format({
          num_errors: commaify(transform.error_count),
          type: SubI18n.type_display_names[canonicalTypeName]
        })}
        <TypeIcon type={canonicalTypeName} />
        <br />
        <span className="click-to-view">
          {I18n.show_output_schema.click_to_view}
        </span>
      </section>
    </div>
  );
};

ErrorFlyout.propTypes = {
  transform: PropTypes.object.isRequired
};

export default ErrorFlyout;
