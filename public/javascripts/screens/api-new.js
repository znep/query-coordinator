$(function(){

  var $wizard = $('#apiFoundryWizard');
  var options = {
      onCancel: function($pane, state)
      {
          window.location.href = '/api_foundry';
          return false;
      },
      finishText: "Publish",
      paneConfig:makePaneConfig()
  }
  var $paneList = $('#apiFoundryWizard ul');
  $paneList.hide();
  $wizard.wizard(options);
  $paneList.show();

  function makePaneConfig() {

    function defaultOnNext($pane, state){
      var id = $pane.attr('id');
      state[id] = $('#newApiForm').serializeArray();
      return nextPaneMap[id];
    }

    var nextPaneMap = {};
    var panes = [{
      uniform: true,
      key: 'apiSettings',
      onNext: defaultOnNext
    }];

    //add a pane for each column
    $("#apiFoundryWizard .apiFieldPane").each(function(index, element){
      var key = $(element).attr('id');
      panes.push({
        key:key,
        onNext: defaultOnNext
      });
    });
    
    panes.push({
      key:'apiPublish',
      isFinish: true,
      onActivate: function($pane, paneConfig, state, command){
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
    for (var p = 0; p < panes.length; p++){
      var key = panes[p].key;
      paneConfig[key] = panes[p];
      if (p < panes.length - 1) {nextPaneMap[key] = panes[p + 1].key}
    }
    return paneConfig;
  }

  function updateDatasetState(state, callback){
    Dataset.lookupFromViewId(
      blist.configuration.apiFoundry.id
      , function(ds){
        var _validKeys = {
          'description':true,
          'resourceName':true,
          'rowIdentifierColumnId':true,
        }
        var changes = {};
        for (i in state.apiSettings){ 
          var key = state.apiSettings[i].name;
          if (_validKeys[key]) { changes[key] = state.apiSettings[i].value;}
        }
        for (i = 0; i < ds.columns.length; i++) {
          var col = ds.columns[i];
          var colChanges = {};
          var formArray = state["col-" + col.id];
          for (j in formArray) {
            colChanges[formArray[j].name] = formArray[j].value;
          }
          col.update(colChanges);
          col.save();
        }
        ds.update(changes);
        blist.configuration.apiFoundry.docsUrl = '/developers/docs/' + ds.resourceName;
        if (ds.temporary){
          ds.save(callback); //need to add error handling
        } else {callback();}
      }
      , function(){
        callback();
      }
      , false)
  }


    // general validation. here because once a validator
    // for a form is created, you can't set a new validator.
    var validator = $('#newApiForm').validate({
        rules: {
        },
        messages: {
        },
        errorPlacement: function (label, $el) {
            $el.closest('.line').append(label);
        }
    });
});
