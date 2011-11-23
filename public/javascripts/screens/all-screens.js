;$(function()
{
    // generic events
    $.live('a[rel$=external]', 'focus', function(event)
    {
        this.target = '_blank';
    });
    $.live('a[rel$=external]', 'mouseover', function(event)
    {
        this.target = '_blank';
    });

    $.live('a[rel$=video]', 'click', function(event)
    {
        event.preventDefault();

        window.open($(this).attr('href'), '', 'width=650,height=550,location=no,menubar=no,scrollbars=no,status=no,toolbar=no');
    });

    // custom validation
    $.validator.addMethod("customUrl", function(value, element)
    {
        if (this.optional(element))
        {
            return true;
        }

        var regEx = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

        if (!/^(https?|ftp):\/\//i.test(value))
        {
            if (regEx.test("http://" + value))
            {
                $(element).val("http://" + value);
                return true;
            }
        }
        else
        {
            return regEx.test(value);
        }
        return false;
    });

    $.validator.addMethod("coordinateReferenceSystem", function(value, element)
    {
        if (this.optional(element))
        {
            return true;
        }

        // Just check that it's an EPSG code in the format EPSG:<number>.
        return /^EPSG:\d+$/i.test(value);
    });

    var loggedInCookie = $.cookies.get('logged_in');
    if (loggedInCookie && loggedInCookie == "true")
    {
        $('#siteHeader .siteUserNav').addClass('loggedInNav');
    }

    blist.namespace.fetch('blist.configuration');
    if (blist.configuration.maintenance_message &&
        window == window.top &&
        $.cookies.get('maintenance_ack') != blist.configuration.maintenance_hash)
    {
        var dismissMaintenance = function()
        {
            $('#maintenanceNotice').fadeOut();
        };
  
        $('#siteHeader').after(blist.configuration.maintenance_message);
        setTimeout(dismissMaintenance, 15000);
  
        $('#maintenanceNotice a.close').click(function(event)
        {
            event.preventDefault();
            dismissMaintenance();
            $.cookies.set('maintenance_ack', blist.configuration.maintenance_hash); 
        });
    }

    var csrfToken = $('meta[name="csrf-token"]').attr('content');
    if (!$.isBlank(csrfToken))
    {
        // for core server support
        $.cookies.set('socrata-csrf-token', csrfToken);
    }

    blist.configuration.appToken = 'U29jcmF0YS0td2VraWNrYXNz0';
    $.ajaxSetup({
        beforeSend: function(xhrObj)
        {
            xhrObj.setRequestHeader('X-App-Token', blist.configuration.appToken);
            xhrObj.setRequestHeader('X-CSRF-Token', csrfToken);
        }
    });


    // Fix dates for local timezone
    $('.dateReplace').each(function()
    {
        var $d = $(this);
        var fmt;
        switch ($d.data('dateformat'))
        {
            case 'date_time':
                fmt = 'M d, Y g:ia';
                break;
            case 'long_date':
                fmt = 'F d, Y';
                break;
            case 'date':
            default:
                fmt = 'M d, Y';
                break;
        }
        $d.text(new Date($d.data('rawdatetime') * 1000).format(fmt));
    });
});
