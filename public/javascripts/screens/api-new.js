$(function(){

  //INIT the wizard.
  bindLiveDocs();
  var $wizard = $('#apiFoundryWizard');
  var apiView;
  var stepTotal;
  var options = {
      onCancel: function($pane, state)
      {
          window.location.href = '/resource/' + blist.configuration.apiFoundry.id + '.html';
          return false;
      },
      finishText: "Deploy",
      paneConfig:makePaneConfig(),
      buttonContainerId: "aboveslide"
  }
  var $paneList = $('#apiFoundryWizard ul');
  $("#stepTotal").text(stepTotal);
  $("#progressbar").progressbar({value:0});
  $('#rowIdentifierColumnId option').each(function(index, element)
  {
    if ($(element).text() === blist.configuration.apiFoundry.defaultUniqueId){
      $(element).attr('selected', 'selected');
    }
  });
  $paneList.hide();
  $wizard.wizard(options);
  $paneList.show();

  function bindLiveDocs()
  {
    $('.liveDoc').each(function(index, element)
    {
      var $element = $(element);
      var key = 'span#' + $element.attr('id') + 'Doc';
      var update = function(eventObj)
      {
        $(key).html(($(eventObj.target).value() || '').replace(/\n/g, "<br/>"));
      };
      $element.change(update);
      $element.keyup(update);
    });
  }

  function conflictHandler(message)
  {
    var $error = $(".validationError");
    $error.show();
    $error.text(message);
    $("#paneSpinner").hide();
    $(".nextButton").removeClass("disabled");
    $(".prevButton").removeClass("disabled");
  }

  function updateProgressIndicator(ordinal)
  {
    var progress = ordinal / stepTotal * 100;
    $("#step").text(ordinal);
    $("#progressbar").progressbar("value", progress);
  }

  function makePaneConfig()
  {
    var nextPaneMap = {};
    var panes = [];
    var ordinal = 1; //ordinal indicates the position in the progress meter
    var commandObj; //used by the skip-to-end button
    var onTransition = {};
    var onActivate = {};
    var currentPaneId;

    $("#skip").click(function(eventObj){
      if (onTransition[currentPaneId])
      {
        onTransition[currentPaneId](
          $("#" + currentPaneId),
          {},
          function(){commandObj.next('apiPublish');}
        );
      }
      else
      {
        commandObj.next('apiPublish');
      }
    });

    function defaultErrorHandler(err)
    {
      var message = err.responseText;
      try {message = JSON.parse(message).message}
      catch(e){}
      $("#paneError").text(message);
      $("#paneError").show();
      $("#paneSpinner").hide();
      $(".nextButton").removeClass("disabled");
      $(".prevButton").removeClass("disabled");
    }

    onActivate.checkpub = function($pane, paneConfig, state, command)
    {
      $("#progress").hide();
    }

    onActivate.welcome = function($pane, paneConfig, state, command)
    {
      $("#skip").hide()
      getDataset(function(){}, defaultErrorHandler);
      if (blist.configuration.apiFoundry.makeNewView)  paneConfig.nextText = "Create an API";
      else paneConfig.nextText = "Customize this API";
    }

    onTransition.welcome = function($pane, state, callback)
    {
      getApiView(
        callback,
        defaultErrorHandler
      );
      return false;
    }

    onActivate.datasetResourceName = function($pane, paneConfig, state, command)
    {
      $("#skip").hide();
      var rn = apiView.resourceName;
      if (rn) {$('#resourceName').val(rn).blur();}
    }

    onTransition.datasetResourceName = function($pane, state, callback)
    {
      updateView(
        {
          resourceName:$("#resourceName").val().trim()
        },
        callback,
        function(err)
        {
          conflictHandler(JSON.parse(err.responseText).message);
        }
      );
      return false;
    }

    onActivate.datasetName = function($pane, paneConfig, state, command)
    {
      var n = apiView.name;
      if (n) {$('#editTitle').val(n).blur();}
    }

    onTransition.datasetName = function($pane, state, callback)
    {
      updateView(
        {
          name:$("#editTitle").val().trim()
        },
        function()
        {
          $("#toptitle").text(apiView.name);
          callback();
        },
        function(err){
          conflictHandler(JSON.parse(err.responseText).message);
        }
      );
      return false;
    }

    onTransition.datasetUniqueId = function($pane, state, callback)
    {
      var newSetting = $("#rowIdentifierColumnId").val();
      if (newSetting.trim() === "") newSetting = null;
      else {
        _.each(apiView.columns, function(element, index)
        {
          if (newSetting === element.fieldName){ newSetting = element.id;}
        });
      }
      updateView(
        {
          rowIdentifierColumnId:newSetting
        },
        callback,
        defaultErrorHandler
      );
      return false;
    }

    onActivate.datasetDescription = function($pane, paneConfig, state, command)
    {
      $("#resourceNameDoc").text(apiView.resourceName);
      $("#nameDoc").text(apiView.name);
      var desc = apiView.description;
      if (desc) {
        $('#description').val(desc).blur();
        $("#descriptionDoc").text(desc);
      }
    }

    onTransition.datasetDescription = function($pane, state, callback)
    {
      var $prompt = $(".prompt");
      $prompt.val(null);
      var desc = $("#description").val();
      $prompt.blur();
      updateView(
        {description:desc},
        callback,
        defaultErrorHandler
      );
      return false;
    }

    //add a pane for each column
    $("#apiFoundryWizard .apiFieldPane").each(function(index, element)
    {
      var key = $(element).attr('id');
      var columnOriginalFieldName = key.slice(4);
      var prefix = "#" + columnOriginalFieldName;
      onActivate[key] = function($pane, paneConfig, state, command)
      {
        var $n  = $(prefix + "Name")       ,
            $ndoc  = $(prefix + "NameDoc")       ,
            $fn = $(prefix + "FieldName")  ,
            $fndoc = $(prefix + "FieldNameDoc")  ,
            $d  = $(prefix + "Description"),
            $ddoc  = $(prefix + "DescriptionDoc"),
            $i  = $(prefix + "Include");

        var col = columns[columnOriginalFieldName];

        $n.val(col.name).blur();
        $ndoc.text(col.name);
        $fn.val(col.fieldName).blur();
        $fndoc.text(col.fieldName);
        $i.value(!col.hidden);
        $.uniform.update($i);
        $d.val(col.description).blur();
        if(col.description) { $d.removeClass("prompt");}
        $ddoc.text(col.description);

        var disableIfNecessary = function()
        {
          if ($i.value()) {
            $pane.find(".mustNotBeHidden").removeAttr("disabled");
          } else {
            $pane.find(".mustNotBeHidden").attr("disabled", "disabled");
          }
        }
        disableIfNecessary();
        $i.click(disableIfNecessary);
      }
      onTransition[key] = function($pane, state, callback)
      {
        var col = columns[columnOriginalFieldName];
        var $n  = $(prefix + "Name")       ,
            $fn = $(prefix + "FieldName")  ,
            $d  = $(prefix + "Description"),
            $i  = $(prefix + "Include");
        var $prompt = $(".prompt");
        $prompt.val(null);
        var changes = {
          name:$n.val().trim(),
          fieldName:$fn.val().trim(),
          description:$d.val()
        }
        $prompt.blur();
        var doUpdate = function()
        {
          updateColumn(
            columnOriginalFieldName,
            changes,
            callback,
            defaultErrorHandler
          );
        }
        if ($i.value())
        {
          if (col.hidden)
          {
            col.show(doUpdate, defaultErrorHandler);
          }
          else { doUpdate(); }
        }
        else
        {
          if (col.hidden)
          {
            callback()
          }
          else { col.hide(callback, defaultErrorHandler); }
        }
        return false;
      }
    });

    onActivate.apiPublish = function($pane, paneConfig, state, command)
    {
      $("#skip").hide()
    }

    function apiPublishOnNext($pane, state)
    {
      var id = $pane.attr('id');
      startTransitionUI();
      getApiView(
        function()
        {
          var md = $.extend(true, {}, blist.configuration.apiFoundry.ds.metadata);
          md.availableDisplayTypes = ['api'];
          md.rowIdentifier = apiView.metadata.rowIdentifier;
          updateView(
            {
              displayType: 'api',
              metadata: md
            },
            function()
            {
              apiView.makePublic(
                function()
                {
                  commandObj.next(nextPaneMap[currentPaneId]);
                },
                defaultErrorHandler);
            },
            defaultErrorHandler
          );
        },
        defaultErrorHandler
      );
      return false;
    }

    onActivate.published = function($pane, paneConfig, state, command)
    {
      $("#skip").hide()
      paneConfig.nextText = "View Documentation";
      blist.configuration.apiFoundry.docsUrl = '/developers/docs/'
        + apiView.resourceName;
      $("#docslink").attr("href", blist.configuration.apiFoundry.docsUrl);
      $(".nextButton").attr("href", blist.configuration.apiFoundry.docsUrl);
    }

    onTransition.published = function($pane, state, callback)
    {
        $("#paneSpinner").hide();
        window.location = blist.configuration.apiFoundry.docsUrl;
        return false;
    }

    function startTransitionUI()
    {
      $(".nextButton").addClass("disabled");
      $(".prevButton").addClass("disabled");
      $("#paneSpinner").show();
    }

    function doWorkBeforeTransition($pane, state, forward){
      startTransitionUI();
      var transitionFn = onTransition[currentPaneId];
      if (transitionFn)
      {
        var nextPaneOrFalse = transitionFn(
          $pane,
          state,
          function()
          {
            if (forward){ commandObj.next(nextPaneMap[currentPaneId]);}
            else {commandObj.prev();}
          }
        );
        return nextPaneOrFalse;
      }
      else { return (forward ?  nextPaneMap[id] : 1); }
    }

    function defaultOnNext($pane, state)
    {
      return doWorkBeforeTransition($pane, state, true);
    }

    function defaultOnPrev($pane, state)
    {
      return doWorkBeforeTransition($pane, state, false);
    }

    function defaultOnActivate($pane, paneConfig, state, command)
    {
      currentPaneId = $pane.attr('id');
      commandObj = command;
      updateProgressIndicator(paneConfig.ordinal);
      $("#skip").show()
      $("#paneError").hide();
      $("#paneSpinner").hide();
      $(".validationError").hide();
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
        onPrev: defaultOnPrev,
        onNext: defaultOnNext
      });
    }
    else {
      $('#checkpub').remove();
      panes.push({
        key: 'welcome',
        ordinal: ordinal++,
        onActivate: defaultOnActivate,
        onPrev: defaultOnPrev,
        onNext: defaultOnNext
      });
    }

    panes.push({
      uniform: true,
      key: 'datasetResourceName',
      ordinal: ordinal++,
      onActivate: defaultOnActivate,
      onPrev: defaultOnPrev,
      onNext: defaultOnNext,
    });
    panes.push({
      uniform: true,
      key: 'datasetName',
      ordinal: ordinal++,
      onActivate: defaultOnActivate,
      onPrev: defaultOnPrev,
      onNext: defaultOnNext
    });
    //panes.push({
    //  uniform: true,
    //  key: 'displayUniqueId',
    //  ordinal: ordinal++,
    //  onActivate: defaultOnActivate,
    //  onPrev: defaultOnPrev,
    //  onNext: defaultOnNext
    //});
    //panes.push({
    //  uniform: true,
    //  key: 'datasetUniqueId',
    //  ordinal: ordinal++,
    //  onActivate: defaultOnActivate,
    //  onPrev: defaultOnPrev,
    //  onNext: defaultOnNext
    //});
    panes.push({
      uniform: true,
      key: 'datasetDescription',
      ordinal: ordinal++,
      onActivate: defaultOnActivate,
      onPrev: defaultOnPrev,
      onNext: defaultOnNext
    });

    //add a pane for each column
    $("#apiFoundryWizard .apiFieldPane").each(function(index, element)
    {
      var key = $(element).attr('id');
      panes.push({
        key:key,
        uniform: true,
        ordinal: ordinal++,
        onActivate: defaultOnActivate,
        onPrev: defaultOnPrev,
        onNext: defaultOnNext
      });
    });

    panes.push({
      key:'apiPublish',
      ordinal: ordinal++,
      isFinish: true,
      onActivate: defaultOnActivate,
      onPrev: defaultOnPrev,
      onNext: apiPublishOnNext
    });

    panes.push({
        key:'published',
        ordinal: ordinal++,
        disableButtons: ['cancel', 'prev'],
        onActivate: defaultOnActivate,
        onPrev: defaultOnPrev,
        onNext: defaultOnNext
    });

    var paneConfig = {};
    _.each(panes, function(pane, index)
    {
      var key = pane.key;
      paneConfig[key] = pane;
      if (index < panes.length - 1) {nextPaneMap[key] = panes[index + 1].key}
    });
    for (var p = 0; p < panes.length; p++){
    }
    stepTotal = ordinal - 1;
    return paneConfig;
  }

  function getDataset(callback, errorCallback)
  {
    if (blist.configuration.apiFoundry.ds){callback(blist.configuration.apiFoundry.ds);}
    Dataset.lookupFromViewId(
      blist.configuration.apiFoundry.id,
      function(ds)
      {
          blist.configuration.apiFoundry.ds = ds;
          callback(ds);
      },
      errorCallback,
      false
    );
  }

  var columns;
  function makeColumnHash()
  {
    columns = _.reduce(apiView.columns, function(memo, col)
    {
      memo[col.fieldName] = col;
      return memo;
    }, {});
  }

  function getApiView(callback, errorCallback)
  {
    if (!blist.configuration.apiFoundry.makeNewView) {
      apiView = blist.configuration.apiFoundry.ds;
      blist.configuration.apiFoundry.apiView = apiView;
    }
    if (apiView){
      makeColumnHash();
      callback(apiView);
    }
    else
    {
        //blist.configuration.apiFoundry.ds.update({displayType: 'api-predeploy'});
        blist.configuration.apiFoundry.ds.getPredeployApiView(
          function(newView)
          {
              apiView = newView;
              blist.configuration.apiFoundry.apiView = apiView;
              makeColumnHash();
              callback(newView);
          },
          errorCallback
        );
    }
  }

  function updateView(changes, callback, errorCallback)
  {
    if (_.any(changes, function(value, key){return apiView[key] !== value;}))
    {
      var original = apiView.cleanCopy();
      apiView.update(changes);
      apiView.save(callback, function(err){
        apiView.update(original);
        errorCallback(err);
      });
    }
    else
    {
      callback();
    }
  }

  function updateColumn(column, changes, callback, errorCallback)
  {
    var col = columns[column];
    var original = col.cleanCopy();

    var needToSave = false;
    _.each(changes, function(newValue, key){
      if (col[key] !== newValue) { needToSave = true; }
    });
    if (needToSave)
    {
      col.update(changes);
      col.save(
        callback,
        function(err)
        {
          col.update(original);
          errorCallback(err);
        }
      );
    }
    else
    {
      callback();
    }
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
      errorPlacement: function (label, $el)
      {
          $el.closest('.line').append(label);
      }
  });
});
