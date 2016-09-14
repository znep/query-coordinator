import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import NavigationControl from './navigationControl';
import { chooseDataSource } from '../wizard';

export function view({dispatch, goToPrevious}) {
  const I18nPrefixed = I18n.screens.dataset_new.import;
  return (
    <div>
      <p className="headline">{I18nPrefixed.headline}</p>
      <ul className="uploadTypeList clearfix">
        <li>
          <a
            fhref="#local"
            className="byUpload"
            title={I18nPrefixed.local_explain}
            onClick={() => dispatch(chooseDataSource('UploadFile'))}>
            <span className="icon"></span>
            <p>{I18nPrefixed.local}</p>
          </a>
        </li>
        <li>
          <a
            href="#web"
            className="byCrossload"
            title={I18nPrefixed.web_explain}
            onClick={() => dispatch(chooseDataSource('DownloadFile'))}>
            <span className="icon"></span>
            <p>{I18nPrefixed.web}</p>
          </a>
        </li>
      </ul>
      <NavigationControl
        onPrev={goToPrevious}
        cancelLink="/profile" />
    </div>
  );
}

view.propTypes = {
  dispatch: PropTypes.func.isRequired,
  goToPrevious: PropTypes.func.isRequired
};
