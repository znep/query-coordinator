

mixpanel.delegate_links = function (parent, selector, event_name, properties) {
    properties = properties || {};
    parent = parent || document.body;
    parent = $(parent);

    parent.on('click', selector, function (event) {
        var new_tab = event.which === 2 || event.metaKey || event.target.target === '_blank';

        properties.url = event.target.href;

        function callback() {
            if (new_tab) {
                return;
            }

            window.location = properties.url;
        }

        if (!new_tab) {
            event.preventDefault();
            setTimeout(callback, 300);
        }

        mixpanel.track(event_name, properties, callback);
    });
};






//HEADER
$.mixpanelMeta(); //does this get read before every call? it should update all the meta every time...
mixpanel.track_links("#siteHeader a", "Clicked Header Item", 
	function(element) { 
		var linkType = '';
		if(element.title != ""){
			linkType = element.title;
		}
		else {linkType = element.text}
		return { 'Header Item Type': linkType };
	}
);

//FOOTER
mixpanel.track_links("#siteFooter a", "Clicked Footer Item", 
	function(element) { 
		var linkType = '';
		if(element.title != ""){
			linkType = element.title;
		}
		else {linkType = element.text}
		return { 'Footer Item Type': linkType };
	}
);

//Featured Views
mixpanel.track_links(".featuredViews .featuredView a", "Clicked Featured View");

//Catalog results
mixpanel.track_links(".gridList .titleLine a", "Clicked Catalog Result",
	function(element) { 
		var linkNo = parseFloat($(element).closest('.item').find('.index .value').text());
		var page = $(element).closest('.browseList').find('.pagination .active').text();
		var pageNo = (page=='')? 1 : parseFloat(page);
		return { 'Result Number': linkNo, 'Page Number': pageNo };
	}
);

//Search Dataset in catalog NEED TO TEST THIS SOMEHOW
mixpanel.track_forms("input[name='browseSearch']", "Used Search Field",
	function(element) {
		return {'Search Term': $("input[name='browseSearch']").value()};
	}
);

//SEARCH FACETS
//View Types/Categories/Topics
mixpanel.track_links(".facetSection a", "Used Search Facets", 
	function(element) {
		facetType = $(element).closest('.facetSection').find('> .title').text();
		var linkName = element.text;
		return { 'Facet Type': facetType, 'Facet Type Name': linkName };
	}
);

//SIDEBAR TRACKING
mixpanel.track_links("#sidebarOptions a", "Clicked Sidebar Option",
	function(element){
		return({'Sidebar Name': element.title});
	}
);

//Panes in sidebar (Needs a delegated .on since they are not present in the DOM from the beginning)
$('#gridSidebar').on("click", 'a.headerLink',
	function(){
		mixpanel.track("Clicked Pane in Sidebar",
		{'Pane Name': $(this).text()});
	}
);

//Render Type Options              
mixpanel.track_links("#renderTypeOptions a", "Changed Render Type Options",
	function(element){
		return({'Render Type': element.title});
	}
);









