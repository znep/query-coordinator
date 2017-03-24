// TODO: I'M AN ABOMINATION KILL ME PLEASE I HEAR HAML IS PRETTY NICE

(function() {

  blist.namespace.fetch('blist.govstat').markup = {
    goalEditor: {
      actions: function(goal) {
        return $.tag2({
          _: 'div',
          className: 'headerBar',
          contents: [{
            _: 'div',
            className: 'status status-' + goal.get('goal_status'),
            contents: [{
              _: 'span',
              className: 'computed ss-check',
              contents: 'Ready'
            }, {
              _: 'span',
              className: 'computing ss-loading',
              contents: 'Calculating...'
            }, {
              _: 'span',
              className: 'draft ss-write',
              contents: 'Not Complete'
            }]
          }, {
            _: 'div',
            className: 'actions',
            contents: [{
              _: 'a',
              className: ['deleteGoal', 'ss-trash', 'button'],
              href: '#delete goal',
              contents: 'Delete this Goal'
            }, {
              _: 'a',
              className: ['jqmClose', 'saveGoal', 'ss-floppydisk', 'button'],
              href: '#save and close',
              contents: 'Save and Close'
            }]
          }]
        });
      },
      mainDetails: function(goal) {
        return $.tag2({
          _: 'form',
          className: 'mainDetails',
          contents: [{
            _: 'div',
            className: 'inputWrapper subjectInput',
            contents: [{
              _: 'label',
              'for': goal.cid + '_we',
              contents: 'We'
            }, {
              _: 'input',
              type: 'text',
              id: goal.cid + '_we',
              name: 'subject',
              value: goal.get('subject')
            }]
          }, {
            _: 'span',
            contents: 'will'
          }, {
            _: 'div',
            className: 'inputWrapper selectInput comparisonInput',
            contents: [{
              _: 'label',
              'for': goal.cid + '_comparison',
              contents: 'Improve'
            }, {
              _: 'span',
              className: 'selectValue'
            }, {
              _: 'select',
              id: goal.cid + '_comparison',
              name: 'comparison_function',
              contents: [{
                _: 'option',
                value: 'null',
                contents: '(Change)'
              }, {
                _: 'option',
                value: '<',
                selected: goal.get('comparison_function') === '<',
                contents: 'Reduce'
              }, {
                _: 'option',
                value: '>',
                selected: goal.get('comparison_function') === '>',
                contents: 'Increase'
              }]
            }]
          }, {
            _: 'div',
            className: 'inputWrapper nameInput',
            contents: [{
              _: 'label',
              'for': goal.cid + '_name',
              contents: 'Object'
            }, {
              _: 'input',
              type: 'text',
              id: goal.cid + '_name',
              name: 'name',
              value: goal.get('name')
            }]
          }, {
            _: 'span',
            contents: 'by'
          }, {
            _: 'div',
            className: 'inputWrapper amountInput',
            contents: [{
              _: 'label',
              'for': goal.cid + '_amount',
              contents: 'Amount'
            }, {
              _: 'input',
              type: 'text',
              id: goal.cid + '_amount',
              name: 'goal_delta',
              value: goal.get('goal_delta')
            }]
          }, {
            _: 'div',
            className: 'inputWrapper amountIsPercentInput',
            contents: [{
              _: 'input',
              type: 'checkbox',
              id: goal.cid + '_amount_pct',
              name: 'goal_delta_is_pct',
              checked: goal.get('goal_delta_is_pct') === true
            }, {
              _: 'label',
              'for': goal.cid + '_amount_pct',
              contents: '%'
            }]
          }, {
            _: 'span',
            contents: 'starting'
          }, {
            _: 'div',
            className: 'inputWrapper startDateInput',
            contents: [{
              _: 'label',
              'for': goal.cid + '_start_date',
              contents: 'Start Date'
            }, {
              _: 'input',
              type: 'text',
              id: goal.cid + '_start_date',
              className: 'date',
              name: 'start_date',
              'data-rawvalue': goal.get('start_date'),
              value: goal.get('start_date') ? new Date(goal.get('start_date')).toDateString() : ''
            }]
          }, {
            _: 'span',
            contents: 'and completing by'
          }, {
            _: 'div',
            className: 'inputWrapper endDateInput',
            contents: [{
              _: 'label',
              'for': goal.cid + '_end_date',
              contents: 'Goal Date'
            }, {
              _: 'input',
              type: 'text',
              id: goal.cid + '_end_date',
              className: 'date',
              name: 'end_date',
              'data-rawvalue': goal.get('end_date'),
              value: goal.get('end_date') ? new Date(goal.get('end_date')).toDateString() : ''
            }]
          }, {
            _: 'span',
            contents: '.'
          }, {
            _: 'div',
            className: 'customTitle',
            contents: [{
              _: 'div',
              className: 'inputWrapper customTitleInput',
              contents: [{
                _: 'label',
                'for': goal.cid + '_custom_title',
                contents: 'Goal Title'
              }, {
                _: 'input',
                type: 'text',
                id: goal.cid + '_custom_title',
                name: 'custom_title',
                value: goal.get('custom_title')
              }]
            }]
          }]
        });
      },

      additionalDetails: function(goal) {
        return $.tag2({
          _: 'form',
          className: 'additionalDetails',
          contents: [{
            _: 'h2',
            contents: 'Additional Details'
          }, {
            _: 'div',
            className: 'detailLine',
            contents: [{
              _: 'span',
              contents: 'It will be managed by '
            }, {
              _: 'div',
              className: 'agencyInput'
            }, {
              _: 'span',
              contents: '.'
            }]
          }, {
            _: 'div',
            className: 'detailLine',
            contents: [{
              i: !$.isBlank(goal.get('category')) && (goal.get('category') !== ''),
              t: [{
                _: 'span',
                contents: 'It is visible '
              }, {
                _: 'div',
                className: ['inputWrapper', 'selectInput', 'publicInput'],
                contents: [{
                  _: 'span',
                  className: 'selectValue'
                }, {
                  _: 'select',
                  name: 'is_public',
                  id: goal.cid + '_public',
                  contents: [{
                    _: 'option',
                    value: 'true',
                    selected: goal.get('is_public') === true,
                    contents: 'publicly'
                  }, {
                    _: 'option',
                    value: 'false',
                    selected: goal.get('is_public') === false,
                    contents: 'internally'
                  }]
                }, {
                  _: 'label',
                  'for': goal.cid + '_public',
                  contents: 'Visibility'
                }]
              }],
              e: [{
                _: 'span',
                contents: 'Please categorize this goal if you wish to make it publicly visible.'
              }]
            }, {
              _: 'span',
              contents: '. It has an icon of '
            }, {
              _: 'a',
              href: '#icon',
              className: 'iconPickerHandle ss-icon',
              name: 'icon',
              contents: goal.get('icon') || 'checkclipboard'
            }, {
              _: 'span',
              contents: ', and it has a title image of:'
            }, {
              _: 'div',
              className: 'imageInput',
              contents: [{
                _: 'img',
                src: goal.get('title_image') || '',
                className: 'titleImage',
                alt: 'Title Image'
              }, {
                _: 'input',
                className: 'titleImageInput',
                contents: 'Select an Image',
                'data-endpoint': '/api/assets'
              }]
            }, {
              _: 'span',
              contents: 'We recommend a title image that&apos;s at least 1000px wide and 400px tall.'
            }]
          }, {
            _: 'div',
            className: 'detailLine noteLine',
            contents: [{
              _: 'div',
              className: 'suppressChartInput',
              contents: [{
                _: 'input',
                type: 'checkbox',
                id: goal.cid + '_suppress_chart',
                name: 'suppress_chart',
                checked: goal.get('suppress_chart') === true
              }, {
                _: 'label',
                'for': goal.cid + '_suppress_chart',
                contents: 'Do not display the prevailing metric chart.'
              }]
            }]
          }, {
            _: 'div',
            className: 'detailLine noteLine',
            contents: [{
              _: 'span',
              contents: 'Here are some additional details: '
            }, {
              _: 'div',
              className: 'notesWrapper',
              contents: [{
                _: 'div',
                className: 'notes',
                contents: goal.get('description')
              }, {
                _: 'label',
                className: 'notesLabel',
                contents: 'Description'
              }]
            }]
          }]
        });
      },

      relatedDatasets: function(goal) {
        return $.tag2({
          _: 'form',
          className: 'relatedDatasets',
          contents: [{
            _: 'h2',
            contents: 'Related Visualizations'
          }, {
            _: 'div',
            className: 'detailLine noteLine',
            contents: [{
              _: 'div',
              className: 'heroVizInput',
              contents: [{
                _: 'input',
                type: 'checkbox',
                id: goal.cid + '_hero_viz',
                name: 'hero_viz',
                checked: goal.get('hero_viz') === true
              }, {
                _: 'label',
                'for': goal.cid + '_hero_viz',
                contents: 'First visualization uses hero layout'
              }]
            }]
          }, {
            _: 'div',
            className: 'datasetListContainer'
          }, {
            _: 'a',
            className: ['addDataset', 'button', 'ss-piechart'],
            href: '#add',
            contents: 'Add a Visualization'
          }]
        });
      },

      metrics: function() {
        return $.tag2([{
          _: 'div',
          className: 'metricsBlock',
          contents: [{
            _: 'div',
            className: 'metricListContainer'
          }, {
            _: 'a',
            className: ['addMetric', 'button', 'ss-linechartclipboard'],
            href: '#add',
            contents: 'Add a Metric'
          }]
        }]);
      }
    },

    agencyEditor: function(agency) {
      return $.tag2([{
        _: 'span',
        className: 'commaText',
        contents: ', '
      }, {
        _: 'span',
        className: 'andText',
        contents: 'and '
      }, {
        _: 'div',
        className: 'inputWrapper',
        contents: [{
          _: 'input',
          type: 'text',
          id: agency.cid + '_name',
          value: agency.get('name')
        }, {
          _: 'label',
          'for': agency.cid + '_name',
          contents: 'Agency'
        }]
      }]);
    },

    indicatorEditor: function(indicator) {
      return $.tag2({
        _: 'form',
        className: ['indicator', indicator.indicatorType],
        contents: [{
          _: 'div',
          className: 'datasetSection',
          contents: [{
            _: 'h2',
            contents: {
              current: 'Current Data',
              baseline: 'Historical Baseline'
            }[indicator.indicatorType]
          }, {
            _: 'div',
            className: 'datasetContainer'
          }, {
            _: 'a',
            className: ['selectDataset', 'button', 'ss-database'],
            href: '#select dataset',
            title: 'Select the dataset that contains the ' + indicator.indicatorType + ' data for this metric.',
            contents: 'Select Dataset'
          }]
        }, {
          _: 'div',
          className: 'calculationSection',
          contents: [{
            _: 'span',
            contents: 'Based on dates in'
          }, {
            _: 'div',
            className: 'columnContainer date_column'
          }, {
            _: 'span',
            contents: ', '
          }, {
            _: 'span',
            contents: 'the'
          }, {
            _: 'div',
            className: ['inputWrapper', 'selectInput', 'aggregationFunctionInput'],
            contents: [{
              _: 'span',
              className: 'selectValue'
            }, {
              _: 'select',
              name: 'aggregation_function',
              id: indicator.cid + '_aggregation_function',
              contents: [{
                _: 'option',
                value: 'sum',
                selected: indicator.get('aggregation_function') === 'sum',
                contents: 'sum'
              }, {
                _: 'option',
                value: 'average',
                selected: indicator.get('aggregation_function') === 'average',
                contents: 'average'
              }, {
                _: 'option',
                value: 'most_recent',
                selected: indicator.get('aggregation_function') === 'most_recent',
                contents: 'most recent value'
              }, {
                _: 'option',
                value: 'max',
                selected: indicator.get('aggregation_function') === 'max',
                contents: 'maximum'
              }, {
                _: 'option',
                value: 'min',
                selected: indicator.get('aggregation_function') === 'min',
                contents: 'minimum'
              }]
            }, {
              _: 'label',
              'for': indicator.cid + '_aggregation_function',
              contents: 'Operation'
            }]
          }, {
            _: 'span',
            contents: 'of'
          }, {
            _: 'div',
            className: 'columnContainer column1'
          }, {
            _: 'div',
            className: ['inputWrapper', 'selectInput', 'columnFunctionInput', {
              i: _.include(['plus', 'divide', 'minus'], indicator.get('column_function')),
              t: 'hasFunction'
            }],
            contents: [{
              _: 'span',
              className: 'selectValue'
            }, {
              _: 'select',
              name: 'column_function',
              id: indicator.cid + '_column_function',
              contents: [{
                _: 'option',
                value: 'null',
                selected: indicator.get('column_function') === 'null',
                contents: 'alone'
              }, {
                _: 'option',
                value: 'sum',
                selected: indicator.get('column_function') === 'sum',
                contents: 'plus'
              }, {
                _: 'option',
                value: 'divide',
                selected: indicator.get('column_function') === 'divide',
                contents: 'divided by'
              }]
            }, {
              _: 'label',
              'for': indicator.cid + '_column_function',
              contents: 'Operation'
            }]
          }, {
            _: 'div',
            className: 'column2Wrapper',
            contents: [{
              _: 'span',
              contents: 'the'
            }, {
              _: 'div',
              className: ['inputWrapper', 'selectInput', 'aggregationFunctionInput'],
              contents: [{
                _: 'span',
                className: 'selectValue'
              }, {
                _: 'select',
                name: 'aggregation_function2',
                id: indicator.cid + '_aggregation_function2',
                contents: [{
                  _: 'option',
                  value: 'sum',
                  selected: indicator.get('aggregation_function2') === 'sum',
                  contents: 'sum'
                }, {
                  _: 'option',
                  value: 'average',
                  selected: indicator.get('aggregation_function2') === 'average',
                  contents: 'average'
                }, {
                  _: 'option',
                  value: 'most_recent',
                  selected: indicator.get('aggregation_function2') === 'most_recent',
                  contents: 'most recent value'
                }, {
                  _: 'option',
                  value: 'max',
                  selected: indicator.get('aggregation_function2') === 'max',
                  contents: 'maximum'
                }, {
                  _: 'option',
                  value: 'min',
                  selected: indicator.get('aggregation_function2') === 'min',
                  contents: 'minimum'
                }]
              }, {
                _: 'label',
                'for': indicator.cid + '_aggregation_function2',
                contents: 'Operation'
              }]
            }, {
              _: 'span',
              contents: 'of'
            }, {
              _: 'div',
              className: 'columnContainer column2'
            }]
          }, {
            i: indicator.indicatorType == 'baseline',
            t: {
              _: 'div',
              className: 'baselineDates',
              contents: [{
                _: 'span',
                contents: 'This data starts on '
              }, {
                _: 'div',
                className: 'inputWrapper baselineStartDateInput',
                contents: [{
                  _: 'label',
                  'for': indicator.cid + '_start_date',
                  contents: 'Start Date'
                }, {
                  _: 'input',
                  type: 'text',
                  id: indicator.cid + '_start_date',
                  className: 'date',
                  name: 'start_date',
                  value: indicator.get('start_date') ?
                    new Date(indicator.get('start_date')).toDateString() : ''
                }]
              }, {
                _: 'span',
                contents: ' and ends on '
              }, {
                _: 'div',
                className: 'inputWrapper baselineEndDateInput',
                contents: [{
                  _: 'label',
                  'for': indicator.cid + '_end_date',
                  contents: 'End Date'
                }, {
                  _: 'input',
                  type: 'text',
                  id: indicator.cid + '_end_date',
                  className: 'date',
                  name: 'end_date',
                  'data-rawvalue': indicator.get('end_date'),
                  value: indicator.get('end_date') ?
                    new Date(indicator.get('end_date')).toDateString() : ''
                }]
              }]
            }
          }]
        }]
      });
    },

    datasetCard: function(ds) {
      var preferredImage = ds.preferredImage();
      return $.tag2([{
        i: $.isBlank(preferredImage),
        t: {
          _: 'div',
          className: ['datasetIcon', 'type' + ds.type.capitalize()],
          contents: {
            _: 'span',
            className: 'icon'
          }
        },
        e: {
          _: 'img',
          src: preferredImage,
          alt: ds.name
        }
      }, {
        _: 'h2',
        className: 'datasetName',
        contents: $.htmlEscape(ds.name)
      }]);
    },

    columnCard: function(columnProxy) {
      return $.tag2({
        _: 'div',
        className: 'inputWrapper columnInput',
        contents: [{
          _: 'span',
          className: 'selectValue'
        }, {
          _: 'select',
          id: columnProxy.cid + '_column'
        }, {
          _: 'label',
          'for': columnProxy.cid + '_column',
          contents: 'Column'
        }]
      });
    },

    metricEditor: function(metric) {
      return $.tag2([{
        _: 'h2',
        contents: 'Metric Details'
      }, {
        _: 'div',
        className: 'prevailing',
        contents: 'Prevailing',
        title: 'This metric will be the primary metric by which the goal requirements are assessed.'
      }, {
        _: 'div',
        className: 'detailsLine',
        contents: [{
          _: 'span',
          contents: 'We will measure '
        }, {
          _: 'div',
          className: 'inputWrapper textInput nameInput',
          contents: [{
            _: 'label',
            'for': metric.cid + '_title',
            contents: 'Title'
          }, {
            _: 'input',
            type: 'text',
            id: metric.cid + '_title',
            name: 'title',
            value: metric.get('title')
          }]
        }, {
          _: 'span',
          contents: ' by '
        }, {
          _: 'div',
          className: 'inputWrapper textInput',
          contents: [{
            _: 'label',
            'for': metric.cid + '_unit',
            contents: 'Unit'
          }, {
            _: 'input',
            type: 'text',
            id: metric.cid + '_unit',
            name: 'unit',
            value: metric.get('unit')
          }]
        }]
      }, {
        _: 'div',
        className: 'indicator',
        contents: [{
          _: 'div',
          className: 'datasetContainer indicatorContainer',
          contents: [{
            _: 'div',
            className: 'left'
          }, {
            _: 'div',
            className: 'right'
          }]
        }, {
          _: 'div',
          className: 'calculationContainer indicatorContainer',
          contents: [{
            _: 'div',
            className: 'left'
          }, {
            _: 'div',
            className: 'right'
          }, {
            _: 'div',
            className: 'comparison',
            contents: [{
              _: 'p',
              contents: 'should be'
            }, {
              _: 'div',
              className: 'inputWrapper comparisonInput',
              contents: [{
                _: 'span',
                className: 'selectValue'
              }, {
                _: 'select',
                name: 'comparison_function',
                id: metric.cid + '_comparison',
                contents: [{
                  _: 'option',
                  value: '<',
                  selected: metric.get('comparison_function') === '<',
                  contents: 'reduced'
                }, {
                  _: 'option',
                  value: '>',
                  selected: metric.get('comparison_function') === '>',
                  contents: 'increased'
                }]
              }, {
                _: 'label',
                'for': metric.cid + '_comparison',
                contents: 'Comparison'
              }]
            }, {
              _: 'p',
              contents: 'compared to'
            }]
          }]
        }]
      }]);
    }
  };

})();
