(function($) {

  var typeOrder = ['column', 'stackedcolumn', 'bar', 'stackedbar', 'pie', 'donut', 'line', 'area', 'timeline', 'bubble', 'treemap'];
  var classicChartRequested = false;

  $.Control.extend('pane_chart_create', {
      _init: function() {
        var cpObj = this;
        cpObj._super.apply(cpObj, arguments);
        cpObj._view.bind('clear_temporary', function() {
          cpObj.reset();
        }, cpObj);

        cpObj.$dom().delegate('.showConditionalFormatting', 'click', function(e) {
          e.preventDefault();
          if ($.subKeyDefined(blist, 'datasetPage.sidebar')) {
            blist.datasetPage.sidebar.show('filter.conditionalFormatting');
          }
        });

        cpObj.$dom().delegate('.clearConditionalFormatting', 'click', function(e) {
          e.preventDefault();
          var metadata = $.extend(true, {}, cpObj._view.metadata);
          delete metadata.conditionalFormatting;
          cpObj._view.update({
            metadata: metadata
          });
        });
      },

      render: function() {
        var cpObj = this;
        cpObj._super(null, null, function(completeRerender) {
          if (completeRerender) {
            //setup DOM
            cpObj.$dom().find('.chartTypeSelection .radioLine').each(function(index, node) {
              $(node).addClass(typeOrder[index]);
            });

            //Push custom icons into sidebar dom
            cpObj.$dom().find('.chartTypeSelection .formHeader').
              append($.tag({
                tagName: 'div',
                'class': ['currentSelection'],
                contents: [{
                  tagName: 'span',
                  'class': ['selectionName']
                }, {
                  tagName: 'span',
                  'class': ['selectionIcon']
                }]
              }));

            //Insert icon elements where needed
            cpObj.$dom().find('.line.hasIcon').
              after($.tag({
                tagName: 'div',
                'class': ['lineIcon']
              }));

            cpObj._renderVisualizationCanvasButton();

            //Repeater add buttons change icon of section
            cpObj.$dom().find('.hasIcon.repeater .addValue').
              hover(
                function() {
                  $(this).parent().siblings().filter('.lineIcon').addClass('hover');
                },
                function() {
                  $(this).parent().siblings().filter('.lineIcon').removeClass('hover');
                }
              );

            if (!cpObj._view.metadata.conditionalFormatting) {
              cpObj.$dom().find('.conditionalFormattingWarning').hide();
            }
            //hide *Required text, people get it
            cpObj.$dom().find('.mainError+.required').hide();



            //setup eventing

            //Add flyout to unavailable chart types telling which columns are required
            cpObj.$dom().find('.unavailable').each(function() {
              var $t = $(this);
              var tip = $.htmlUnescape($t.find('label input').attr('title'));
              $t.socrataTip({
                content: tip
              });
            });

            //takes in classname <'radioLine' ('unavailable')? type>
            var setHeader = function(type) {
              var current = type.split(' ')[1];
              if (current != 'unavailable') {
                cpObj.$dom().find('.formSection.chartTypeSelection, .paneContent').
                  removeClass(function(i, oldClasses) {
                    var matches = oldClasses.match(/\S*-selected/);
                    return ($.isBlank(matches) ? '' : matches.join(' '));
                  }).
                  addClass(type + '-selected').
                  //Set the text to current icon type
                  find('.currentSelection .selectionName').
                  text(Dataset.chart.types[current].text);
              }
            };

            if (blist.dataset.displayFormat.chartType) {
              setHeader('radioLine ' + blist.dataset.displayFormat.chartType);
            }

            //Bind section classing to chart-type selection
            cpObj.$dom().find('.chartTypeSelection .radioLine').click(function(e) {
              setHeader($(e.currentTarget).attr('class'));
            });

            //Clicking minus button repeater triggers rerender
            cpObj.$dom().find('.repeater').
              delegate('.removeLink', 'click', function(e) {
                cpObj._changeHandler($(e.currentTarget));
              });

            //Section hiding animations
            cpObj.$dom().find('.formSection.selectable .sectionSelect').click(function(e) {
              var $sect = $(e.currentTarget).closest('.formSection');

              //shown/hidden by base-pane eventing so needs to be shown and then reset to for animation to run
              if ($sect.hasClass('collapsed')) {
                $sect.find('.sectionContent').show().slideUp({
                  duration: 100,
                  easing: 'linear'
                });
              } else {
                $sect.find('.sectionContent').hide().slideDown({
                  duration: 100,
                  easing: 'linear'
                });
              }
            });

          }
        });
      },

      //Append area can be before, after ...
      _getSections: function() {
        var cpObj = this;

        var options = {
          view: cpObj._view,
          isEdit: isEdit(cpObj) && !cpObj._view.isGrouped(),
          useOnlyIf: true
        };

        var result = blist.configs.chart.configChartSelector(options);

        var type = cpObj._view.displayFormat.chartType;
        if (type) {
          result = result.concat(blist.configs.chart.newConfigForType(type, {
            view: cpObj._view,
            isEdit: isEdit(cpObj) && !cpObj._view.isGrouped(),
            useOnlyIf: true
          }));
        }

        return result;
      },

      getTitle: function() {
        return $.t('screens.ds.grid_sidebar.chart.title');
      },

      _getCurrentData: function() {
        return this._super() || this._view;
      },

      isAvailable: function() {
        return (this._view.valid || isEdit(this)) &&
          (_.include(this._view.metadata.availableDisplayTypes, 'chart') ||
            this._view.shouldShowViewCreationOptions());
      },

      getDisabledSubtitle: function() {
        return !this._view.valid && !isEdit(this) ?
          $.t('screens.ds.grid_sidebar.base.validation.invalid_view') : $.t('screens.ds.grid_sidebar.chart.validation.viz_limit');
      },

      validateForm: function() {
        var valid = this._super();
        this._updateErrorVisibility();
        return valid;
      },

      _renderVisualizationCanvasButton: function() {
        var enableVisualizationCanvas = blist.feature_flags.enable_visualization_canvas;

        if (!enableVisualizationCanvas) {
          return;
        }

        var cpObj = this;

        blist.dataset.getNewBackendMetadata().
          pipe(function(nbeMetadata) {
            var localePrefix = blist.locale === blist.defaultLocale ? '' : '/' + blist.locale;
            const bootstrapUrl = localePrefix + '/d/{0}/visualization'.format(nbeMetadata.id);

            const url = _.isObject(blist.currentUser) ?
              bootstrapUrl :
              localePrefix + '/login?return_to=' + encodeURIComponent(bootstrapUrl);

            var label = cpObj.$dom().find('.chartTypeSelection > label.formHeader');

            var newVizButton = $.tag({
              tagName: 'a',
              href: url,
              'class': 'visualization-canvas-button',
              contents: $.t('screens.ds.grid_sidebar.visualization_canvas.button')
            });

            label.before(
              $('<div>').
                addClass('visualization-canvas-bootstrap').
                append(newVizButton)
            );

            // NOTE: The whole sidebar section gets re-rendered for pointless
            // reasons, so we use a control variable held in outermost scope to
            // ensure that we only show this link once.
            if (classicChartRequested) {
              return;
            }

            newVizButton.after(
              $.tag({
                tagName: 'a',
                href: '#continue-to-classic',
                'class': 'visualization-canvas-ignore-link',
                contents: $.t('screens.ds.grid_sidebar.visualization_canvas.link_to_classic')
              }).click(function() {
                var link = $(this);
                link.closest('.formSection').find('.hide').removeClass('hide').css({display: ''});
                link.remove();
                classicChartRequested = true;
                return false;
              })
            );

            // Have to add redundant `display: none` because Grid View Refresh 2017 uses
            // `!important` liberally and there's no reasonable way to undo that damage.
            label.nextAll().andSelf().addClass('hide').attr({style: 'display: none !important'});
          }).
          fail(_.noop);
      },

      _updateErrorVisibility: function(valCols) {
        //If creating from a dataset don't spit warning messages immediately.
        valCols = valCols || this._view.displayFormat.valueColumns;
        var hideInlineErrors = _.isEmpty(valCols) || _.some(valCols, _.isEmpty);
        this.$dom().toggleClass('inlineErrorsHidden', hideInlineErrors || false);
      },

      _changeHandler: function($input) {
        var cpObj = this;
        _.defer(function() {
          var initSidebarScroll = cpObj.$dom().closest('.panes').scrollTop();
          var originalChartType = $.subKeyDefined(cpObj._view, 'displayFormat.chartType') ? cpObj._view.displayFormat.chartType : undefined;
          var isBrandNewChart = _.isEmpty(originalChartType);
          var newValues = cpObj._getFormValues();

          ///VALIDATE///

          if ($input.data('origname') == 'displayFormat.chartType') {
            var newChartType = newValues.displayFormat.chartType;
            var isSameChart = !isBrandNewChart && originalChartType == newChartType;
            if (cpObj.validateForm() || !isSameChart) {
              // Need to run the config through chart translation in case
              // things need to change/update
              if (_.isFunction(Dataset.chart.types[newChartType].translateFormat)) {
                newValues.displayFormat =
                  Dataset.chart.types[newChartType].translateFormat(cpObj._view,
                    newValues.displayFormat);
              }

              // For a new chart type selection, push the change through even if we don't validate.
              // The reset will take care of sanitization itself.
              cpObj._view.update(
                $.extend(true, {}, newValues, {
                  metadata: cpObj._view.metadata
                })
              );
              cpObj._updateErrorVisibility();
            }
            cpObj.reset();
            newValues = cpObj._getFormValues();
          }

          if (!cpObj.validateForm()) {
            cpObj._updateErrorVisibility(newValues.displayFormat.valueColumns);
            cpObj.$dom().closest('.panes').scrollTop(initSidebarScroll);
            return;
          }

          //Clean-up sparse inputs in value column repeater so colors sync and merge correctly.
          cpObj.$dom().find("[class*='ValueSelection'] .line").each(function(i, el) {
            var $line = $(el);
            if ($.isBlank($line.find('.columnSelectControl').val())) {
              $line.remove();
            }
          });

          //TODO: clean this up a bit, custom content with linkedFields + onlyIfs behave strangely
          //Show the correct color selection method with dsg enabled
          var $dsgColors = cpObj.$dom().find('.colorArray');
          var $colColors = cpObj.$dom().find('.colors');
          //If manually hidden through onlyIf
          if ($dsgColors.css('display') == 'none' && $colColors) {
            $colColors.show();
          } else {
            $colColors.hide();
          }

          var view = $.extend(true, {
              metadata: {
                renderTypeConfig: {
                  visible: {
                    chart: true
                  }
                }
              }
            },
            newValues, {
              metadata: cpObj._view.metadata
            });

          var addColumn = function(colId) {
            var col = cpObj._view.columnForIdentifier(colId);
            if (_.any(col.renderType.aggregates, function(a) {
                return a.value == 'sum';
              }))
              col.format.aggregate = 'sum';
          };

          _.each(view.displayFormat.fixedColumns || [], addColumn);

          // Conditionally apply a default pie/donut sort.
          var isPieStyleChart = _.include(['pie', 'donut'], view.displayFormat.chartType);
          var isSameChartType = !isBrandNewChart && originalChartType == view.displayFormat.chartType;
          if ((isBrandNewChart || isSameChartType) && isPieStyleChart &&
            !$.subKeyDefined(cpObj, '_view.metadata.jsonQuery.order')) {
            view.metadata = $.extend(true, view.metadata, cpObj._view.metadata);
            view.metadata.jsonQuery.order = cpObj._getPieDefaultOrderBy(view.displayFormat.valueColumns);
          }

          if (((view.displayFormat.chartType == 'bar') || (view.displayFormat.chartType == 'column')) &&
            (view.displayFormat.stacking == true)) {
            view.displayFormat.chartType = 'stacked' + view.displayFormat.chartType;
          }
          cpObj._view.update(view);
          cpObj._updateErrorVisibility();



          //TEST WITH FILTERS

          if (isEdit(cpObj)) {
            // We need to show all columns when editing a view so that
            // any filters/facets work properly
            var colIds = _.pluck(cpObj._view.realColumns, 'id');
            if (colIds.length > 0) {
              cpObj._view.setVisibleColumns(colIds, null, true);
            }
          }

          cpObj.$dom().closest('.panes').scrollTop(initSidebarScroll);

          cpObj._finishProcessing();
        });
      },

      // NOTE: Keep this in sync with the one in d3.impl.pie.js!
      _getPieDefaultOrderBy: function(valueColumns) {
        var cpObj = this;
        return _.map(valueColumns, function(col) {
          return {
            ascending: false,
            columnFieldName: cpObj._view.columnForIdentifier(col.fieldName || col.tableColumnId).fieldName
          };
        });
      }

    }, {
      name: 'chart_create'
    },
    'controlPane');

  var isEdit = function(cpObj) {
    return _.include(cpObj._view.metadata.availableDisplayTypes, 'chart');
  };

  if (!blist.sidebarHidden.visualize.chartCreate) {
    $.gridSidebar.registerConfig('visualize.chart_create', 'pane_chart_create', 0);
  }

})(jQuery);
