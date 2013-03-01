$(function(){

  //do nothing if the user is not logged in.
  if (!blist.currentUserId){
    return;
  }

  //create the modal
  $('body').append(
    $.tag2({
      _:'div',
      className:'modalDialog',
      id:'sessionTimeoutModal',
      contents:[
        {_:'h2', contents:'Your session is about to expire'},
        {
          _:'p', 
          contents:[
            "We haven't noticed any activity in a few minutes.  For privacy, we'll log you out in ",
            {_:'span', id:'secondsRemaining'},
            ' seconds'
          ]
        },
        {
          _:'div', 
          className:'buttonWrapper',
          contents:[{_:'a', id:'keepSessionButton', className:'button', contents:"Don't log me out!"}]
        }
      ]
    })
  );
  var $m = $('#sessionTimeoutModal');
  $m.jqm();
  $("#keepSessionButton").click(
    function(event)
    {
      event.preventDefault();
      $m.jqmHide();
      delayExpiration();
    }
  );

  var secondsUntilTimeout,
    modalTimer,
    countdownSeconds = 60,
    secondsRemaining,
    updateTimer;

  //determine how much time is left in the session
  function checkTime(){
    $.socrataServer.makeRequest({
      url: '/logout/expire_if_idle',
      success: function(response)
      {
        if (response.expired)
        {
          blist.util.railsFlash("We logged you out.");
          window.document.location = "/login";
        }
        else 
        {
          secondsUntilTimeout = parseFloat(response.seconds);
          if (secondsUntilTimeout > countdownSeconds)
          {
            $m.jqmHide();
            scheduleCheckTime();
          } 
          else 
          {
            showModal();
          }
        }
      },
      anonymous: true,
      error: function(err)
      {
        setTimeout(checkTime, 10 * 1000);
      }
    });
  }
  checkTime();

  function scheduleCheckTime(){
    if (modalTimer){clearTimeout(modalTimer);}
    if (updateTimer){clearTimeout(updateTimer);}
    modalTimer = setTimeout(checkTime, (secondsUntilTimeout - countdownSeconds) * 1000);
  }

  function showModal(){
    secondsRemaining = secondsUntilTimeout;
    if (updateTimer) {clearInterval(updateTimer);}
    updateTimer = setInterval(countdown, 1000);
    countdown();
    $m.jqmShow();
  }

  function countdown(){
    $("#secondsRemaining").text(secondsRemaining);
    if (secondsRemaining <= 0)
    {
      if (updateTimer) {clearInterval(updateTimer);}
      setTimeout(checkTime, 1000);
      return;
    }
    if (secondsRemaining > 0) {secondsRemaining--;}
  }

  function delayExpiration()
  {
    $.socrataServer.makeRequest({
      url: '/login/extend',
      success: function(response)
      {
        secondsUntilTimeout = parseFloat(response.seconds);
        scheduleCheckTime();
        $m.jqmHide();
      },
      anonymous: false,
      error: function(err)
      {
        secondsUntilTimeout = 1000 * 20;
        scheduleCheckTime();
      }
    });
  }

});
