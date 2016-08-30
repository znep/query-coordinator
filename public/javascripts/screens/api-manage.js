$(function() {

	//the blist.dataset is actually the API view - calling it a dataset for compatibility
	var view = blist.dataset;
	var init = {};
	var ns = {};

	init.permission = function()
  {
		$("#permission-host").pane_datasetPermissions({
			view: blist.dataset,
      showFinishButtons: false
		}).render();
	};

	init.sharing = function()
  {
		$("#sharing-host").pane_shareDataset({
      view: blist.dataset,
      showFinishButtons: false
		}).render();
	};

	init.applications = function()
  {
    $(".hunum").each(function(elem){
      $(this).text(blistUtilNS.toHumaneNumber($(this).text()));
    });

    $("#limitUpdate").click(function(){
      $(".hunum").each(function(elem){
        $(this).value(blistUtilNS.parseHumaneNumber($(this).value()));
      });
    });

		$(".limitRemoveButton").click(function(event) {
			var appToken = $(this).attr("id");
			$.socrataServer.makeRequest({
				url: 'rmThrottle?app_token=' + appToken,
				type: 'delete',
				success: function() {
					$(".appFlash").text("");
					window.location.href = '../apps';
				},
				error: function() {
					$(".appFlash").text("There was an error with this request").addClass("error");
				}
			});
		});
	};

	init.names = function()
  {
		$(".disabled").attr("disabled", "disabled");
		function updateColumn(columnFieldName, changes, callback, errorCallback) {
			var col = _.find(blist.dataset.columns, function(col) {
				return col.fieldName === columnFieldName;
			});
			col.update(changes);
			col.save(callback, errorCallback);
		}

		function bindLiveDocs()
    {
			$('.liveDoc').each(function(index, element) {
				var $element = $(element);
				var key = 'span#' + $element.attr('id') + 'Doc';
				var update = function(eventObj) {
					$(key).html(($(eventObj.target).value() || '').replace(/\n/g, "<br/>"));
				};
				$element.change(update);
				$element.keyup(update);
			});
		}

		bindLiveDocs();
		$("#updateField").click(function() {
			var columnOriginalFieldName = $(".fieldName").value();
			var $prompt = $(".prompt");
			$prompt.val(null);
			updateColumn(
			columnOriginalFieldName, {
				name: $("#" + columnOriginalFieldName + "Name").val().trim(),
				description: $("#" + columnOriginalFieldName  + "Description").val()
			},
			function() {
				$(".flash").text("The field has been updated.").addClass("notice").removeClass("error");
			},
			function() {
				$(".flash").text("An error occured. Your changes were not saved").addClass("error").removeClass("notice");
			});
			$prompt.blur();
		});
    $("#updateTitle").click(function(event){
      blist.dataset.update({name:$("#editTitle").val().trim()});
      blist.dataset.save(
        function() {
          $(".flash").text("The field has been updated.").addClass("notice").removeClass("error");
        },
        function() {
          $(".flash").text("An error occured. Your changes were not saved").addClass("error").removeClass("notice");
        }
      );
    });
	};

	init.transfer = function()
  {
		$("#transfer-host").pane_plagiarism({
			view: blist.dataset
		}).render();
	};

	init['delete'] = function()
  {
		$("#delete-host").pane_deleteDataset({
			view: blist.dataset
		}).render();
	};

  var morsel = $("#morselmenu");
  morsel.children('LI').mouseenter(function()
  {
    var list = $(this).children('UL');
    if ($.browser.msie)
    {
      var pos = list.parent().position();
      list.css('left', parseInt(pos['left']));
    }
    list.show();
  });

  morsel.children('LI').mouseleave(function()
  {
    var list = $(this).children('UL');
    list.hide();
  });

	$(".managesection").each(function(index) {
		var initFn = init[$(this).attr("id")];
		if (initFn) initFn();
	});
  $(".controlPane").bind("hide", function(event){
    window.location.href = "/api_foundry/manage/" + blist.dataset.id;
  });
	//_.each(init, function(initFn){ initFn(); });
});

