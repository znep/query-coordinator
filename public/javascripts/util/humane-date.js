/*
 * Javascript Humane Dates
 * Copyright (c) 2008 Dean Landolt (deanlandolt.com
 * 
 * 
 * Adopted from the John Resig's pretty.js
 * at http://ejohn.org/blog/javascript-pretty-date
 * and henrah's proposed modification 
 * at http://ejohn.org/blog/javascript-pretty-date/#comment-297458
 * 
 * Licensed under the MIT license.
 */

// Takes an ISO time and returns a string representing how
// long ago the date represents.

/*
 * (jeff.scherpelz@blist.com):
 *          * Moved into project namespace & reformatted code to match style
 *          * Separate calls for ISO date and Date object
 */

var humaneUtilNS = blist.namespace.fetch('blist.util.humaneDate');

_.each(['minute', 'hour', 'day', 'week', 'month', 'year'], function(duration)
{
    blist.util.humaneDate[duration.toUpperCase()] = {
        duration: moment.duration(1, duration).as('milliseconds'),
        translation_key: 'current_' + duration + '_future'
    };
});

blist.util.humaneDate.getFromDate = function (date_obj, granularity)
{
    var date = moment(date_obj);

    if (!date.isValid())
    { return $.t('core.forms.none'); } // Yes, I'm cheating.
    if (_.isUndefined(granularity))
    { return date.fromNow(); }

    var now = moment(), abs_diff = Math.abs(date.diff(now));

    if (granularity.duration >= abs_diff)
    { return $.t('core.date_time.' + granularity.translation_key); }
    else
    { return date.fromNow(); }
};

blist.util.humaneDate.getFromISO = function (date_str)
{
    var time = ('' + date_str).replace(/-/g,"/").replace(/[TZ]/g," ");
    return humaneUtilNS.getFromDate(new Date(time));
};

// If jQuery is included in the page, adds a jQuery plugin to handle it as well
if ( typeof jQuery != "undefined" )
{
    jQuery.fn.humane_dates = function()
    {
        return this.each(function()
                {
                    var date = moment(this.title);
                    if ( date.isValid() )
                    {
                        jQuery(this).text( date.fromNow() );
                    }
                });
    };
}
