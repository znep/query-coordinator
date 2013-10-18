//HEADER
$.mixpanelMeta();
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
















