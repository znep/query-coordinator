import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars

export function view(props) {
  const I18nPrefixed = I18n.screens.dataset_new['import'];
  const { onGoToPage } = props;
  return (
    <div>
      <p className="headline">{ I18nPrefixed.headline }</p>
      <ul className="uploadTypeList clearfix">
        <li>
          <a href="#local"
             className="byUpload"
             title={ I18nPrefixed.local_explain }
             onClick={ onGoToPage('uploadFile') }>
            <span className="icon"></span>
            <p>{ I18nPrefixed.local }</p>
          </a>
        </li>
        <li>
          <a href="#web"
             className="byCrossload"
             title={ I18nPrefixed.web_explain }>
            <span className="icon"></span>
            <p>{ I18nPrefixed.web }</p>
          </a>
        </li>
      </ul>
    </div>
  );
}

view.propTypes = {
  onGoToPage: PropTypes.func.isRequired
};
