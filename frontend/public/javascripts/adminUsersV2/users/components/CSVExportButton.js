import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { customConnect, I18nPropType } from 'common/connectUtils';
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
  I18n: I18nPropType.isRequired
};

const mapStateToProps = state => ({
  href: Selectors.getUsersCsvUrl(state)
});

export default customConnect({ mapStateToProps })(CSVExportButton);
