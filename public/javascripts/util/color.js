(function($) {

// Colors and imagebuilder

$.hexToRgb = function(hex)
{
    if (hex.length < 6)
    {
        hex = hex.replace(/([0-9abcdef])/gi, "$1$1");
    }
    hex = parseInt(hex.replace('#', ''), 16);

	return {r: hex >> 16, g: (hex & 0x00FF00) >> 8, b: (hex & 0x0000FF)};
};

$.rgbToHex = function(rgb)
{
    var hex = [ rgb.r.toString(16), rgb.g.toString(16), rgb.b.toString(16) ];
    $.each(hex, function (i) {
		if (hex[i].length == 1) {
			hex[i] = '0' + val;
		}
	});
	return hex.join('');
};


$.addColors = function(a, b)
{
    var rgbA = $.hexToRgb(a);
    var rgbB = $.hexToRgb(b);

    var addComponent = function(a, b)
    {
        return Math.min(a + b, 255)
    };
    return $.rgbToHex({
        r: addComponent(rgbA.r, rgbB.r),
        g: addComponent(rgbA.g, rgbB.g),
        b: addComponent(rgbA.b, rgbB.b)
    });
};

$.gradientString = function(stops)
{
    var results = [];
    for (var i = 0; i < stops.length; i++)
    {
        if (stops[i] instanceof Array)
        {
            stops[i][0] = stops[i][0].replace(/#/, '');
            results.push(stops[i].join(':'));
        }
        else
        {
            stops[i] = stops[i].replace(/#/, '');
            results.push(stops[i]);
        }
    }
    return results.join(',');
};

$.urlToImageBuilder = function(options, format, css)
{
    var result = '/ui/box.' + ((format === undefined) ? 'png' : format) + '?';
    var properties = [];
    for (var property in options)
    {
        properties.push(property + '=' + options[property]);
    }
    result += properties.join('&');
    return ((css === true) ? ('url(' + result + ')') : result);
};

})(jQuery);