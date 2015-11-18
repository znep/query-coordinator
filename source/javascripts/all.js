//= require_tree .

$(function() {
	var dd = new DropDown( $('#dd') );
  var modal = new Modal( document );

	$(document).click(function() {
		// all dropdowns
		$('.wrapper-dropdown').removeClass('active');
	});
});
