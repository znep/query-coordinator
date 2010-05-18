(function($)
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

    if (div.style.backgroundImage)
    {
        $.support.linearGradient = true;
    }

})(jQuery);

$(function()
{
    // Infinite Exasperation?
    if ($.browser.msie)
    {
        $('body').addClass('ie ie' + $.browser.version.slice(0, 1)); // I guess this will break when we hit IE10.
        $('a.button').each(function()
        {
            $.tag({tagName: 'span', 'class': 'left' }).prependTo($(this));
        });
    }

    // Apply feature detected classes if applicable
    if ($.support.borderRadius === false)
    {
        $('body').addClass('noBorderRadius');
    }
    if ($.support.linearGradient === false)
    {
        $('body').addClass('noLinearGradient');
    }
    if (($.support.borderRadius === false) && ($.support.linearGradient === false))
    {
        $('body').addClass('noCss3');
    }
});