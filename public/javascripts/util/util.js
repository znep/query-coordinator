(function($) {
    
$.urlParam = function(name, url){
	var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
	return results[1] || 0;
}

})(jQuery);