// extend jQuery with Firebug console logging: http://muzso.hu/2008/03/07/logging-to-the-firebug-console-in-jquery
$.fn.log = function (msg)
{
    console.log("%s: %o", msg, this);
    return this;
};
