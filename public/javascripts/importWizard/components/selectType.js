import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import _ from 'lodash';
import NavigationControl from './navigationControl';

export function view(props) {
  const I18nPrefixed = I18n.screens.dataset_new.first_page;
  const {enabledModules, currentDomainMemberCurrentUser, onChooseOperation} = props;

  const firstSections = [
    <li key="CREATE_FROM_SCRATCH">
      <a
        className="create tooltip"
        title={I18nPrefixed.create_explain}
        onClick={onChooseOperation('CREATE_FROM_SCRATCH')}>
        <span title="">
          <span className="icon"></span>
          <p>{I18nPrefixed.create}</p>
        </span>
      </a>
    </li>,
    <li key="UPLOAD_DATA">
      <a
        className="upload tooltip"
        title={I18nPrefixed.import_explain}
        onClick={onChooseOperation('UPLOAD_DATA')}>
        <span title="">
          <span className="icon" title=""></span>
          <p>{I18nPrefixed.import}</p>
        </span>
      </a>
    </li>
  ];

  const esriIntegration =
    _.includes(enabledModules, 'esri_integration')
    ? [
      <li key="esriIntegration">
        <a
          className="mapLayer tooltip"
          title={I18nPrefixed.mapLayer_explain}>
          <span title="">
            <span className="icon"></span>
            <p>{I18nPrefixed.mapLayer}</p>
          </span>
        </a>
      </li>
    ]
    : [];

  const geoSpatial =
    _.includes(enabledModules, 'geospatial')
    ? [
      <li key="geoSpatial">
        <a
          className="shapefile tooltip"
          title={I18nPrefixed.shapefile_explain}
          onClick={onChooseOperation('UPLOAD_GEO')}>
          <span title="">
            <span className="icon"></span>
            <p>{I18nPrefixed.shapefile}</p>
          </span>
        </a>
      </li>
    ]
    : [];

  const blobby = (
    <li key="blobby">
      <a
        className="blobby tooltip"
        title={I18nPrefixed.blobby_explain}>
        <span title="">
          <span className="icon"></span>
          <p>{I18nPrefixed.blobby}</p>
        </span>
      </a>
    </li>);

  const external =
    currentDomainMemberCurrentUser
    ? [
      <li key="external">
        <a
          className="external tooltip"
          title={I18nPrefixed.external_explain}
          onClick={onChooseOperation('LINK_EXTERNAL')}>
          <span title="">
            <span className="icon"></span>
            <p>{I18nPrefixed.external}</p>
          </span>
        </a>
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
      <NavigationControl
        cancelLink="/profile" />
    </div>
  );
}

view.propTypes = {
  enabledModules: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentDomainMemberCurrentUser: PropTypes.bool.isRequired,
  onChooseOperation: PropTypes.func.isRequired
};
