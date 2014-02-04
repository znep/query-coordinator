(function($) {

blist.defaultColors = ['#003366', '#D95F02', '#1B9E77', '#e6ab02', '#7570b3'];

// Colors and imagebuilder

$.colorToObj = function(rgb)
{
    if (rgb.startsWith('#') || rgb.match(/^[a-fA-F0-9]{3,6}$/)) { return $.hexToRgb(rgb); }
    var m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)(,\s*\d+\.?\d+)?\)/);
    return {r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3])};
};

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

// Adapted from http://svn.dojotoolkit.org/src/dojox/trunk/color/_base.js
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

// Adapted from http://svn.dojotoolkit.org/src/dojox/trunk/color/_base.js
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

// Adapted from http://svn.dojotoolkit.org/src/dojox/trunk/color/_base.js
$.hslToRgb = function(hsl){
    var hue=hsl.h, saturation=hsl.s, luminosity=hsl.l;
    saturation/=100;
    luminosity/=100;

    while(hue<0){ hue+=360; }
    while(hue>=360){ hue-=360; }

    var r, g, b;
    if(hue<120){
        r=(120-hue)/60, g=hue/60, b=0;
    } else if (hue<240){
        r=0, g=(240-hue)/60, b=(hue-120)/60;
    } else {
        r=(hue-240)/60, g=0, b=(360-hue)/60;
    }

    r=2*saturation*Math.min(r, 1)+(1-saturation);
    g=2*saturation*Math.min(g, 1)+(1-saturation);
    b=2*saturation*Math.min(b, 1)+(1-saturation);
    if(luminosity<0.5){
        r*=luminosity, g*=luminosity, b*=luminosity;
    }else{
        r=(1-luminosity)*r+2*luminosity-1;
        g=(1-luminosity)*g+2*luminosity-1;
        b=(1-luminosity)*b+2*luminosity-1;
    }
    return { r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) };
};

// Adapted from http://svn.dojotoolkit.org/src/dojox/trunk/color/_base.js
$.rgbToHsl = function(rgb){
    var r=rgb.r/255, g=rgb.g/255, b=rgb.b/255;
    var min = Math.min(r, b, g), max = Math.max(r, g, b);
    var delta = max-min;
    var h=0, s=0, l=(min+max)/2;
    if(l>0 && l<1){
        s = delta/((l<0.5)?(2*l):(2-2*l));
    }
    if(delta>0){
        if(max==r && max!=g){
            h+=(g-b)/delta;
        }
        if(max==g && max!=b){
            h+=(2+(b-r)/delta);
        }
        if(max==b && max!=r){
            h+=(4+(r-g)/delta);
        }
        h*=60;
    }
    return { h:h, s:Math.round(s*100), l:Math.round(l*100) };   //  Object
};

$.rgbTosRGB = function(rgb){
    _.each(['r', 'g', 'b'], function(comp)
    { rgb[comp] = (rgb[comp] <= 0.03928) ? rgb[comp]/12.92
                                         : Math.pow(((rgb[comp] + 0.055)/1.055), 2.4); });
    return rgb;
};

$.rotateHue = function(hsv, degrees)
{
    var h = hsv.h + degrees;
    h += Math.ceil(-h/360) * 360;
    hsv.h = h%360;
    return hsv;
};
$.rotateRgb = function(rgb, degrees)
{ return $.hsvToRgb($.rotateHue($.rgbToHsv(rgb), degrees)); };
$.rotateHex = function(hex, degrees)
{ return '#' + $.rgbToHex($.rotateRgb($.hexToRgb(hex), degrees)); };

// As defined in WCAG 2.0, §1.4.3, 1.4.6.
// Level AA >= 4.5; Level AAA >= 7.
$.colorContrast = function(hex_colors)
{
    var sRGB = _.map(_.map(arguments, $.hexToRgb), $.rgbTosRGB);
    // Relative luminscence: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
    var L = _.map(sRGB,
        function(sRGB) { return 0.2126 * sRGB.r + 0.7152 * sRGB.g + 0.0722 * sRGB.b; });

    return Math.round((Math.max.apply(null, L) + 0.05)/(Math.min.apply(null, L) + 0.05)*10)/10;
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
    options = options || { maxValue: 100 };

    if (!_.isArray(colors)) { colors = [colors]; }
    colors = _.map(colors, function(color)
    {
        if (!color.r) { color = $.hexToRgb(color); }
        return $.rgbToHsv(color);
    });
    var toColor = colors[0];

    // Anchor on black if it's a high value color
    // Anchor on white if it's a high saturation color
    var lowColor = colors.length > 1
        ? colors[1]
        : {
            h: toColor.h,
            s: toColor.s > 50 ? 0 : 100,
            v: toColor.v > 50 ? 0 : options.maxValue
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

$.complementaryGradient = function(stops, color)
{
    var hsv = $.rgbToHsv($.hexToRgb(color))

    var complementHue = (hsv.h*2)+137;
    complementHue = complementHue < 360
        ? complementHue
        : Math.floor(hsv.h/2)-137;

    var lowStops = stops % 2 == 0 ? stops/2+1 : Math.ceil(stops/2);
    var highStops = stops - lowStops + 1;

    var gradient = $.gradient(lowStops, $.hsvToRgb($.extend({}, hsv, {h:complementHue}))).reverse();
    gradient.pop();
    return gradient.concat($.gradient(highStops, color));
};

// FIXME: 'brighten' is so utterly wrong...
// This is a replacement for Highcharts' brighten function.
// amount is defined as steps along a 100 point scale.
$.brighten = function(color, amount)
{
    if (!amount) { amount = 10; }
    if (!color.r) { color = $.hexToRgb(color); }
    color = $.rgbToHsv(color);
    color.v += amount;
    if (color.v > 100) { color.v = 100; }
    return $.hsvToRgb(color);
};

})(jQuery);
