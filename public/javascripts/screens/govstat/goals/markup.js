;(function()
{

window.govstat.markup = {
    goalEditor:
    {
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
                        for: goal.cid + '_we',
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
                        for: goal.cid + '_comparison',
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
                        for: goal.cid + '_name',
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
                        for: goal.cid + '_amount',
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
                        for: goal.cid + '_amount_pct',
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
                        for: goal.cid + '_end_date',
                        contents: 'Goal Date'
                    }, {
                        _: 'input',
                        type: 'text',
                        id: goal.cid + '_end_date',
                        className: 'date',
                        name: 'end_date',
                        value: goal.get('end_date')
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
                            for: goal.cid + '_start_date',
                            contents: 'Start Date'
                        }, {
                            _: 'input',
                            type: 'text',
                            id: goal.cid + '_start_date',
                            className: 'date',
                            name: 'start_date',
                            value: goal.get('start_date')
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
                            contents: goal.get('description') // TODO: htmlsafe
                        }, {
                            _: 'label',
                            className: 'notesLabel',
                            contents: 'Description'
                        }]
                    }]
                }]
            })
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
                for: agency.cid + '_name',
                contents: 'Agency'
            }]
        }]);
    }
};

})();

