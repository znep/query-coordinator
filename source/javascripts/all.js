//= require_tree .

document.addEventListener('DOMContentLoaded', function() {
	var dd = new DropDown( document.querySelector('#dd') );
  var du = new DropDown( document.querySelector('#du') );

  var modalFactory = new ModalFactory( document );
  var toggleFactory = new ToggleFactory( document );
  var flyoutFactory = new FlyoutFactory( document );
  var flannelFactory = new FlannelFactory( document );

  document.addEventListener('click', function() {
		// all dropdowns
    var dropdowns = document.querySelectorAll('.dropdown')
    for (var i = 0; i < dropdowns.length; i++) {
      dropdowns[i].classList.remove('active');
    }
	});
});
