//= require_tree .

$(function() {
	var dd = new DropDown( $('#dd') );
  var modalFactory = new ModalFactory( document );
  var toggleFactory = new ToggleFactory( document );
  var flyoutFactory = new FlyoutFactory( document );
  var flannelFactory = new FlannelFactory( document );

	$(document).click(function() {
		// all dropdowns
		$('.wrapper-dropdown').removeClass('active');
	});
});
