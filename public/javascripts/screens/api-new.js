$(function(){

  //INIT the wizard.
  bindLiveDocs();
  bindNameCheck();
  var $wizard = $('#apiFoundryWizard');
  var stepTotal;
  var options = {
      onCancel: function($pane, state)
      {
          window.location.href = '/resource/' + blist.configuration.apiFoundry.id;
          return false;
      },
      finishText: "Deploy",
      paneConfig:makePaneConfig(),
      buttonContainerId: "aboveslide"
  }
  var $paneList = $('#apiFoundryWizard ul');
  $("#stepTotal").text(stepTotal);
  $("#progressbar").progressbar({value:0});
  $('#rowIdentifierColumnId option').each(function(index, element){
    if ($(element).text() === blist.configuration.apiFoundry.defaultUniqueId){
      $(element).attr('selected', 'selected');
    }
  });
  $paneList.hide();
  $wizard.wizard(options);
  $paneList.show();

  function bindLiveDocs(){
    $('.liveDoc').each(function(index, element){
      var $element = $(element);
      var key = 'span#' + $element.attr('id') + 'Doc';
      var update = function(eventObj){
        $(key).html(($(eventObj.target).value() || '').replace(/\n/g, "<br/>"));
      };
      $element.change(update);
      $element.keyup(update);
    });
  }

  function bindNameCheck(){
    $('#resourceName').change(function(){checkResourceName();});
    $('#resourceName').keyup(function(){
      $('.availableError').hide();
    });
  }

  var rNames = {}; //candidate names: true -> available, false -> unavailable
  function checkResourceName(callback){
    checkResourceNameAvailable($('#resourceName').val(), function(name, available){
      if ($('#resourceName').val() === name){
        if (available) {
          $(".availableError").hide();
        }
        else {resourceNameConflictHandler() }
        if (callback) callback(name, available);
      }
    });
  }

  function resourceNameConflictHandler(){
    $(".availableError").show();
    $("#paneSpinner").hide();
    $(".nextButton").removeClass("disabled");
    $(".prevButton").removeClass("disabled");
  }

  function checkResourceNameAvailable(name, callback){
    if ( rNames[name] === undefined ){
      requestResourceName(name, function(checkedName, available){
        rNames[checkedName] = available;
        callback(checkedName, available);
      });
    }
    else { callback(name, rNames[name]) }
  }

  function requestResourceName(name, callback){
    //callback(name, name.length % 2 === 0);
    Dataset.lookupFromResourceName(
      name,
      function(ds){
        if (ds){
          callback(name, false);
        }
      },
      function(err){
        if (err.status === 404){
          callback(name, true);
        }
        else {callback(name, false);} //403 implies there is a dataset with that name
      }
    );
  }

  function updateProgressIndicator(ordinal){
    var progress = ordinal / stepTotal * 100;
    $("#step").text(ordinal);
    $("#progressbar").progressbar("value", progress);
  }

  function makePaneConfig() {

    var nextPaneMap = {};
    var panes = [];
    var ordinal = 1; //ordinal indicates the position in the progress meter
    var commandObj; //used by the skip-to-end button
    var onNext = {};
    var onActivate = {};
    var currentPaneId;

    $("#skip").click(function(eventObj){ commandObj.next('apiPublish'); });

    function defaultTransition(){
      commandObj.next(nextPaneMap[currentPaneId]);
    }

    function defaultErrorHandler(err){
      var message = err.responseText;
      try {message = JSON.parse(message).message}
      catch(e){}
      $("#paneError").text(message);
      $("#paneError").show();
      $("#paneSpinner").hide();
      $(".nextButton").removeClass("disabled");
      $(".prevButton").removeClass("disabled");
    }

    onActivate.checkpub = function($pane, paneConfig, state, command){
      $("#progress").hide();
    }

    onActivate.welcome = function($pane, paneConfig, state, command){
      getDataset(function(){}, defaultErrorHandler);
      if (blist.configuration.apiFoundry.makeNewView)  paneConfig.nextText = "Create an API";
      else paneConfig.nextText = "Customize this API";
    }

    onNext.welcome = function($pane, state){
      makeApiView(
        function(){
          defaultTransition();
        },
        defaultErrorHandler 
      );
      return false;
    }

    onNext.datasetResourceName = function($pane, state){
      updateView(
        {
          resourceName:$("#resourceName").val().trim()
        },
        defaultTransition,
        resourceNameConflictHandler
      );
      return false;
    }

    onNext.datasetUniqueId = function($pane, state){
      var newSetting = $("#rowIdentifierColumnId").val();
      if (newSetting.trim() === "") newSetting = null;
      else {
        _.each(blist.configuration.apiFoundry.apiView.columns, function(element, index){
          if (newSetting === element.fieldName){ newSetting = element.id;}
        });
      }
      updateView(
        {
          rowIdentifierColumnId:newSetting
        },
        defaultTransition,
        defaultErrorHandler
      );
      return false;
    }

    onActivate.datasetDescription = function($pane, paneConfig, state, command){
      $("#resourceNameDoc").text(blist.configuration.apiFoundry.apiView.resourceName);
    }

    onNext.datasetDescription = function($pane, state){
      var $prompt = $(".prompt");
      $prompt.val(null);
      updateView(
        {
          description:$("#description").val()
        },
        defaultTransition,
        defaultErrorHandler
      );
      $prompt.blur();
      return false;
    }

    //add a pane for each column
    $("#apiFoundryWizard .apiFieldPane").each(function(index, element){
      var key = $(element).attr('id');
      var columnOriginalFieldName = key.slice(4);
      onNext[key] = function($pane, state){
        var $prompt = $(".prompt");
        $prompt.val(null);
        updateColumn(
          columnOriginalFieldName,
          {
            name:$("#name").val().trim(),
            fieldName:$("#fieldName").val().trim(),
            description:$("#description").val()
          },
          defaultTransition,
          defaultErrorHandler
        );
        $prompt.blur();
        return false;
      }
    });

    onActivate.apiPublish = function($pane, paneConfig, state, command){
      $("#skip").hide()
    }

    onNext.apiPublish = function($pane, state){
      makeApiView(
        function(){
          updateView(
            {

            },
            defaultTransition,
            defaultErrorHandler
          );
        },
        defaultErrorHandler
      );
      return false;
    }

    onActivate.published = function($pane, paneConfig, state, command){
      $("#skip").hide()
      paneConfig.nextText = "View Documentation";
      blist.configuration.apiFoundry.docsUrl = '/developers/docs/'
        + blist.configuration.apiFoundry.apiView.resourceName;
      $("#docslink").attr("href", blist.configuration.apiFoundry.docsUrl);
    }

    onNext.published = function($pane, state)
    {
        $("#paneSpinner").hide();
        window.location = blist.configuration.apiFoundry.docsUrl;
        return false;
    }

    function defaultOnNext($pane, state){
      var id = $pane.attr('id');
      $(".nextButton").addClass("disabled");
      $(".prevButton").addClass("disabled");
      $("#paneSpinner").show();
      if (onNext[id]) { return onNext[id]($pane, state); }
      else { return nextPaneMap[id]; }
    }

    function defaultOnActivate($pane, paneConfig, state, command){
      currentPaneId = $pane.attr('id');
      commandObj = command;
      updateProgressIndicator(paneConfig.ordinal);
      $("#skip").show()
      $("#paneError").hide();
      $("#paneSpinner").hide();
      $(".nextButton").removeClass("disabled");
      $(".prevButton").removeClass("disabled");
      if (onActivate[currentPaneId]) { onActivate[currentPaneId]($pane, paneConfig, state, command);}
    }



    //push the panes into the panes array - order is important!

    //start with either 'welcome' or 'checkpub' to make sure the dataset is unpublished.
    if (!blist.configuration.apiFoundry.published){
      $('#welcome').remove();
      panes.push({
        key: 'checkpub',
        ordinal: ordinal++,
        disableButtons: ['next'],
        onActivate: defaultOnActivate,
        onNext: defaultOnNext
      });
    } 
    else {
      $('#checkpub').remove();
      panes.push({
        key: 'welcome',
        ordinal: ordinal++,
        onActivate: defaultOnActivate,
        onNext: defaultOnNext
      });
    }
    
    panes.push({
      uniform: true,
      key: 'datasetResourceName',
      ordinal: ordinal++,
      onActivate: defaultOnActivate,
      onNext: defaultOnNext
    });
    panes.push({
      uniform: true,
      key: 'displayUniqueId',
      ordinal: ordinal++,
      onActivate: defaultOnActivate,
      onNext: defaultOnNext
    });
    //panes.push({
    //  uniform: true,
    //  key: 'datasetUniqueId',
    //  ordinal: ordinal++,
    //  onActivate: defaultOnActivate,
    //  onNext: defaultOnNext
    //});
    panes.push({
      uniform: true,
      key: 'datasetDescription',
      ordinal: ordinal++,
      onActivate: defaultOnActivate,
      onNext: defaultOnNext
    });

    //add a pane for each column
    $("#apiFoundryWizard .apiFieldPane").each(function(index, element){
      var key = $(element).attr('id');
      panes.push({
        key:key,
        uniform: true,
        ordinal: ordinal++,
        onActivate: defaultOnActivate,
        onNext: defaultOnNext
      });
    });

    panes.push({
      key:'apiPublish',
      ordinal: ordinal++,
      isFinish: true,
      onActivate: defaultOnActivate,
      onNext: defaultOnNext
    });

    panes.push({
        key:'published',
        ordinal: ordinal++,
        disableButtons: ['cancel', 'prev'],
        onActivate: defaultOnActivate,
        onNext: defaultOnNext
    });

    var paneConfig = {};
    _.each(panes, function(pane, index){
      var key = pane.key;
      paneConfig[key] = pane;
      if (index < panes.length - 1) {nextPaneMap[key] = panes[index + 1].key}
    });
    for (var p = 0; p < panes.length; p++){
    }
    stepTotal = ordinal - 1;
    return paneConfig;
  }
  
  function getDataset(callback, errorCallback){
    if (blist.configuration.apiFoundry.ds){callback(blist.configuration.apiFoundry.ds);}
    Dataset.lookupFromViewId(
      blist.configuration.apiFoundry.id
      , function(ds){
          blist.configuration.apiFoundry.ds = ds;
          callback(ds);
      }
      , errorCallback
      , false
    );
  }

  var columns;
  function makeColumnHash(){
    columns = _.reduce(blist.configuration.apiFoundry.apiView.columns, function(memo, col){
      memo[col.fieldName] = col;
      return memo;
    }, {});
  }

  function makeApiView(callback, errorCallback){
    if (!blist.configuration.apiFoundry.makeNewView) {
      blist.configuration.apiFoundry.apiView = blist.configuration.apiFoundry.ds;
    }
    if (blist.configuration.apiFoundry.apiView){
      makeColumnHash();
      callback(blist.configuration.apiFoundry.apiView);
    }
    else
    {
        var md = $.extend(true, {}, blist.configuration.apiFoundry.ds.metadata);
        md.availableDisplayTypes = ['api'];
        blist.configuration.apiFoundry.ds.update({displayType: 'api', metadata: md});
        blist.configuration.apiFoundry.ds.saveNew(
                function(newView)
                {
                    blist.configuration.apiFoundry.apiView = newView;
                    makeColumnHash();
                    callback(newView);
                },
                errorCallback);
    }
  }

  function updateView(changes, callback, errorCallback){
    blist.configuration.apiFoundry.apiView.update(changes);
    blist.configuration.apiFoundry.apiView.save(callback, errorCallback);
  }

  function updateColumn(column, changes, callback, errorCallback){
    var col = columns[column];
    col.update(changes);
    col.save(callback, errorCallback);
  }

  // general validation. here because once a validator
  // for a form is created, you can't set a new validator.
  var validator = $('#newApiForm').validate({
      rules: {
        'resourceName': 'required'
      },
      messages: {
        'resourceName':'this is required'
      },
      errorPlacement: function (label, $el) {
          $el.closest('.line').append(label);
      }
  });
});
