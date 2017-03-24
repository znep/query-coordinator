/*
  License:
  Tache 1.0 jQuery Plugin

  Copyright (c) 2008 Jon Combe (http://joncom.be)

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without
  restriction, including without limitation the rights to use,
  copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following
  conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  OTHER DEALINGS IN THE SOFTWARE.
*/

/*
  v1.1 (jeff.scherpelz@blist.com): Added support for data parameters besides strings
  v1.2 (jeff.scherpelz@blist.com): Support for de-duping in-process requests
*/

(function($) {

  // define public plugin contents
  $.Tache = {
    Data:         [],
    InProcessData: [],
    Delete:       function(a) { Delete(a) },
    DeleteAll:    function()  { DeleteAll() },
    Get:          function(a) { Get(a) },
    SetTimeout:   function(a) { SetTimeout(a) },
    Timeout:      600   // 600 seconds = 10 minutes
  };

  // PRIVATE: create a unique identifier
  function CreateID(oAJAX) {
    var sIdentifier = oAJAX.url;
    sIdentifier += ((typeof oAJAX.data == "string") ? oAJAX.data :
        oAJAX.data ? $.param(oAJAX.data).split('&').sort().join('&') : "" );
    sIdentifier += ((typeof oAJAX.dataType == "string") ? oAJAX.dataType : "");
    sIdentifier += ((typeof oAJAX.type == "string") ? oAJAX.type : "");
    return sIdentifier;
  }

  // PUBLIC: delete a single data item
  function Delete(oAJAX) {
    // exit now if we haven't been passed a URL
    if (typeof oAJAX.url != "string") {
      alert("No AJAX URL passed");
      return;
    }

    // delete expired and
    var sIdentifier = CreateID(oAJAX);
    var dtNow = new Date();
    for (var i = $.Tache.Data.length; i > 0; i--) {
      if ((((dtNow.valueOf() - $.Tache.Data[i-1].dtAge.valueOf()) / 1000) > $.Tache.Timeout ) || ($.Tache.Data[i-1].sIdentifier == sIdentifier)) {
          $.Tache.Data.splice(i-1, 1);
      }
    }
    for (var i = $.Tache.InProcessData.length; i > 0; i--) {
      if ((((dtNow.valueOf() - $.Tache.InProcessData[i-1].dtAge.valueOf()) / 1000) > $.Tache.Timeout ) || ($.Tache.InProcessData[i-1].sIdentifier == sIdentifier)) {
          $.Tache.InProcessData.splice(i-1, 1);
      }
    }
  }

  // PUBLIC: delete all cached data
  function DeleteAll() {
    $.Tache.Data = [];
    $.Tache.InProcessData = [];
  }

  // PUBLIC: return the data of ajax call either directly from the server or from memory if pre-loaded
  function Get(oAJAX) {
    // exit now if we haven't been passed a URL
    if (typeof oAJAX.url != "string") {
      alert("No AJAX URL passed");
      return;
    }

    // find if the data has been cached has already been called, deleting expired requests as we go
    var sIdentifier = CreateID(oAJAX);
    var dtNow = new Date();
    for (var i = $.Tache.Data.length; i > 0; i--) {
      if ( ((dtNow.valueOf() - $.Tache.Data[i-1].dtAge.valueOf()) / 1000) > $.Tache.Timeout ) {
          // delete expired request
          $.Tache.Data.splice(i-1, 1);
      } else if ($.Tache.Data[i-1].sIdentifier == sIdentifier) {
          var item = $.Tache.Data[i-1];
          if (item.hasOwnProperty('oData'))
          { oAJAX.success(item.oData); }
          else if (item.hasOwnProperty('oErrorReq'))
          { oAJAX.error(item.oErrorReq); }
          return;
      }
    }

    // Check the in-process queue, also
    for (var i = $.Tache.InProcessData.length; i > 0; i--) {
      if ( ((dtNow.valueOf() - $.Tache.InProcessData[i-1].dtAge.valueOf()) / 1000) > $.Tache.Timeout ) {
          // delete expired request
          $.Tache.InProcessData.splice(i-1, 1);
      } else if ($.Tache.InProcessData[i-1].sIdentifier == sIdentifier) {
          $.Tache.InProcessData[i-1].oReqs.push(oAJAX);
          return;
      }
    }

    // the data wasn't found; alter the callback to insert the soon-to-be requested data into the cache
    var oCallback = oAJAX.success;
    $.Tache.InProcessData.push({ sIdentifier: sIdentifier, dtAge: new Date(), oReqs: [oAJAX]});
    oAJAX.success = function(oNewData, ts, xhr) {
      // Don't cache pending response
      if (xhr.status == 200)
      { $.Tache.Data.push({ sIdentifier: sIdentifier, oData: oNewData, dtAge: new Date() }); }

      oAJAX.success = oCallback;
      for (var i = 0; i < $.Tache.InProcessData.length; i++)
      {
        if ($.Tache.InProcessData[i].sIdentifier == sIdentifier)
        {
            var ipItem = $.Tache.InProcessData.splice(i, 1)[0];
            for (var j = 0; j < ipItem.oReqs.length; j++) {
              ipItem.oReqs[j].success.apply(this, arguments);
            }
        }
      }
    };
    var oeCallback = oAJAX.error;
    oAJAX.error = function(xhr)
    {
        // Don't cache internal errors
        if (xhr.status < 500)
        { $.Tache.Data.push({ sIdentifier: sIdentifier, oErrorReq: xhr, dtAge: new Date() }); }

        oAJAX.error = oeCallback;
        for (var i = 0; i < $.Tache.InProcessData.length; i++)
        {
            if ($.Tache.InProcessData[i].sIdentifier == sIdentifier)
            {
                var ipItem = $.Tache.InProcessData.splice(i, 1)[0];
                for (var j = 0; j < ipItem.oReqs.length; j++)
                {
                    if (ipItem.oReqs[j].error instanceof Function)
                    { ipItem.oReqs[j].error.apply(this, arguments); }
                }
            }
        }
    };
    $.ajax(oAJAX);
  }

  // PUBLIC: set the timeout value
  function SetTimeout(iSeconds) {
    $.Tache.Timeout = iSeconds;
  }

})(jQuery);