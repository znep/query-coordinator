import React, { Component } from 'react';
import PropTypes from 'prop-types';
import connectLocalization from 'common/i18n/components/connectLocalization';
import { connect } from 'react-redux';
import _ from 'lodash';

export class CSVExportButton extends Component {
  render() {
    const { href, I18n } = this.props;
    return (
      <a href={href} className="btn btn-simple export-csv-btn">
        {I18n.t('users.export_as_csv')}
      </a>
    );
  }
}

CSVExportButton.propTypes = {
  href: PropTypes.string.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  href: _.get(state, 'config.csvUrl')
});

export const LocalizedCSVExportButton = connect(mapStateToProps)(connectLocalization(CSVExportButton));
