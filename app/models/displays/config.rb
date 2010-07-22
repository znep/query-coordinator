# This module contains meta-configuration information defining the user interface
module Displays::Config
    def self.[](name)
        VISUALIZATION_CONFIG[name]
    end

    def self.each_public(&proc)
        VISUALIZATION_CONFIG.each do |name, cf|
            proc.call name, cf unless cf['hidden']
        end
    end

    def self.for_view(view, is_edit)
        result = []
        self.each_public do |name, cf|
            result << [ name, cf ] if view.can_create_visualization_type?(name, is_edit)
        end
        result
    end

    COLOR_DEFAULTS = ['#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff',
                      '#0000ff', '#9900ff', '#ff00ff']

    DEF_COLOR_OPTION = {'label' => 'Color', 'name' => 'colors',
                        'type' => 'color', 'default' => COLOR_DEFAULTS[0],
                        'colorArray' => COLOR_DEFAULTS}

    LEGEND_OPTIONS = {'label' => 'Legend', 'name' => 'legend',
                        'type' => 'dropdown', 'dropdownOptions' => [
                          {'value' => 'bottom', 'label' => 'Bottom'},
                          {'value' => 'top', 'label' => 'Top'},
                          {'value' => 'right', 'label' => 'Right'},
                          {'value' => 'left', 'label' => 'Left'},
                          {'value' => 'none', 'label' => 'Hidden'}
                        ],
                        'default' => 'bottom'}

    TEXTUAL_TYPES = ['text', 'drop_down_list']
    NUMERIC_TYPES = ['number', 'percent', 'money']

    VISUALIZATION_CONFIG = {
        'annotatedtimeline' => {'display' => 'chart', 'hidden' => true},
        'imagesparkline' => {'display' => 'chart', 'hidden' => true},
        'areachart' => {'display' => 'chart', 'hidden' => true},
        'barchart' => {'display' => 'chart', 'hidden' => true},
        'columnchart' => {'display' => 'chart', 'hidden' => true},
        'linechart' => {'display' => 'chart', 'hidden' => true},
        'piechart' => {'display' => 'chart', 'hidden' => true},

        'intensitymap' => {'display' => 'map', 'hidden' => true},
        'geomap' => {'display' => 'map', 'hidden' => true},

        'bar' => {'label' => 'Bar Chart',
            'fixedColumns' => [{'dataType' => TEXTUAL_TYPES, 'label' => 'Groups'}],
            'dataColumns' => [{'dataType' => NUMERIC_TYPES, 'label' => 'Values'}],
            'dataColumnOptions' => [DEF_COLOR_OPTION],
            'mainOptions' => [
                {'label' => 'X-Axis Title', 'name' => 'titleX', 'type' => 'string'},
                {'label' => 'Y-Axis Title', 'name' => 'titleY', 'type' => 'string'}
            ],
            'advancedOptions' => [LEGEND_OPTIONS]
        },

        'timeline' => {'label' => 'Time Line',
            'fixedColumns' => [{'dataType' => ['date', 'calendar_date'],
                'label' => 'Date'}],
            'dataColumns' => [{'dataType' => NUMERIC_TYPES, 'label' => 'Value'},
                {'dataType' => 'text', 'label' => 'Title', 'optional' => true},
                {'dataType' => 'text', 'label' => 'Annotation', 'optional' => true}
            ],
            'dataColumnOptions' => [DEF_COLOR_OPTION],
            'mainOptions' => [
                {'label' => 'Y-Axis Title', 'name' => 'titleY', 'type' => 'string'}
            ],
            'advancedOptions' => [LEGEND_OPTIONS]
        },


        'area' => {'label' => 'Area Chart',
            'fixedColumns' => [{'dataType' => TEXTUAL_TYPES, 'label' => 'Categories'}],
            'dataColumns' => [{'dataType' => NUMERIC_TYPES, 'label' => 'Value'}],
            'dataColumnOptions' => [DEF_COLOR_OPTION],
            'mainOptions' => [
                {'label' => 'X-Axis Title', 'name' => 'titleX', 'type' => 'string'},
                {'label' => 'Y-Axis Title', 'name' => 'titleY', 'type' => 'string'}
            ],
            'advancedOptions' => [LEGEND_OPTIONS,
                {'name' => 'lineSize', 'label' => 'Show Lines', 'type' => 'boolean',
                  'booleanTrueValue' => '2', 'booleanFalseValue' => '0',
                  'default' => '2'},
                {'name' => 'pointSize', 'label' => 'Show Points',
                  'type' => 'boolean', 'booleanTrueValue' => '3',
                  'booleanFalseValue' => '0', 'default' => '3'}
            ]
        },

        'column' => {'label' => 'Column Chart',
            'fixedColumns' => [{'dataType' => TEXTUAL_TYPES, 'label' => 'Groups'}],
            'dataColumns' => [{'dataType' => NUMERIC_TYPES, 'label' => 'Values'}],
            'dataColumnOptions' => [DEF_COLOR_OPTION],
            'mainOptions' => [
                {'label' => 'X-Axis Title', 'name' => 'titleX', 'type' => 'string'},
                {'label' => 'Y-Axis Title', 'name' => 'titleY', 'type' => 'string'}
            ],
            'advancedOptions' => [LEGEND_OPTIONS]
        },

        'line' => {'label' => 'Line Chart',
            'fixedColumns' => [{'dataType' => TEXTUAL_TYPES, 'label' => 'Categories',
                  'optional' => true}],
            'dataColumns' => [{'dataType' => NUMERIC_TYPES, 'label' => 'Value'}],
            'dataColumnOptions' => [DEF_COLOR_OPTION],
            'mainOptions' => [
                {'label' => 'X-Axis Title', 'name' => 'titleX', 'type' => 'string'},
                {'label' => 'Y-Axis Title', 'name' => 'titleY', 'type' => 'string'}
            ],
            'advancedOptions' => [LEGEND_OPTIONS,
                {'name' => 'lineSize', 'label' => 'Show Lines', 'type' => 'boolean',
                  'booleanTrueValue' => '2', 'booleanFalseValue' => '0',
                  'default' => '2'},
                {'name' => 'pointSize', 'label' => 'Show Points',
                  'type' => 'boolean', 'booleanTrueValue' => '3',
                  'booleanFalseValue' => '0', 'default' => '3'},
                {'label' => 'Smooth Line', 'name' => 'smoothLine',
                  'type' => 'boolean', 'default' => false},
            ]
        },

        'pie' => {'label' => 'Pie Chart',
            'fixedColumns' => [{'dataType' => TEXTUAL_TYPES, 'label' => 'Label'},
                {'dataType' => NUMERIC_TYPES, 'label' => 'Values'}],
            'mainOptions' => [{'label' => 'Colors', 'name' => 'colors',
                  'type' => 'colorArray', 'default' => COLOR_DEFAULTS}],
            'advancedOptions' => [LEGEND_OPTIONS,
                {'label' => 'Min. Angle', 'name' => 'pieJoinAngle',
                  'type' => 'number', 'default' => 1,
                  'help' => 'Slices below this angle will be combined into an "Other" slice'}
            ]
        }
    }
end
