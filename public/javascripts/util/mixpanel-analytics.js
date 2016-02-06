//Track clicking certain links on the page
$(document).ready(function() {

  mixpanel.delegateLinks = function(parent, selector, eventName, allowDefault, getProperties) {
    $(parent || document.body).on('click', selector, function(event) {
      try {
        //get the specific properties for the event
        var properties = _.isFunction(getProperties) ? getProperties(event.currentTarget, eventName) : {};
        var willOpenInNewTab = event.which === 2 || event.metaKey || event.currentTarget.target === '_blank';
        var isDefaultPrevented = event.isDefaultPrevented();
        var callback = function() {
          if (!willOpenInNewTab && !isDefaultPrevented && (properties['New URL'] != null)) {
            window.location = properties['New URL'];
          }
        }

        if (!willOpenInNewTab && !allowDefault) {
          event.preventDefault();
        }
        properties['New URL'] = event.currentTarget.href;

        //update the meta properties (also includes people tracking)
        $.updateMixpanelProperties();
        //Track!
        mixpanel.track(eventName, properties, callback);
      }
      catch(e) {
        if (!isDefaultPrevented && (event.currentTarget.href != null)) {
          window.location = event.currentTarget.href;
        }
        throw e;
      }
    });
  };

  // Note: 'New URL' is merged into these properties in the delegateLinks function
  var _genericPayload = function() {
    return {
      'Catalog Version': 'browse2',
      'IP': blist.requestIp,
      'Limit': blist.browse.limit,
      'URL': document.location.href,
      'Request Id': blist.requestId,
      'Result Ids': _.keys(_.get(blist, 'browse.datasets')),
      'Session Id': blist.sessionId,
      'User Id': blist.currentUser ? blist.currentUser.email : 'Anonymous'
    };
  };

  var facetEventPayload = function(element, eventName) {
    var isActiveOrClearAll = $(element).hasClass('active') || $(element).attr('class') === 'browse2-results-clear-all-button';
    return _.extend(_genericPayload(), {
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
    return _.extend(_genericPayload(), {
      'Type': {
        'Name': eventName,
        'Properties': clickPosition >= 0 ? {'Click Position': clickPosition} : {}
      }
    });
  };

  //HEADER
  mixpanel.delegateLinks('#siteHeader', 'a', 'Clicked Header Item', false, function(element) {
    var linkType = (element.title != '') ? element.title : element.text;
    return { 'Header Item Type': linkType };
  });

  //FOOTER
  mixpanel.delegateLinks('#siteFooter', 'a', 'Clicked Footer Item', false, function(element) {
    var linkType = (element.title != '') ? element.title : element.text;
    return { 'Footer Item Type': linkType };
  });

  //CATALOG
  //Featured Views
  mixpanel.delegateLinks('.featuredViews .featuredView', 'a', 'Clicked Featured View', false);

  //Catalog results
  // Browse2
  mixpanel.delegateLinks('.browse2-result-name', 'a', 'Clicked Catalog Result', false, catalogEventPayload);

  // Browse1
  mixpanel.delegateLinks('.gridList .titleLine', 'a', 'Clicked Catalog Result', false, function(element) {
    var linkNo = parseFloat($(element).closest('.item').find('.index .value').text());
    var page = $(element).closest('.browseList').find('.pagination .active').text();
    var pageNo = (page=='')? 1 : parseFloat(page);
    return { 'Result Number': linkNo, 'Page Number': pageNo };
  });

  // API docs link
  mixpanel.delegateLinks('.browse2-result-explore', 'a', 'Clicked API Docs Link', false, catalogEventPayload);

  //SEARCH FACETS
  //View Types/Categories/Topics
  // Browse2
  mixpanel.delegateLinks('.browse2-facet-section-options', 'a', 'Used Search Facets', false, facetEventPayload);
  // Modal (Note: Model more than way to select facets)
  mixpanel.delegateLinks('.browse2-facet-section-modal-content-top', 'a', 'Used Search Facets', false, facetEventPayload);
  mixpanel.delegateLinks('.browse2-facet-section-modal-content-all', 'a', 'Used Search Facets', false, facetEventPayload);
  // Clear facets method #1
  mixpanel.delegateLinks('.browse2-results-clear-controls', 'a', 'Cleared Facets', false, facetEventPayload);

  // Browse1
  mixpanel.delegateLinks('.facetSection', 'a', 'Used Search Facets', false, function(element) {
    facetType = $(element).closest('.facetSection').find('> .title').text();
    var linkName = element.text;
    return { 'Facet Type': facetType, 'Facet Type Name': linkName };
  });

  //SIDEBAR TRACKING
  mixpanel.delegateLinks('#sidebarOptions', 'a', 'Clicked Sidebar Option', false, function(element) {
    return {'Sidebar Name': element.title};
  });

  //Panes in sidebar (Needs a delegated .on since they are not present in the DOM from the beginning)
  mixpanel.delegateLinks('#gridSidebar', 'a.headerLink', 'Clicked Pane in Sidebar', false, function(element) {
    return {'Pane Name': element.text};
  });

  //In the visualize pane - the different visualization types
  mixpanel.delegateLinks('#gridSidebar', '.radioBlock .radioLine', 'Chose Visualization Type', true, function(element) {
    return {'Visualization Type': element.outerText};
  });

  //Render Type Options
  mixpanel.delegateLinks('#renderTypeOptions', 'a', 'Changed Render Type Options', false, function(element) {
    return {'Render Type': element.title};
  });

  // GOVSTAT
  // opening old chart
  mixpanel.delegateLinks('#janus', '.goalBox .pull.down', 'Opened Goal Chart', false, _.noop);

  // opening new chart
  mixpanel.delegateLinks('#janus', '.goalBox .progressViewChart .viewChart', 'Opened Goal Chart', false, _.noop);

  window._genericMixpanelPayload = _genericPayload;
});
