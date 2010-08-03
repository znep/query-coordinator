(function($) {

// Colors and imagebuilder

$.hexToRgb = function(hex)
{
    hex = hex.replace('#', '');
    if (hex.length < 6)
    {
        hex = hex.replace(/([0-9abcdef])/gi, "$1$1");
    }
    hex = parseInt(hex, 16);

	return {r: hex >> 16, g: (hex & 0x00FF00) >> 8, b: (hex & 0x0000FF)};
};

$.rgbToHex = function(rgb)
{
    var hex = [ rgb.r.toString(16), rgb.g.toString(16), rgb.b.toString(16) ];
    $.each(hex, function (i) {
		if (hex[i].length == 1) {
			hex[i] = '0' + hex[i];
		}
	});
	return hex.join('');
};

// Adapted from http://svn.dojotoolkit.org/low/dojox/trunk/color/_base.js
$.hsvToRgb = function(hsv){
    //  hue from 0-359 (degrees), saturation and value 0-100.
    var hue=hsv.h, saturation=hsv.s, value=hsv.v;

    if(hue==360){ hue=0; }
    saturation/=100;
    value/=100;

    var r, g, b;
    if(saturation==0){
        r=value, b=value, g=value;
    }else{
        var hTemp=hue/60, i=Math.floor(hTemp), f=hTemp-i;
        var p=value*(1-saturation);
        var q=value*(1-(saturation*f));
        var t=value*(1-(saturation*(1-f)));
        switch(i){
            case 0:{ r=value, g=t, b=p; break; }
            case 1:{ r=q, g=value, b=p; break; }
            case 2:{ r=p, g=value, b=t; break; }
            case 3:{ r=p, g=q, b=value; break; }
            case 4:{ r=t, g=p, b=value; break; }
            case 5:{ r=value, g=p, b=q; break; }
        }
    }
    return { r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) };
}

// Adapted from http://svn.dojotoolkit.org/low/dojox/trunk/color/_base.js
$.rgbToHsv = function(rgb){
    var r=rgb.r/255, g=rgb.g/255, b=rgb.b/255;
    var min = Math.min(r, b, g), max = Math.max(r, g, b);
    var delta = max-min;
    var h = null, s = (max==0)?0:(delta/max);
    if(s==0){
        h = 0;
    }else{
        if(r==max){
            h = 60*(g-b)/delta;
        }else if(g==max){
            h = 120 + 60*(b-r)/delta;
        }else{
            h = 240 + 60*(r-g)/delta;
        }

        if(h<0){ h+=360; }
    }
    return { h:h, s:Math.round(s*100), v:Math.round(max*100) };
};

$.addColors = function(a, b)
{
    var rgbA = $.hexToRgb(a);
    var rgbB = $.hexToRgb(b);

    var addComponent = function(a, b)
    {
        return Math.min(a + b, 255);
    };
    return $.rgbToHex({
        r: addComponent(rgbA.r, rgbB.r),
        g: addComponent(rgbA.g, rgbB.g),
        b: addComponent(rgbA.b, rgbB.b)
    });
};

$.subtractColors = function(a, b)
{
    var rgbA = $.hexToRgb(a);
    var rgbB = $.hexToRgb(b);

    var subtractComponent = function(a, b)
    {
        return Math.max(a - b, 0);
    };
    return $.rgbToHex({
        r: subtractComponent(rgbA.r, rgbB.r),
        g: subtractComponent(rgbA.g, rgbB.g),
        b: subtractComponent(rgbA.b, rgbB.b)
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

$.gradient = function(stops, colors, options)
{
    options = options || {};

    if (!_.isArray(colors)) { colors = [colors]; }
    colors = _.map(colors, function(color)
    {
        if (!color.r) { color = $.hexToRgb(color); }
        return $.rgbToHsv(color);
    });
    var toColor = colors[0];

    var complement = function(hue)
    {
        var complement = (hue*2)+137;
        return complement < 360
            ? complement
            : Math.floor(hue/2)-137;
    }

    // Anchor on black if it's a high value color
    // Anchor on white if it's a high saturation color
    var lowColor = colors.length > 1
        ? colors[1]
        : {
            h: toColor.h,
            s: toColor.s > 50 ? 0 : 100,
            v: toColor.v > 50 ? 0 : 100
        };

    var colorStep = {
        h: (toColor.h - lowColor.h)/(stops-1),
        s: (toColor.s - lowColor.s)/(stops-1),
        v: (toColor.v - lowColor.v)/(stops-1)
    };

    var colorList = [];
    for (var i = 0; i < stops; i++)
    {
        colorList[i] = $.hsvToRgb({
            h: toColor.h - (i * colorStep.h),
            s: toColor.s - (i * colorStep.s),
            v: toColor.v - (i * colorStep.v)
            });
    }

    return colorList.reverse();
};

})(jQuery);
