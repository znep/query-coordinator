import React, { PureComponent } from 'react';
import LocalizedText from 'common/i18n/components/LocalizedText';

class Head extends PureComponent {

  render() {

    return (
      <thead>
        <tr>
          <th scope="col" tabIndex="0" className="type">
            <span className="column-name">
              <LocalizedText localeKey="screens.admin.activity_feed.columns.type" />
            </span>
          </th>
          <th scope="col" tabIndex="0" className="initiated-by">
            <span className="column-name">
              <LocalizedText localeKey="screens.admin.activity_feed.columns.initiated_by" />
            </span>
          </th>
          <th scope="col" tabIndex="0" className="event">
            <span className="column-name">
              <LocalizedText localeKey="screens.admin.activity_feed.columns.event" />
            </span>
          </th>
          <th scope="col" tabIndex="0" className="item-affected">
            <span className="column-name">
              <LocalizedText localeKey="screens.admin.activity_feed.columns.item_affected" />
            </span>
          </th>
          <th scope="col" tabIndex="0" className="date">
            <span className="column-name">
              <LocalizedText localeKey="screens.admin.activity_feed.columns.date" />
            </span>
          </th>
          <th scope="col" tabIndex="0" className="actions">
            <span className="column-name">
              <LocalizedText localeKey="screens.admin.activity_feed.columns.actions" />
            </span>
          </th>
        </tr>
      </thead>
    );
  }
}

export default Head;
