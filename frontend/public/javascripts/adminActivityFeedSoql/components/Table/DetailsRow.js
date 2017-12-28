import _ from 'lodash';
import React, { PureComponent } from 'react';
import propTypes from 'prop-types';
import LocalizedText from 'common/i18n/components/LocalizedText';
import I18nJS from 'common/i18n';
import JSONPretty from 'react-json-pretty';

class DetailsRow extends PureComponent {

  render() {
    const { activity } = this.props;

    const details = JSON.parse(activity.details);
    const status = _.snakeCase(details.status);
    const type = (details.eventType && details.eventType.replace(/-/g, '_')) || 'generic';

    const errorTitleTranslationKey = `screens.admin.activity_feed.event_messages.${status}.${type}.title`;
    const titleTranslationKeyWithFallback = I18nJS.lookup(errorTitleTranslationKey) ?
      errorTitleTranslationKey :
      'screens.admin.activity_feed.fallback_event_title';
    const title = <LocalizedText localeKey={titleTranslationKeyWithFallback} data={{ error_code: type }} />;

    const descTranslationKey = `screens.admin.activity_feed.event_messages.${status}.${type}.description`;
    const description = I18nJS.lookup(descTranslationKey) ? (
      <LocalizedText
        localeKey={descTranslationKey}
        data={details.info} />
      ) :
      <JSONPretty json={details} />;

    const importMethod = (
      <LocalizedText
        localeKey={`screens.admin.activity_feed.services.${activity.service}`} />
    );

    let failedRowsDownloadLink;
    if (details.info && details.info.badRowsPath) {
      failedRowsDownloadLink = (
        <li>
          <LocalizedText
            className="label"
            localeKey="screens.admin.activity_feed.failed_rows" />
          : <a href={details.info.badRowsPath} target="_blank">errors.csv</a>
        </li>
      );
    }

    return (
      <tr key="details-tr" className="details-row">
        <td colSpan={6}>
          <ul>
            <li className="type">
              <LocalizedText
                className="label type"
                localeKey="screens.admin.activity_feed.type" />: {details.method}
            </li>
            <li className="filename">
              <LocalizedText
                className="label filename"
                localeKey="screens.admin.activity_feed.filename" />: {details.fileName}
            </li>
            <li className="import-method">
              <LocalizedText
                className="label"
                localeKey="screens.admin.activity_feed.import_method" />: {importMethod}
            </li>
            <li className="title">{title}</li>
            <li className="description">{description}</li>
            {failedRowsDownloadLink}
          </ul>
        </td>
      </tr>
    );
  }
}

DetailsRow.propTypes = {
  activity: propTypes.object.isRequired
};

export default DetailsRow;
