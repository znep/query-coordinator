(function($) {

  $.cf.contextPicker = function(options) {
    return {
      name: 'contextId',
      required: true,
      text: $.t('dataslate.context_picker.view_data'),
      type: 'custom',
      editorCallbacks: {
        create: picker(options),
        value: pickerValue,
        validate: pickerValidate
      }
    };
  };

  var browseUrl = $('#selectDataset iframe').attr('src');
  var picker = function(options) {
    options = options || {};
    return function($field, vals, curValue) {
      $field.addClass('contextPicker autocompleteCombo');
      var $wrapper = $.tag({
        tagName: 'div',
        'class': 'wrapper'
      });
      $field.append($wrapper);

      var $catalogChooser = $.tag2({
        _: 'a',
        href: '#choose',
        className: ['catalogChooser', 'button', 'ss-database'],
        title: $.t('dataslate.context_picker.select_dataset'),
        contents: $.t('dataslate.context_picker.select_dataset')
      });
      $catalogChooser.on('click', function(e) {
        e.preventDefault();
        var $modal = $('#selectDataset');
        $modal.jqmShow();
        if (!$.isBlank(options.browseArgs)) {
          $modal.find('iframe').attr('src', browseUrl + '?_cache=' + (new Date()).getTime() +
            (options.browseArgs || ''));
        }
      });
      blist.common = blist.common || {};
      blist.common.selectedDataset = function(ds) {
        $('#selectDataset').jqmHide();
        // Just pass all the work off to textInput
        setValue($textInput, ds.id);
        $textInput.change();
      };
      $field.append($catalogChooser);

      var $hiddenInput = $.tag({
        tagName: 'input',
        type: 'hidden',
        name: $field.attr('name'),
        'class': {
          value: 'required',
          onlyIf: $field.hasClass('required')
        }
      });
      setValue($hiddenInput, curValue);
      $field.append($hiddenInput);

      var cx = $.dataContext.availableContexts[curValue] || {
        dataset: {}
      };
      var $textInput = $.tag({
        tagName: 'input',
        type: 'text',
        'class': 'textInput',
        value: $.htmlEscape((cx.dataset || {}).name || curValue)
      });
      $textInput.change(function(e) {
          if ($field.parents('body').length < 1) {
            return;
          }

          var context = $textInput.data('context');
          var v;
          if (!$.isBlank(context)) {
            v = context.id;
          } else {
            v = $textInput.value();
            if (!$.isBlank(v)) {
              var m = v.match(/^https?:\/\/.*\/(\w{4}-\w{4})(\?.*)*$/);
              if (!$.isBlank(m)) {
                v = m[1];
              }
            }
            context = {
              type: 'dataset',
              datasetId: v,
              id: v + '_' + _.uniqueId()
            };
          }

          setValue($hiddenInput, v);
          if (!$hiddenInput.valid()) {
            return;
          }

          if ($.isBlank($.dataContext.availableContexts[v])) {
            e.stopPropagation();
            $.dataContext.loadContext(v, context,
              function() {
                $textInput.change();
              },
              function() {
                if ($field.parents('body').length < 1) {
                  return;
                }

                var validator = $hiddenInput.closest('form').data('form-validator');
                var errors = {};
                errors[$hiddenInput.attr('name')] = 'This dataset is not valid';
                if ($.isBlank(validator)) {
                  alert(_.first(_.values(errors)));
                } else {
                  validator.showErrors(errors);
                }
              });
          }
        }).
        focus(function() {
          $textInput.select();
        });
      $wrapper.append($textInput);

      var $chooser = $.tag({
        tagName: 'a',
        href: '#choose',
        'class': 'dropdownChooser'
      });
      $chooser.mousedown(function() {
          if (!$textInput.is(':focus')) {
            _.defer(function() {
              $textInput.focus();
            });
          }
        }).
        click(function(e) {
          e.preventDefault();
        });
      $wrapper.append($chooser);

      var searchDelayTimer;
      var translateDS = function(dc) {
        var d = {
          context: dc.config,
          id: dc.id,
          name: dc.id
        };
        d.context.id = d.id;
        switch (dc.type) {
          case 'dataset':
            _.each(['name', 'id', 'description', 'category', 'tags'], function(key) {
              d[key] = dc.dataset[key];
            });
            break;

          case 'column':
            _.each(['name', 'renderTypeName'], function(key) {
              d[key] = dc.column[key];
            });
            break;

          case 'row':
            $.extend(d, {
              row: dc.row
            });
            break;

          case 'datasetList':
            d.count = dc.count;
            _.each(dc.datasetList, function(dsDc, i) {
              d[i + 1] = dsDc.dataset.name;
            });
            break;
          default:
            break;
        }
        if (!$.isBlank(dc.type)) {
          d.name += ' (' + dc.type.displayable() + ')';
        }
        return d;
      };
      var matchScore = function(item, baseScore) {
        if (item.isTitle) {
          baseScore = 1000;
        }
        if (!item.isServer) {
          baseScore += 10000;
        }
        return baseScore;
      };
      _.defer(function() {
        $textInput.awesomecomplete({
          alignRight: $wrapper,
          attachTo: $field.closest('.controlPane'),
          dontMatch: ['id', 'contextId'],
          forcePosition: true,
          showAll: true,
          skipBlankValues: true,
          suggestionListClass: 'contextPickerAutocomplete autocompleteComboDropdown',
          showFunction: function($list) {
            $field.closest('.panes').closest('.socrata-cf-side').andSelf().css('overflow', 'visible');

            // If we only have a 'Current Data' title, hide it
            var $lItems = $list.find('.localItem');
            if ($lItems.length < 2) {
              $lItems.hide();
            }
          },
          blurFunction: function() {
            $field.closest('.panes').closest('.socrata-cf-side').andSelf().css('overflow', '');
          },
          renderFunction: function(dataItem, topMatch, config) {
            var div = {
              tagName: 'div',
              'class': [{
                value: 'serverItem',
                onlyIf: dataItem.isServer == 'true'
              }, {
                value: 'localItem',
                onlyIf: dataItem.isServer != 'true'
              }],
              contents: []
            };
            if (dataItem.isTitle) {
              div['class'].push('titleSeparator');
              div.contents.push(dataItem.name);
            } else if ((topMatch === config.nameField) || (topMatch === null)) {
              div.contents.push({
                tagName: 'p',
                'class': 'title',
                contents: dataItem[config.nameField]
              });
            } else {
              div.contents.push({
                tagName: 'p',
                'class': 'title',
                contents: dataItem[config.nameField]
              });
              div.contents.push({
                tagName: 'p',
                'class': 'matchRow',
                contents: [{
                    tagName: 'span',
                    'class': 'matchedField',
                    contents: topMatch
                  },
                  ': ', dataItem[topMatch]
                ]
              });
            }
            return $.tag(div, true);
          },
          sortFunction: function(a, b) {
            var amtc = matchScore(a.originalDataItem, a.matchedTermCount);
            var bmtc = matchScore(b.originalDataItem, b.matchedTermCount);
            return (amtc == bmtc) ?
              (matchScore(b.originalDataItem, b.matchCount) -
                matchScore(a.originalDataItem, a.matchCount)) :
              (bmtc - amtc);
          },
          dataMethod: function(term, $f, dataCallback) {
            var d = _.map($.dataContext.availableContexts, translateDS);
            if (!_.isEmpty(d)) {
              d.unshift({
                name: 'Currently Used Data',
                isTitle: true,
                term: term
              });
            }
            dataCallback(d);

            clearTimeout(searchDelayTimer);
            if (!$.isBlank(term)) {
              searchDelayTimer = setTimeout(function() {
                Dataset.search({
                  name: term,
                  limit: 10
                }, function(results) {
                  var dataViews = [];
                  var curData = _.map(_.values($.dataContext.availableContexts),
                    translateDS);
                  if (!_.isEmpty(curData)) {
                    dataViews.push({
                      name: 'Currently Used Data',
                      isTitle: true,
                      term: term
                    });
                    dataViews = dataViews.concat(curData);
                  }
                  var curViews = {};
                  _.each($.dataContext.availableContexts, function(ac) {
                    if (!$.isBlank(ac.dataset)) {
                      curViews[ac.dataset.id] = ac.dataset;
                    }
                  });
                  var newData = _.map(_.reject(results.views, function(v) {
                      return !$.isBlank(curViews[v.id]);
                    }),
                    function(v) {
                      return $.extend({
                          isServer: true
                        },
                        translateDS({
                          type: 'dataset',
                          dataset: v,
                          id: v.id + '_' + _.uniqueId(),
                          config: {
                            type: 'dataset',
                            datasetId: v.id
                          }
                        }));
                    });
                  if (!_.isEmpty(newData)) {
                    if (!_.isEmpty(dataViews)) {
                      dataViews.push({
                        name: 'Unused Data',
                        isTitle: true,
                        isServer: true,
                        term: term
                      });
                    }
                    dataViews = dataViews.concat(newData);
                  }
                  dataCallback(dataViews);
                });
              }, 500);
            }
          },
          onComplete: function(data) {
            $textInput.data('context', data.context).change();
          },
          valueFunction: function(dataItem) {
            return dataItem.id || null;
          }
        });
      });

      return true;
    };
  };

  var pickerValue = function($field) {
    var $editor = $field.find('input[type=hidden]');
    if ($editor.length < 1) {
      return null;
    }

    return getValue($editor);
  };

  var pickerValidate = function($field) {
    var $editor = $field.find('input[type=hidden]');
    if ($editor.length < 1) {
      return false;
    }

    return $editor.valid() && !$.isBlank($.dataContext.availableContexts[getValue($editor)]);
  };

  var getValue = function($input) {
    var v = $input.value();
    if ((v || '').indexOf('||') > -1) {
      v = v.split('||');
    }
    return v;
  };

  var setValue = function($input, v) {
    if (_.isArray(v)) {
      v = v.join('||');
    }
    $input.value(v);
  };

})(jQuery);

