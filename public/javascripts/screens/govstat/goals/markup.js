// TODO: I'M AN ABOMINATION KILL ME PLEASE I HEAR HAML IS PRETTY NICE

;(function()
{

blist.namespace.fetch('blist.govstat').markup = {
    goalEditor:
    {
        actions: function()
        {
            return $.tag2({
                _: 'div',
                className: 'actions',
                contents: [{
                    _: 'a',
                    className: 'deleteGoal',
                    href: '#delete goal',
                    contents: [{
                        _: 'span',
                        className: 'ss-trash'
                    }, 'Delete this Goal']
                }, {
                    _: 'a',
                    className: 'jqmClose',
                    href: '#save and close',
                    contents: [{
                        _: 'span',
                        className: 'ss-close'
                    }, 'Save and Close']
                }]
            })
        },
        mainDetails: function(goal)
        {
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
                        contents: 'Reduce / Increase'
                    }, {
                        _: 'span',
                        className: 'selectValue'
                    }, {
                        _: 'select',
                        id: goal.cid + '_comparison',
                        name: 'comparison',
                        contents: [{
                            _: 'option',
                            value: '<',
                            selected: goal.get('comparison') === '<',
                            contents: 'Reduce'
                        }, {
                            _: 'option',
                            value: '>',
                            selected: goal.get('comparison') === '>',
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
                    contents: 'before'
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
                }]
            });
        },

        additionalDetails: function(goal)
        {
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
                        contents: 'We&rsquo;ll get started on '
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
                        contents: '.'
                    }]
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
                    className: 'detailLine noteLine',
                    contents: [{
                        _: 'span',
                        contents: 'Here are some additional details: '
                    }, {
                        _: 'div',
                        className: 'notesWrapper',
                        contents: [{
                            _: 'span',
                            className: 'notes',
                            contentEditable: 'true',
                            contents: $.htmlEscape(goal.get('description') || '').replace(/\n/g, '<br/>')
                        }, {
                            _: 'label',
                            className: 'notesLabel',
                            contents: 'Description'
                        }]
                    }]
                }]
            })
        },

		relatedDatasets: function(goal)
		{
			return $.tag2({
				_: 'form',
				className: 'relatedDatasets',
				contents: [{
					_: 'h2',
					contents: 'Related Datasets'
				}, {
					_: 'div',
					className: 'datasetListContainer'
				}, {
					_: 'a',
					className: 'addDataset',
					href: '#add',
					contents: 'Add A Dataset'
				}]
			});
		},

        metrics: function()
        {
            return $.tag2([{
                _: 'div',
                contents: [{
                    _: 'div',
                    className: 'metricListContainer'
                }, {
                    _: 'a',
                    className: 'addMetric',
                    href: '#add',
                    contents: 'Add a Metric'
                }]
            }]);
        }
    },

    agencyEditor: function(agency)
    {
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

	indicatorEditor: function(indicator)
	{
		return $.tag2({
			_: 'form',
			className: [ 'indicator', indicator.indicatorType ],
			contents: [{
				_: 'div',
				className: 'datasetSection',
				contents: [{
    				_: 'h2',
    				contents: { current: 'Current Data', baseline: 'Historical Baseline' }[indicator.indicatorType]
    			}, {
					_: 'div',
					className: 'datasetContainer'
				}, {
					_: 'a',
					className: 'selectDataset',
					href: '#select dataset',
					title: 'Select the dataset that contains ' + indicator.indicatorType + ' for this metric.',
					contents: 'Select Dataset'
				}]
			}, {
				_: 'div',
				className: 'calculationSection',
				contents: [{
					_: 'div',
					className: 'columnContainer column1'
				}, {
					_: 'div',
					className: [ 'inputWrapper selectInput columnFunctionInput' ],
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
							value: 'plus',
							selected: indicator.get('column_function') === 'plus',
                            contents: 'plus'
						}, {
							_: 'option',
							value: 'divide',
							selected: indicator.get('column_function') === 'divide',
                            contents: 'divided by'
						}, {
							_: 'option',
							value: 'minus',
							selected: indicator.get('column_function') === 'minus',
                            contents: 'minus'
						}]
					}, {
					    _: 'label',
                        'for': indicator.cid + '_column_function',
                        contents: 'Operation'
					}]
				}, {
					_: 'div',
					className: 'columnContainer column2'
				}]
			}, {
				_: 'div',
				className: 'periodSection',
				contents: [{
					_: 'span',
                    contents: 'Slice this data by '
				}, {
				    _: 'div',
                    className: 'inputWrapper selectInput metricPeriodInput',
                    contents: [{
                        _: 'span',
                        className: 'selectValue'
                    }, {
                        _: 'select',
                        name: 'metric_period',
                        id: indicator.cid + '_metric_period',
                        contents: [{
                            _: 'option',
                            value: 'monthly',
                            selected: indicator.get('metric_period') === 'monthly',
                            contents: 'month'
                        }, {
                            _: 'option',
                            value: 'yearly',
                            selected: indicator.get('metric_period') === 'yearly',
                            contents: 'year'
                        }]
                    }, {
                        _: 'label',
                        'for': indicator.cid + '_metric_period',
                        contents: 'Period'
                    }]
				}, {
				    _: 'span',
                    contents: ', and<br/>' // LAZY HACK ALERT
				}, {
                    _: 'div',
                    className: 'inputWrapper selectInput aggregationFunctionInput',
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
                            value: 'extrapolate',
                            selected: indicator.get('aggregation_function') === 'extrapolate',
                            contents: 'extrapolate'
                        }]
                    }, {
                        _: 'label',
                        'for': indicator.cid + '_aggregation_function',
                        contents: 'Aggregation'
                    }]
                }, {
				    _: 'span',
                    contents: ' data points within each slice.'
				}]
			}]
		});
	},

	datasetCard: function(ds)
	{
		var preferredImage = ds.preferredImage();
		return $.tag2([{
			i: $.isBlank(preferredImage),
			t: {
				_: 'div',
				className: [ 'datasetIcon', 'type' + ds.type.capitalize() ],
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

    columnCard: function(columnProxy)
    {
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

	metricEditor: function(metric)
	{
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
				contents: 'This is the '
			}, {
				_: 'div',
				className: 'inputWrapper nameInput',
				contents: [{
                    _: 'label',
                    'for': metric.cid + '_name',
                    contents: 'Name'
                }, {
                    _: 'input',
                    type: 'text',
                    id: metric.cid + '_name',
                    name: 'name',
                    value: metric.get('name')
                }]
			}, {
				_: 'span',
				contents: ' measurement.'
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
                            name: 'comparison',
                            id: metric.cid + '_comparison',
                            contents: [{
                                _: 'option',
                                value: '<',
                                selected: metric.get('comparison') === '<',
                                contents: 'reduced'
                            }, {
                                _: 'option',
                                value: '>',
                                selected: metric.get('comparison') === '>',
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
            }, {
    			_: 'div',
    			className: 'periodContainer indicatorContainer',
    			contents: [{
    				_: 'div',
    				className: 'left'
    			}, {
    				_: 'div',
    				className: 'right'
    			}]
            }]
		}]);
	}
};

})();

