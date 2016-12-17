'use strict';

var _ = require('lodash');

var FeatureFlags = {
  source: function(key) {
    throw new Error('Not yet implemented');
  },

  value: function(key) {
    if (window.socrata === undefined || window.socrata.featureFlags === undefined) {
      throw new Error(
        'FeatureFlags requires window.socrata.featureFlags to be defined. Please see README.md in frontend-utils.'
      );
    }
    if (Object.keys(window.socrata.featureFlags).indexOf(key) === -1) {
      throw new Error('Invalid feature flag: ' + key);
    } else {
      return window.socrata.featureFlags[key];
    }
  },

  useTestFixture: function(options) {
    window.socrata = window.socrata || {};
    window.socrata.featureFlags = _.extend({
      "allowDataLensOwnerChange": true,
      "auth0Social": false,
      "browseAutocomplete": false,
      "bubble": "old",
      "ceteraProfileSearch": false,
      "ceteraSearch": true,
      "createV2DataLens": true,
      "currentPageMetadataVersion": 1,
      "dataLensTransitionState": "post_beta",
      "debugDataLens": false,
      "debugLabjs": false,
      "disableAuthorityBadge": "none",
      "disableLegacyTypes": false,
      "disableNbeRedirectionWarningMessage": false,
      "disableObeRedirection": false,
      "disableSiteChromeHeaderFooterOnDataslatePages": false,
      "displayDatasetLandingPageNotice": false,
      "displayDatasetLandingPagePreviewImages": false,
      "embetterAnalyticsBrowserViewsOnly": false,
      "embetterAnalyticsPage": false,
      "enableApiFoundryPane": false,
      "enableCatalogConnector": true,
      "enableDataLensPageMetadataMigrations": true,
      "enableDataLensProvenance": true,
      "enableDatasetLandingPageTour": true,
      "enableDatasetManagementUi": false,
      "enableEmbedWidgetForNbe": false,
      "enableIngressGeometryTypes": false,
      "enableNewAccountVerificationEmail": false,
      "enableOpendataGaTracking": null,
      "enablePulse": false,
      "enableStandardGaTracking": false,
      "enableStorytellerMixpanel": false,
      "enableThirdPartySurveyQualtrics": false,
      "enableVisualizationCanvas": false,
      "featureMapDefaultExtent": "",
      "govstatProgressSettings": true,
      "hideInterpolatedNulls": false,
      "hideSocrataId": false,
      "includeSrInEsri": false,
      "ingressReenter": false,
      "ingressStrategy": "obe",
      "internalPanelRedesign": "all",
      "killEsriReprojectionAndPassDifferentWebm": false,
      "killSnowflakeMapProjections": false,
      "nbeBucketSize": true,
      "notifyImportResult": false,
      "openPerformanceEnableGoalManagementAdminPane": true,
      "openPerformanceNarrativeEditor": "classic",
      "reenableUiForNbe": false,
      "removeViewsFromDiscussPane": false,
      "reportBuilderEnabled": false,
      "routeDataslateWithoutCaching": true,
      "sendSoqlVersion": false,
      "showAuth0Identifiers": false,
      "showFederatedSiteNameInsteadOfCname": false,
      "showProvenanceBadgeInCatalog": true,
      "showProvenanceFacetInCatalog": true,
      "siteAppearanceVisible": false,
      "siteChromeLanguageSwitcher": false,
      "storiesEnabled": true,
      "storiesShowFacetInCatalog": true,
      "timeline": "old",
      "useAuth0": false,
      "useAuth0Component": false,
      "useAuth0LoginFlow": false,
      "useDataLensChoroplethCustomBoundary": false,
      "useEphemeralBootstrap": true,
      "useMergedStyles": false,
      "useSoda2": "never",
      "validateFragmentCacheBeforeRender": true,
      "zealousDataslateCacheExpiry": false
    }, options || {});
  }
};

module.exports = FeatureFlags;
