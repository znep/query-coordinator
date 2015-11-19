//= require_tree .

document.addEventListener('DOMContentLoaded', function() {
	var dd = new DropDown( document.querySelector('#dd') );
  var modalFactory = new ModalFactory( document );
  var toggleFactory = new ToggleFactory( document );
  var flyoutFactory = new FlyoutFactory( document );
  var flannelFactory = new FlannelFactory( document );

  document.addEventListener('click', function() {
		// all dropdowns
    var dropdowns = document.querySelectorAll('.wrapper-dropdown')
    for (var i = 0; i < dropdowns.length; i++) {
      dropdowns[i].classList.remove('active');
    }
	});
});
