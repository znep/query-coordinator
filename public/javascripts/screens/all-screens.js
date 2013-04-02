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

    $.validator.addMethod("customHttpMaybeSUrl", function(value, element)
    {
        var regex = /^https?:\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
        return this.optional(element) || regex.test(value);
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
        $('#siteHeader').addClass('loggedIn').find('.siteUserNav').addClass('loggedInNav');
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

    var on_current_user = [];

    // global fn
    var getCurrentUser = function()
    {
        $.socrataServer.makeRequest({
            type: "GET",
            url: '/api/users/current.json',
            headers: {'Cache-Control': 'nocache'},
            success: function(user)
            {
                blist.currentUser = user;
                blist.currentUserId = user.id;
                for (var i = 0; i < on_current_user.length; i++)
                {
                    successCallback = on_current_user[i];
                    if (_.isFunction(successCallback))
                    {
                        successCallback(user);
                    }
                }
            },
            error: function() {
                // noop
            }});
    };

    // kick off the process of setting the current user
    var loggedInCookie = $.cookies.get('logged_in');
    if (loggedInCookie && loggedInCookie == "true")
    {
        if (blist.currentUser === undefined)
        {
            getCurrentUser();
        }
    }

    //  Callback mechanism for when the request for the
    //  current user is slow
    var onCurrentUser = function(successCallback)
    {
        if (blist.currentUser !== undefined)
        {
            successCallback(blist.currentUser);
        } else {
            on_current_user.push(successCallback);
        }
    };

    onCurrentUser(
      function (user)
      {
         $('.accountLink .text .currentUser').html(user.displayName);
         $('.accountLink').removeClass('hide');
         $('.signOutLink').removeClass('hide');
         $('.signInLink').addClass('hide');
         $('.signUpLink').addClass('hide');
         if (user !== undefined && user.rights && user.rights.length > 0)
         {
            $('.adminLink').removeClass('hide');
         }
      });
});
