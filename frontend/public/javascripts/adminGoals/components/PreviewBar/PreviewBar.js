import * as React  from 'react';
import * as ReactRedux from 'react-redux';

import './PreviewBar.scss';

class PreviewBar extends React.Component {
  render() {
    const { translations } = this.props;

    return (
      <div className="preview-bar" role="banner">
        <div className="preview-bar-header clearfix">
          <div className="back-link icon-arrow-prev">
            <a href={ `${serverConfig.localePrefix}/admin` }>{ translations.getIn(['admin', 'preview_bar', 'back_to_configuration']) }</a>
          </div>
          <div className="header">
            <span>{ translations.getIn(['admin', 'preview_bar', 'performance_goal_management_preview']) }</span>
            <a href="https://support.socrata.com/hc/en-us/articles/224812107" target="_blank" className="external-link">
              { translations.getIn(['admin', 'preview_bar', 'learn_more']) } <span className="icon-external" />
            </a>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations')
});

export default ReactRedux.connect(mapStateToProps, null)(PreviewBar);
