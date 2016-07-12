//Track clicking certain links on the page
$(document).ready(function() {
  'use strict';

  // Return early if blist doesn't exist (for instance, if we're in Data Lens)
  if (_.isUndefined(window.blist)) {
    return;
  }

  var MISSING_PROP_VALUE = 'N/A';

  // This is duplicated in angular/common/values.js and datasetLandingPage/lib/mixpanelTracking.js
  var MIXPANEL_EVENTS = [
    'Changed Render Type Options',
    'Chose Visualization Type',
    'Cleared Facets',
    'Cleared Search Field',
    'Clicked API Docs Link',
    'Clicked Catalog Result',
    'Clicked Featured View',
    'Clicked Footer Item',
    'Clicked Header Item',
    'Clicked Next in Tour',
    'Clicked Sidebar Option',
    'Clicked Socrata News Link',
    'Clicked Pane in Sidebar',
    'Clicked a Related View',
    'Clicked to Add a Featured Item',
    'Clicked to Edit a Featured Item',
    'Clicked to Remove a Featured Item',
    'Clicked to Show More Views',
    'Closed Tour',
    'Created a Data Lens',
    'Contacted Dataset Owner',
    'Copied API Link',
    'Copied OData Link',
    'Downloaded Data',
    'Edited Metadata',
    'Encountered Error Message',
    'Expanded Column Info',
    'Expanded Details',
    'Ingress: Started Wizard Page',
    'Ingress: Left Wizard Page',
    'Navigated to Gridpage',
    'Opened Goal Chart',
    'Saved a Featured Item',
    'Shared Dataset',
    'Used Search Facets',
    'Used Search Field',
    'Viewed Dataset Statistics'
  ];

  // This is duplicated in angular/common/values.js and datasetLandingPage/lib/mixpanelTracking.js
  var MIXPANEL_PROPERTIES = [
    'Catalog Version',
    'Chart/Map Type',
    'Click Position',
    'Content Type',
    'Dataset Owner',
    'Display Type',
    'Domain',
    'Expanded Target',
    'Facet Name',
    'Facet Type',
    'Facet Type Name',
    'Facet Value',
    'Footer Item Type',
    'From Page',
    'Header Item Type',
    'Ingress Step',
    'IP',
    'Item Position',
    'Item Type',
    'Limit',
    'Message Shown',
    'Name',
    'New URL',
    'Next Action',
    'Page Number',
    'Pane Name',
    'On Page',
    'Product',
    'Properties',
    'Provider',
    'Query',
    'Related View Id',
    'Related View Type',
    'Render Type',
    'Result Ids',
    'Result Number',
    'Request Id',
    'Session Id',
    'Sidebar Name',
    'Socrata Employee',
    'Step in Tour',
    'Time Since Page Opened (sec)',
    'Tour',
    'Total Steps in Tour',
    'Type',
    'URL',
    'User Id',
    'User Owns Dataset',
    'User Role Name',
    'View Id',
    'View Type',
    'Visualization Type',
    'Wizard Page',
    'Wizard Page Visit Number'
  ];

  // Event name validation
  var validateEventName = function(eventName) {
    blist.util.enforceLodashFunctions();
    var valid = _.includes(MIXPANEL_EVENTS, eventName);

    if (!valid) {
      console.error('Mixpanel payload validation failed: Unknown event name: "{0}"'.format(eventName));
    }

    return valid;
  };

  // Payload property validation
  var validateProperties = function(properties) {
    var valid = true;

    _.forEach(properties, function(value, key) {
      if (_.isObject(value)) {
        validateProperties(value);
      } else {
        blist.util.enforceLodashFunctions();
        valid = _.includes(MIXPANEL_PROPERTIES, key);

        if (!valid) {
          console.error('Mixpanel payload validation failed: Unknown property "{0}"'.format(key));
        }

        return valid;
      }
    });

    return valid;
  };

  blist.util.enforceLodashFunctions();
  // These are properties that don't change once a page has loaded;
  var userId = _.get(blist, 'currentUserId', 'Not Logged In');
  var ownerId = _.get(blist, 'dataset.owner.id', MISSING_PROP_VALUE);
  var staticPageProperties = {
    'Dataset Owner': ownerId,
    'Domain': window.location.hostname,
    'IP': blist.requestIp,
    'Limit': _.get(blist, 'browse.limit'),
    'On Page': window.location.pathname,
    'Request Id': blist.requestId,
    'Result Ids': _.keys(_.get(blist, 'browse.datasets')),
    'Session Id': blist.sessionId,
    'Socrata Employee': _.includes(_.get(blist, 'currentUser.flags'), 'admin'),
    'URL': window.location.href,
    'User Id': userId,
    'User Owns Dataset': ownerId === userId,
    'User Role Name': _.get(blist, 'currentUser.roleName', MISSING_PROP_VALUE),
    'View Id': _.get(blist, 'dataset.id', MISSING_PROP_VALUE),
    'View Type': _.get(blist, 'dataset._mixpanelViewType', MISSING_PROP_VALUE)
  };

  // TODO: Properly manage user identification in Mixpanel instead of
  // resetting this cookie every time we call out to Mixpanel. Will probably
  // look something like watching login events and using identify/alias.
  // (see: https://mixpanel.com/help/reference/javascript#user-identity)
  //
  // Registered properties are automatically added to the payload properties
  // sent to Mixpanel. They're also saved in a cookie, so we need to be sure
  // to not to include any information that changes from session to session.
  // (i.e. View Id or User Owns Dataset). This function serves to set up the
  // initial cookie and to update the cookie with changes.
  var registerUserProperties = function() {
    var properties = _.pick(
      staticPageProperties,
      'User Id',
      'Socrata Employee',
      'User Role Name',
      'Domain'
    );
    validateProperties(properties);

    if (blist.mixpanelLoaded) {
      mixpanel.register(properties);
      //set user ID to mixpanels user ID if not logged in
      mixpanel.identify(userId === 'Not Logged In' ? mixpanel.get_distinct_id() : userId);
    }
  };

  var sincePageOpened = function() { return Math.round(new Date().getTime() / 1000) - blist.pageOpened };

  // Page properties we want to also track
  var genericPagePayload = function() {
    var dynamicProperties = {
      'Time Since Page Opened (sec)': sincePageOpened()
    };
    var staticPropertyNames = [
      'Dataset Owner',
      'User Owns Dataset',
      'View Id',
      'View Type',
      'On Page'
    ];

    return _.merge(
      _.pick(staticPageProperties, staticPropertyNames),
      dynamicProperties
    );
  };

  // Note: 'New URL' is merged into these properties in the delegateLinks function
  // Also Note: 'Result Ids' is not guaranteed to be the results of the current
  // search (for instance we use this payload when we click on a facet or when we
  // perform a text search, but before we've gotten the results of that query).
  // Essentially, it's possible to send Mixpanel a payload that contains Request Ids
  // for a search that returned no results. This is intentional, as knowing what the
  // search term the user used before finding what they wanted is helpful.
  var genericBrowsePayload = function() {
    var uniqueToBrowseProperties = {
      'Catalog Version': 'browse2',
      'User Id': blist.currentUser ? blist.currentUser.email : 'Anonymous'
    };
    var staticPropertyNames = [
      'IP',
      'Limit',
      'URL',
      'Request Id',
      'Result Ids',
      'Session Id'
    ];

    return _.merge(
      _.pick(staticPageProperties, staticPropertyNames),
      uniqueToBrowseProperties
    );
  };

  var facetEventPayload = function(element, eventName) {
    var isActiveOrClearAll = $(element).hasClass('active') || $(element).attr('class') === 'browse2-results-clear-all-button';
    return _.extend(genericBrowsePayload(), {
      'Type': {
        'Name': isActiveOrClearAll  ? 'Cleared Facet' : eventName,
        'Properties': _.extend({},
          isActiveOrClearAll ? {} : {
            'Facet Value': $(element).attr('title'),
            'Facet Name': $(element).closest('ul').prev('h3').attr('title')
          }
        )
      }
    });
  };

  var catalogEventPayload = function(element, eventName) {
    var clickPosition = _.keys($.deepGet(true, blist, 'browse', 'datasets')).indexOf(element.href.match(/\w{4}-\w{4}$/)[0]);
    return _.extend(genericBrowsePayload(), {
      'Type': {
        'Name': eventName,
        'Properties': clickPosition >= 0 ? {'Click Position': clickPosition} : {}
      }
    });
  };

  // Fetch the blist mixpanel object
  var mixpanelNS = blist.namespace.fetch('blist.mixpanel');

  mixpanelNS.MIXPANEL_EVENTS = MIXPANEL_EVENTS;
  mixpanelNS.MIXPANEL_PROPERTIES = MIXPANEL_PROPERTIES;

  var validateAndSendPayload = function(eventName, properties, callback) {
    validateEventName(eventName);
    validateProperties(properties);

    mixpanel.track(eventName, properties, callback);
  };

  // Initialize event watcher to emit Mixpanel payloads for generic link events
  mixpanelNS.delegateLinks = function(parent, selector, eventName, allowDefault, getProperties) {
    $(parent || document.body).on('click', selector, function(event) {
      try {
        registerUserProperties();

        // Get the specific properties for the event
        var properties = _.isFunction(getProperties) ? getProperties(event.currentTarget, eventName) : {};
        // Update the properties with the page-specific properties we want to track
        var mergedProperties = _.extend(genericPagePayload(), properties);

        var willOpenInNewTab = event.which === 2 || event.metaKey || event.ctrlKey || event.currentTarget.target === '_blank';
        var isDefaultPrevented = event.isDefaultPrevented();
        var callback = function() {
          if (!willOpenInNewTab && !isDefaultPrevented && (mergedProperties['New URL'] != null)) {
            window.location = mergedProperties['New URL'];
          }
        };

        if (!willOpenInNewTab && !allowDefault) {
          event.preventDefault();
        }
        mergedProperties['New URL'] = event.currentTarget.href;

        // Validate and track!
        validateAndSendPayload(eventName, mergedProperties, callback);
      }
      catch(e) {
        if (!isDefaultPrevented && (event.currentTarget.href != null)) {
          window.location = event.currentTarget.href;
        }
        throw e;
      }
    });
  };

  // Assemble and emit catalog search event payloads
  // Note: this is used by screens/browse.js and screens/browse2.js
  mixpanelNS.delegateCatalogSearchEvents = function(eventName, properties, callback) {
    registerUserProperties();

    var mergedProperties = _.extend(
      genericPagePayload(),
      genericBrowsePayload(),
      properties
    );

    // Validate and track!
    validateAndSendPayload(eventName, mergedProperties, callback);
  };

  // Assemble and emit ingress wizard event payloads
  // Note: this is used by screens/datasets-new.js
  mixpanelNS.trackIngressWizardEvent = function(eventName, properties) {
    registerUserProperties();

    var staticPropertyNames = [
      'IP',
      'On Page',
      'Request Id',
      'Session Id',
      'URL'
    ];

    var mergedProperties = _.extend(
      { 'Time Since Page Opened (sec)': sincePageOpened() },
      _.pick(staticPageProperties, staticPropertyNames),
      properties
    );

    validateAndSendPayload(eventName, mergedProperties);
  };

  // Assemble and emit user error payloads
  mixpanelNS.trackUserError = function(properties) {
    registerUserProperties();

    var mergedProperties = _.extend(
      genericPagePayload(),
      properties
    );

    // Validate and track!
    validateAndSendPayload('Encountered Error Message', mergedProperties);
  };

  $(document).on('mixpanelLoaded', function() {
    // TODO: Move the event tracking below this to separate file(s)
    //HEADER
    mixpanelNS.delegateLinks('#siteHeader', 'a', 'Clicked Header Item', false, function(element) {
      var linkType = (element.title != '') ? element.title : element.text;
      return { 'Header Item Type': linkType };
    });

    mixpanelNS.delegateLinks('#site-chrome-header', 'a', 'Clicked Header Item', false, function(element) {
      var linkType = (element.title != '') ? element.title : element.text;
      return { 'Header Item Type': linkType };
    });

    //FOOTER
    mixpanelNS.delegateLinks('#siteFooter', 'a', 'Clicked Footer Item', false, function(element) {
      var linkType = (element.title != '') ? element.title : element.text;
      return { 'Footer Item Type': linkType };
    });

    mixpanelNS.delegateLinks('#site-chrome-footer', 'a', 'Clicked Footer Item', false, function(element) {
      var linkType = (element.title != '') ? element.title : element.text;
      return { 'Footer Item Type': linkType };
    });

    //CATALOG
    //Featured Views
    mixpanelNS.delegateLinks('.featuredViews .featuredView', 'a', 'Clicked Featured View', false);

    //Catalog results
    // Browse2
    mixpanelNS.delegateLinks('.browse2-result-name', 'a', 'Clicked Catalog Result', false, catalogEventPayload);

    // Browse1
    mixpanelNS.delegateLinks('.gridList .titleLine', 'a', 'Clicked Catalog Result', false, function(element) {
      var linkNo = parseFloat($(element).closest('.item').find('.index .value').text());
      var page = $(element).closest('.browseList').find('.pagination .active').text().match(/\d/);
      var pageNo = (page=='')? 1 : parseFloat(page);
      return { 'Result Number': linkNo, 'Page Number': pageNo };
    });

    // API docs link
    mixpanelNS.delegateLinks('.browse2-result-explore', 'a', 'Clicked API Docs Link', false, catalogEventPayload);

    //SEARCH FACETS
    //View Types/Categories/Topics
    // Browse2
    mixpanelNS.delegateLinks('.browse2-facet-section-options', 'a', 'Used Search Facets', false, facetEventPayload);
    // Modal (Note: Model more than way to select facets)
    mixpanelNS.delegateLinks('.browse2-facet-section-modal-content-top', 'a', 'Used Search Facets', false, facetEventPayload);
    mixpanelNS.delegateLinks('.browse2-facet-section-modal-content-all', 'a', 'Used Search Facets', false, facetEventPayload);
    // Clear facets method #1
    mixpanelNS.delegateLinks('.browse2-results-clear-controls', 'a', 'Cleared Facets', false, facetEventPayload);

    // Browse1
    mixpanelNS.delegateLinks('.facetSection', 'a', 'Used Search Facets', false, function(element) {
      var facetType = $(element).closest('.facetSection').find('> .title').text();
      var linkName = element.text;
      return { 'Facet Type': facetType, 'Facet Type Name': linkName };
    });

    //SIDEBAR TRACKING
    mixpanelNS.delegateLinks('#sidebarOptions', 'a', 'Clicked Sidebar Option', false, function(element) {
      return {'Sidebar Name': element.title};
    });

    //Panes in sidebar (Needs a delegated .on since they are not present in the DOM from the beginning)
    mixpanelNS.delegateLinks('#gridSidebar', 'a.headerLink', 'Clicked Pane in Sidebar', false, function(element) {
      return {'Pane Name': element.text};
    });

    // Edit Metadata Button
    mixpanelNS.delegateLinks('#gridSidebar', 'a.editMetadataButton', 'Edited Metadata', false, function(element) {
      return { 'From Page': 'Grid Page' };
    });

    // Stats Metadata Button
    mixpanelNS.delegateLinks('#gridSidebar', 'a.statsButton', 'Viewed Dataset Statistics', false, function(element) {
      return { 'From Page': 'Grid Page' };
    });

    // Bootstrap Data Lens Button
    mixpanelNS.delegateLinks('#gridSidebar', 'a.bootstrapButton', 'Created a Data Lens', false, function(element) {
      return { 'From Page': 'Grid Page' };
    });

    //In the visualize pane - the different visualization types
    mixpanelNS.delegateLinks('#gridSidebar', '.radioBlock .radioLine', 'Chose Visualization Type', true, function(element) {
      return {'Visualization Type': element.outerText};
    });

    //Render Type Options
    mixpanelNS.delegateLinks('#renderTypeOptions', 'a', 'Changed Render Type Options', false, function(element) {
      return {'Render Type': element.title};
    });

    // GOVSTAT
    // opening old chart
    mixpanelNS.delegateLinks('#janus', '.goalBox .pull.down', 'Opened Goal Chart', false, _.noop);

    // opening new chart
    mixpanelNS.delegateLinks('#janus', '.goalBox .progressViewChart .viewChart', 'Opened Goal Chart', false, _.noop);
  });
});
