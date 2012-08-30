$(function(){

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
      finishText: "Apply Changes",
      paneConfig:makePaneConfig()
  }
  var $paneList = $('#apiFoundryWizard ul');
  $("#stepTotal").text(stepTotal);
  $("#progressbar").progressbar({value:0});
  $paneList.hide();
  $wizard.wizard(options);
  $paneList.show();

  function bindLiveDocs(){
    $('.liveDoc').each(function(index, element){
      var $element = $(element);
      var key = 'span#' + $element.attr('id') + 'Doc';
      var update = function(eventObj){
        $(key).text($(eventObj.target).value());
      };
      $element.change(update);
      $element.keyup(update);
    });
    $('p.liveDocLink').each(function(index, element){
      $elm = $(element);
      var url = $elm.text()
      //$elm.click(function(eventObj){
      //  var win = window.open(url, 'Try this request', 'width=300, height=400');
      //});
    });

  }

  function bindNameCheck(){
    $('#resourceName').change(checkResourceName);
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
        else {
          $(".availableError").show();
        }
        callback(name, available);
      }
    });
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

    function defaultOnNext($pane, state){
      var id = $pane.attr('id');
      //TODO try this method for clearing the prompt:
      var $prompt = $(".prompt");
      $prompt.val(null);
      state[id] = $('#newApiForm').serializeArray();
      $prompt.blur();
      return nextPaneMap[id];
    }

    var commandObj; //used by the skip-to-end button
    function defaultOnActivate($pane, paneConfig, state, command){
      updateProgressIndicator(paneConfig.ordinal);
      if (commandObj) { commandObj = command; }
      else { 
        commandObj = command;
        $("#skip").click(function(eventObj){ command.next('apiPublish'); });
      }
    }

    //push the panes into the panes array - order is important!

    //start with either 'welcome' or 'checkpub' to make sure the dataset is unpublished.
    if (blist.configuration.apiFoundry.published){
      $('#welcome').remove();
      $('#copybutton').click(function(){
        getDataset(function(ds){
          ds.makeUnpublishedCopy(
            function(unpub){
              window.location = "/api_foundry/forge/" + unpub.id;
            },
            function(pendingCopy){
              window.location = "/api_foundry/forge/" + pendingCopy.id;
            },
            function(err){
              console.log(err);
            }
          );
        });
      });
      panes.push({
        key: 'checkpub',
        ordinal: ordinal++,
        disableButtons: ['next'],
        onActivate: function(){
          $("#progress").hide()
        },
        onNext: defaultOnNext
      });
    } else {
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
      onNext: function($pane, state){
        checkResourceName(function(name, available){
          if (available){commandObj.next(defaultOnNext($pane, state));}
        });
        return false;
      }
    });
    panes.push({
      uniform: true,
      key: 'datasetUniqueId',
      ordinal: ordinal++,
      onActivate: defaultOnActivate,
      onNext: defaultOnNext
    });
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
      onActivate: function($pane, paneConfig, state, command){
        updateProgressIndicator(paneConfig.ordinal);
        paneConfig.onNext = function($pane, state){
            $(".nextButton").addClass("disabled");
            updateDatasetState(state, function(){
                command.next("published");
            });
            return false;
        }
      }
    });

    panes.push({
        key:'published',
        disableButtons: ['cancel', 'prev'],
        onActivate: function($pane, paneConfig, state, command){
          $("#progress").hide()
          paneConfig.nextText = "View Documentation";
          $("#docslink").attr("href", blist.configuration.apiFoundry.docsUrl);
        },
        onNext: function($pane, state)
        {
            window.location = blist.configuration.apiFoundry.docsUrl;
            return false;
        }
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
    Dataset.lookupFromViewId(
      blist.configuration.apiFoundry.id
      , function(ds){
          blist.configuration.apiFoundry.ds = ds;
          callback(ds);
      }
      , function(error){}
      , false);
  }

  function updateDatasetState(state, callback, errorCallback){
    getDataset(
      function(ds){
        var _validKeys = {
          'description':true,
          'resourceName':true,
          'rowIdentifierColumnId':true,
        }
        var columns = _.reduce(ds.columns, function(memo, col){
          memo[col.fieldName] = col;
          return memo;
        }, {});
        var changes = {};
        _.each(state, function(value, key){
          //collect settings for the dataset
          if (key.indexOf('dataset') === 0){
            _.each(value, function(value, key){
              if (_validKeys[value.name]) { 
                if (value.value.trim() === '') changes[value.name] = null;
                else changes[value.name] = value.value;
              }
            });
          }
          //update settings for the columns
          if (key.indexOf('col-') === 0){
            var columnOriginalFieldName = key.slice(4);
            var colChanges = _.reduce(value, function(memo, value){
              memo[value.name] = value.value;
              return memo;
            }, {});
            var col = columns[columnOriginalFieldName];
            col.update(colChanges);
            col.save();
          }
        });
        ds.update(changes);
        blist.configuration.apiFoundry.docsUrl = '/developers/docs/' + ds.resourceName;
        ds.save(callback, function(err){
          console.log(err)
        }); //need to add error handling
      }      
    ),
    function(){
      errorCallback();
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
        errorPlacement: function (label, $el) {
            $el.closest('.line').append(label);
        }
    });
});
