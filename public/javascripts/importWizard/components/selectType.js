import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import _ from 'lodash';

export function view(props) {
  const I18nPrefixed = I18n.screens.dataset_new.first_page;
  const {enabledModules, currentDomainMemberCurrentUser, onChooseOperation} = props;

  const firstSections = [
    <li>
      <div
        className="create"
        title={I18nPrefixed.create_explain}
        onClick={onChooseOperation('CreateFromScratch')}>
        <span className="icon"></span>
        <p>{I18nPrefixed.create}</p>
      </div>
    </li>,
    <li>
      <div
        className="upload"
        title={I18nPrefixed.import_explain}
        onClick={onChooseOperation('UploadData')}>
        <span className="icon"></span>
        <p>{I18nPrefixed['import']}</p>
      </div>
    </li>
  ];

  const esriIntegration =
    _.includes(enabledModules, 'esri_integration')
    ? [
      <li>
        <div className="mapLayer" title={I18nPrefixed.mapLayer_explain}>
          <span className="icon"></span>
          <p>{I18nPrefixed.mapLayer}</p>
        </div>
      </li>
    ]
    : [];

  const geoSpatial =
    _.includes(enabledModules, 'geospatial')
    ? [
      <li>
        <div
          className="shapefile"
          title={I18nPrefixed.shapefile_explain}
          onClick={onChooseOperation('UploadGeospatial')}>
          <span className="icon"></span>
          <p>{I18nPrefixed.shapefile}</p>
        </div>
      </li>
    ]
    : [];

  const blobby =
    (<li>
      <div className="blobby" title={I18nPrefixed.blobby_explain}>
        <span className="icon"></span>
        <p>{I18nPrefixed.blobby}</p>
      </div>
    </li>);

  const external =
    currentDomainMemberCurrentUser
    ? [
      <li>
        <div className="external" title={I18nPrefixed.external_explain}>
          <span className="icon"></span>
          <p>{I18nPrefixed.external}</p>
        </div>
      </li>
    ]
    : [];

  const sections = _(firstSections).concat(esriIntegration, geoSpatial, [blobby], external).value();
  const numInFirstRow = 3;
  const firstRow = _.take(sections, numInFirstRow);
  const secondRow = _.drop(sections, numInFirstRow);

  return (
    <div>
      <p className="headline">{I18nPrefixed.prompt}</p>
      <ul className="newKindList clearfix">
        {firstRow}
      </ul>
      <ul className="newKindList clearfix">
        {secondRow}
      </ul>
    </div>
  );
}

view.propTypes = {
  enabledModules: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentDomainMemberCurrentUser: PropTypes.bool.isRequired,
  onChooseOperation: PropTypes.func.isRequired
};
