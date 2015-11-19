//= require_tree .

$(function() {
	var dd = new DropDown( $('#dd') );
  var modalFactory = new ModalFactory( document );

	$(document).click(function() {
		// all dropdowns
		$('.wrapper-dropdown').removeClass('active');
	});
});
