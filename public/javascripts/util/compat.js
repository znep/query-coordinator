;(function($)
{
    // Add extra feature detection

    // border-radius, as seen on http://www.cssnewbie.com/test-for-border-radius-support/
	$.support.borderRadius = false;
	_.each(['BorderRadius','MozBorderRadius','WebkitBorderRadius','OBorderRadius','KhtmlBorderRadius'], function(p)
	{
		if (document.body.style[p] !== undefined)
		{
		    $.support.borderRadius = true;
	    }
	});

    // linear gradient, as seen on http://github.com/westonruter/css-gradients-via-canvas/blob/master/css-gradients-via-canvas.js
    $.support.linearGradient = false;
    var div = document.createElement('div');
    div.style.cssText = [
        "background-image:-webkit-gradient(linear, 0% 0%, 0% 100%, from(red), to(blue));",
        "background-image:-moz-linear-gradient(top left, bottom right, from(red), to(blue));", /*Firefox 3.6 Alpha*/
        "background-image:-moz-linear-gradient(left, red, blue);" /*Firefox 3.6*/
    ].join('');

    $.support.svg = window.SVGAngle ||
                    document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");

    if (div.style.backgroundImage)
    {
        $.support.linearGradient = true;
    }

    // Add device detection
    $.device = $.device || {};

    if (navigator.userAgent.match(/iPad/i) != null)
    {
        $.device.ipad = true;
    }
    if (navigator.userAgent.match(/(iPhone|iPod)/i) != null)
    {
        $.device.iphone = true;
    }
    if (navigator.userAgent.match(/Android/i) != null)
    {
        $.device.android = true;
    }
    if ($.device.iphone || $.device.android)
    {
        $.device.mobile = true;
    }

})(jQuery);

$(function()
{
    $.browser.majorVersion = parseInt($.browser.version);

    // Infinite Exasperation?
    if ($.browser.msie)
    {
        // add version classes
        $('html').addClass('ie ie' + $.browser.version.slice(0, 1)); // I guess this will break when we hit IE10.

        // add button elems
        $('a.button').each(function()
        {
            $.tag({tagName: 'span', 'class': 'left' }).prependTo($(this));
        });
    }

    // Apply feature detected classes if applicable
    if ($.support.borderRadius === false)
    {
        $('html').addClass('noBorderRadius');
    }
    if ($.support.linearGradient === false)
    {
        $('html').addClass('noLinearGradient');
    }
    if (($.support.borderRadius === false) && ($.support.linearGradient === false))
    {
        $('html').addClass('noCss3');
    }
});