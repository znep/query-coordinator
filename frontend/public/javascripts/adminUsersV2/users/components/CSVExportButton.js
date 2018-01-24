import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect as fullConnect } from '../../utils';
import * as Selectors from '../../selectors';

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
  href: Selectors.getUsersCsvUrl(state)
});

export default fullConnect(mapStateToProps)(CSVExportButton);
