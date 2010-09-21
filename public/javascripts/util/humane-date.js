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

blist.util.humaneDate.MINUTE = 0;
blist.util.humaneDate.HOUR = 3;
blist.util.humaneDate.DAY = 6;
blist.util.humaneDate.WEEK = 9;
blist.util.humaneDate.MONTH = 12;
blist.util.humaneDate.YEAR = 15;
blist.util.humaneDate.CENTURY = 18;

blist.util.humaneDate.getFromDate = function (date_obj, granularity)
{
    if (granularity === undefined)
    {
        granularity = blist.util.humaneDate.MINUTE;
    }

    if (_.isNumber(date_obj)) { date_obj = new Date(date_obj); }

    var dt = new Date();
    var seconds = (dt - date_obj) / 1000;
    var token = 'ago', list_choice = 1;

    if (seconds < 0)
    {
        seconds = Math.abs(seconds);
        token = 'from now';
        list_choice = 2;
    }

    var i = granularity;
    var format = humaneUtilNS.timeFormats[i++];
    while (format)
    {
        if (seconds < format[0])
        {
            if (format.length < 3)
            {
                return format[1];
            }
            if (typeof format[2] == 'string')
            {
                return format[list_choice];
            }
            else
            {
                return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
            }
        }
        format = humaneUtilNS.timeFormats[i++];
    }
    // overflow for centuries
    if (seconds > 5806080000)
    {
        return Math.floor(seconds / 2903040000) + ' centuries ' + token;
    }

    return 'some time ago';
};

blist.util.humaneDate.getFromISO = function (date_str)
{
    var time = ('' + date_str).replace(/-/g,"/").replace(/[TZ]/g," ");
    return humaneUtilNS.getFromDate(new Date(time));
};

blist.util.humaneDate.timeFormats = [
    [60, 'just now'],
    [120, '1 minute ago', '1 minute from now'], // 60*2
    [3600, 'minutes', 60], // 60*60, 60
    [3600, 'this hour'], // 60*60, 60
    [7200, '1 hour ago', '1 hour from now'], // 60*60*2
    [86400, 'hours', 3600], // 60*60*24, 60*60
    [86400, 'today'], // 60*60*24, 60*60
    [172800, 'yesterday', 'tomorrow'], // 60*60*24*2
    [604800, 'days', 86400], // 60*60*24*7, 60*60*24
    [604800, 'this week'], // 60*60*24*7, 60*60*24
    [1209600, 'last week', 'next week'], // 60*60*24*7*4*2
    [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
    [2419200, 'this month'], // 60*60*24*7*4, 60*60*24*7
    [4838400, 'last month', 'next month'], // 60*60*24*7*4*2
    [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
    [29030400, 'this year'], // 60*60*24*7*4*12, 60*60*24*7*4
    [58060800, 'last year', 'next year'], // 60*60*24*7*4*12*2
    [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [2903040000, 'this century'], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [5806080000, 'a century ago', 'a century from now'] // 60*60*24*7*4*12*100*2
];


// If jQuery is included in the page, adds a jQuery plugin to handle it as well
if ( typeof jQuery != "undefined" )
{
    jQuery.fn.humane_dates = function()
    {
        return this.each(function()
                {
                    var date = humaneUtilNS.getFromISO(this.title);
                    if ( date )
                    {
                        jQuery(this).text( date );
                    }
                });
    };
}
