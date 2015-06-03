if (blist.mixpanelLoaded)
{
    //Track entering certain pages
    $(document).ready(function()
    {
        //TODO make sure user properties are loaded, otherwise it will always look like the users is not logged in
        //update the meta properties
        //$.mixpanelMeta();
        //mixpanel.track('Entered Page', {'Page type': jQuery.metrics.determine_page_type()});
    });

    mixpanel.delegate_links = function (parent, selector, event_name, allowDefault, getProperties)
    {
        $(parent || document.body).on('click', selector, function (event)
        {
            try
            {
                //get the specific properties for the event
                var properties = _.isFunction(getProperties) ? getProperties(event.currentTarget) : {};

                var willOpenInNewTab = event.which === 2 || event.metaKey || event.currentTarget.target === '_blank';
                properties.url = event.currentTarget.href;

                var isDefaultPrevented = event.isDefaultPrevented();
                var callback = function()
                {
                    if (!willOpenInNewTab && !isDefaultPrevented && (properties.url != null))
                    {
                        window.location = properties.url;
                    }
                }

                if (!willOpenInNewTab && !allowDefault)
                {
                    event.preventDefault();
                }
                //update the meta properties (also includes people tracking)
                $.mixpanelMeta();

                //Track!
                mixpanel.track(event_name, properties, callback);
            }
            catch(e)
            {
                if (!isDefaultPrevented && (event.currentTarget.href != null))
                { window.location = event.currentTarget.href; }
                throw e;
            }
        });
    };

    //HEADER
    mixpanel.delegate_links("#siteHeader", "a", "Clicked Header Item", false,
        function(element)
        {
            var linkType = (element.title != '') ? element.title : element.text;
            return { 'Header Item Type': linkType };
        }
    );

    //FOOTER
    mixpanel.delegate_links("#siteFooter", "a", "Clicked Footer Item", false,
        function(element)
        {
            var linkType = (element.title != '') ? linkType = element.title : element.text;
            return { 'Footer Item Type': linkType };
        }
    );

    //CATALOG
    //Featured Views
    mixpanel.delegate_links(".featuredViews .featuredView", "a", "Clicked Featured View", false);

    //Catalog results
    mixpanel.delegate_links(".gridList .titleLine", "a", "Clicked Catalog Result", false,
        function(element)
        {
            var linkNo = parseFloat($(element).closest('.item').find('.index .value').text());
            var page = $(element).closest('.browseList').find('.pagination .active').text();
            var pageNo = (page=='')? 1 : parseFloat(page);
            return { 'Result Number': linkNo, 'Page Number': pageNo };
        }
    );


    //SEARCH FACETS
    //View Types/Categories/Topics
    mixpanel.delegate_links(".facetSection", "a", "Used Search Facets", false,
        function(element)
        {
            facetType = $(element).closest('.facetSection').find('> .title').text();
            var linkName = element.text;
            return { 'Facet Type': facetType, 'Facet Type Name': linkName };
        }
    );

    //SIDEBAR TRACKING
    mixpanel.delegate_links("#sidebarOptions", "a", "Clicked Sidebar Option", false,
        function(element)
        {
            return {'Sidebar Name': element.title};
        }
    );

    //Panes in sidebar (Needs a delegated .on since they are not present in the DOM from the beginning)
    mixpanel.delegate_links('#gridSidebar', 'a.headerLink', "Clicked Pane in Sidebar", false,
        function(element)
        {
            return {'Pane Name': element.text};
        }
    );

    //In the visualize pane - the different visualization types
    mixpanel.delegate_links('#gridSidebar', '.radioBlock .radioLine', "Chose Visualization Type", true,
        function(element)
        {
            return {'Visualization Type': element.outerText};
        }
    );

    //Render Type Options
    mixpanel.delegate_links("#renderTypeOptions", "a", "Changed Render Type Options", false,
        function(element)
        {
            return {'Render Type': element.title};
        }
    );


    // GOVSTAT
    // opening old chart
    mixpanel.delegate_links('#janus', '.goalBox .pull.down', 'Opened Goal Chart', false,
        function() { return {} }
    );

    // opening new chart
    mixpanel.delegate_links('#janus', '.goalBox .progressViewChart .viewChart', 'Opened Goal Chart', false,
        function() { return {} }
    );

}
