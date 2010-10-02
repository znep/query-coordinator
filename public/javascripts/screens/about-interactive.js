$(function() {
	
//TABS
	var $tabs = $("#interactive-tabs").tabs();
	//remember to revert this back to "4"
	$("#interactive-tabs").tabs({ selected: 4 });

//CAROUSEL
		
//MOUSE EVENTS	
	$(".collaborate").click(function() {
	    $tabs.tabs('select', 0);
	    return false;
	});
	$(".manage").click(function() {
	    $tabs.tabs('select', 1);
	    return false;
	});	
	$(".measure").click(function() {
	    $tabs.tabs('select', 2);
	    return false;
	});
	$(".publish").click(function() {
	    $tabs.tabs('select', 3);
	    return false;
	});	
	$(".discover").click(function() {
	    $tabs.tabs('select', 5);
	    return false;
	});	
	$(".analyze").click(function() {
	    $tabs.tabs('select', 6);
	    return false;
	});	
	$(".participate").click(function() {
	    $tabs.tabs('select', 7);
	    return false;
	});	
	$(".create").click(function() {
	    $tabs.tabs('select', 8);
	    return false;
	});
	
	$(".close-button").click(function() {
	    $tabs.tabs('select', 4);
	    return false;
	});	

	
});