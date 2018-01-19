import PropTypes from 'prop-types';
import React from 'react';
import styles from 'datasetManagementUI/components/ErrorFlyout/ErrorFlyout.module.scss';

export function getGeoFlyoutId(transform) {
  return `transform-geo-flyout-${transform.id}`;
}

function GeoFlyout({ transform }) {
  const SubI18n = I18n.show_output_schema.column_header;

  const flyoutId = getGeoFlyoutId(transform);

  return (
    <div id={flyoutId} className={styles.transformStatusFlyout}>
      <section className={styles.flyoutContent}>
        {SubI18n.can_geocode}
        <br />
        <span className={styles.clickToView}>
          {SubI18n.click_for_options}
        </span>
      </section>
    </div>
  );
}

GeoFlyout.propTypes = {
  transform: PropTypes.object.isRequired
};

export default GeoFlyout;
