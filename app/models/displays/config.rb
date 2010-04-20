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

    NUMERIC_TYPES = ['number', 'percent', 'money']

    VISUALIZATION_CONFIG = {
        'barchart' => {
            'display' => 'chart',
            'library' => 'google.visualization.BarChart',
            'label' => 'Bar Chart',
            'fixedColumns' => [{'dataType' => 'text', 'label' => 'Groups'}],
            'dataColumns' => [{'dataType' => NUMERIC_TYPES, 'label' => 'Values'}],
            'dataColumnOptions' => [DEF_COLOR_OPTION],
            'mainOptions' => [
                {'label' => 'X-Axis Title', 'name' => 'titleX', 'type' => 'string'},
                {'label' => 'Y-Axis Title', 'name' => 'titleY', 'type' => 'string'}
            ],
            'advancedOptions' => [LEGEND_OPTIONS]
        },

        'annotatedtimeline' => {'display' => 'google', 'library' => 'google.visualization.AnnotatedTimeLine', 'hidden' => true,
                                'label' => 'Time Line',
                                'fixedColumns' => [{'dataType' => 'date', 'label' => 'Date'}],
                                'dataColumns' => [{'dataType' => NUMERIC_TYPES, 'label' => 'Value'},
                                                  {'dataType' => 'text', 'label' => 'Title', 'optional' => true},
                                                  {'dataType' => 'text', 'label' => 'Annotation', 'optional' => true}],
                                'dataColumnOptions' => [DEF_COLOR_OPTION],
                                'mainOptions' => [{'name' => 'displayAnnotations', 'type' => 'hidden',
                                                   'default' => true}]
        },

        'imagesparkline' => {'display' => 'chart', 'library' => 'google.visualization.ImageSparkLine', 'hidden' => true,
                             'label' => 'Sparkline',
                             'dataColumns' => [{'dataType' => NUMERIC_TYPES, 'label' => 'Value'}],
                             'dataColumnOptions' => [DEF_COLOR_OPTION],
                             'advancedOptions' => [{'name' => 'labelPosition', 'label' => 'Label',
                                                    'type' => 'dropdown', 'dropdownOptions' => [
                                     {'value' => 'none', 'label' => 'Hidden'},
                                     {'value' => 'left', 'label' => 'Left'},
                                     {'value' => 'right', 'label' => 'Right'}
                                 ], 'default' => 'none'},
                                                   {'name' => 'layout', 'label' => 'Vertical', 'type' => 'boolean',
                                                    'booleanTrueValue' => 'v', 'booleanFalseValue' => 'h', 'default' => 'v'}
                             ]
        },

        'areachart' => {'display' => 'chart', 'library' => 'google.visualization.AreaChart',
                        'label' => 'Area Chart',
                        'fixedColumns' => [{'dataType' => 'text', 'label' => 'Categories'}],
                        'dataColumns' => [{'dataType' => NUMERIC_TYPES, 'label' => 'Value'}],
                        'dataColumnOptions' => [DEF_COLOR_OPTION],
                        'mainOptions' => [
                            {'label' => 'X-Axis Title', 'name' => 'titleX', 'type' => 'string'},
                            {'label' => 'Y-Axis Title', 'name' => 'titleY', 'type' => 'string'}
                        ],
                        'advancedOptions' => [LEGEND_OPTIONS,
                            {'name' => 'lineSize', 'label' => 'Show Lines', 'type' => 'boolean',
                             'booleanTrueValue' => '2', 'booleanFalseValue' => '0', 'default' => '2'},
                            {'name' => 'pointSize', 'label' => 'Show Points', 'type' => 'boolean',
                             'booleanTrueValue' => '3', 'booleanFalseValue' => '0', 'default' => '3'}
                        ]
        },

        'columnchart' => {'display' => 'chart', 'library' => 'google.visualization.ColumnChart',
                          'label' => 'Column Chart',
                          'fixedColumns' => [{'dataType' => 'text', 'label' => 'Groups'}],
                          'dataColumns' => [{'dataType' => NUMERIC_TYPES, 'label' => 'Values'}],
                          'dataColumnOptions' => [DEF_COLOR_OPTION],
                          'mainOptions' => [
                              {'label' => 'X-Axis Title', 'name' => 'titleX', 'type' => 'string'},
                              {'label' => 'Y-Axis Title', 'name' => 'titleY', 'type' => 'string'}
                          ],
                          'advancedOptions' => [LEGEND_OPTIONS]
        },

        'linechart' => {'display' => 'chart', 'library' => 'google.visualization.LineChart',
                        'label' => 'Line Chart',
                        'fixedColumns' => [{'dataType' => 'text', 'label' => 'Categories'}],
                        'dataColumns' => [{'dataType' => NUMERIC_TYPES, 'label' => 'Value'}],
                        'dataColumnOptions' => [DEF_COLOR_OPTION],
                        'mainOptions' => [
                            {'label' => 'X-Axis Title', 'name' => 'titleX', 'type' => 'string'},
                            {'label' => 'Y-Axis Title', 'name' => 'titleY', 'type' => 'string'}
                        ],
                        'advancedOptions' => [LEGEND_OPTIONS,
                            {'name' => 'lineSize', 'label' => 'Show Lines', 'type' => 'boolean',
                             'booleanTrueValue' => '2', 'booleanFalseValue' => '0', 'default' => '2'},
                            {'name' => 'pointSize', 'label' => 'Show Points', 'type' => 'boolean',
                             'booleanTrueValue' => '3', 'booleanFalseValue' => '0', 'default' => '3'},
                            {'label' => 'Smooth Line', 'name' => 'smoothLine', 'type' => 'boolean',
                             'default' => false},
                        ]
        },

        'piechart' => {'display' => 'chart', 'library' => 'google.visualization.PieChart',
                       'label' => 'Pie Chart',
                       'fixedColumns' => [{'dataType' => 'text', 'label' => 'Label'},
                                          {'dataType' => NUMERIC_TYPES, 'label' => 'Values'}],
                       'mainOptions' => [{'label' => 'Colors', 'name' => 'colors',
                                          'type' => 'colorArray', 'default' => COLOR_DEFAULTS}],
                       'advancedOptions' => [LEGEND_OPTIONS,
                           {'label' => 'Min. Angle', 'name' => 'pieJoinAngle', 'type' => 'number',
                            'default' => 1,
                            'help' => 'Slices below this angle will be combined into an "Other" slice'}
                       ]
        },

        'intensitymap' => {'display' => 'google', 'library' => 'google.visualization.IntensityMap',
                           'hidden' => true},

        'geomap' => {'display' => 'google', 'library' => 'google.visualization.GeoMap',
                     'hidden' => true},

        # This chart is really confusing, so I don't think it is worth exposing
        # unless we have specific requests/use cases for it
        'motionchart' => {'display' => 'google', 'library' => 'google.visualization.MotionChart',
                          'hidden' => true},

        # Fusion maps types
        'FCMap_Afghanistan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Africa' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Alabama' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Alaska' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Albania' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Alberta' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Algeria' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Andorra' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Angola' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Antigua' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Argentina' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Arizona' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Arkansas' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Armenia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Asia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Asia3' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_AsiaGeorgia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Australia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Australia2' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Austria' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Azerbaijan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Bahamas' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Bahrain' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Bangladesh' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Barbados' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Belarus' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Belgium' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Belize' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Benin' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Bhutan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Bolivia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_BosniaHerzegovina' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Botswana' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Brazil' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_BrazilRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_BritishColumbia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Brunei' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Bulgaria' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_BurkinaFaso' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Burma' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Burundi' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_California' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Cambodia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Cameroon' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Canada' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_CapeVerde' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_CaymanIslands' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_CentralAfricanRepublic' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_CentralAmerica' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_CentralAmerica2' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_CentralAmericawithCaribbean' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_CentralEuropeanRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Chad' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Chile' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_China' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_China2' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Colombia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Colorado' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Comoros' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Congo' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Connecticut' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_CostaRica' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_CoteDivoire' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Croatia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Cuba' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Cyprus' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Cyprus2' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_CzechRepublic' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Delaware' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_DemocraticRepublicofCongo' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Denmark' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_DenmarkRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_DistrictofColumbia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Djibouti' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Dominica' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_DominicanRepublic' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_EastEuropeanRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_EastTimor' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Ecuador' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Egypt' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_ElSalvador' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_England' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_EnglandRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_EquatorialGuinea' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Eritrea' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Estonia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Ethiopia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Europe' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Europe2' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_EuropeRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Europewithcountries' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_FalklandIsland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Fiji' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Finland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Florida' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_France' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_FranceDepartment' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_FrenchGuiana' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Gabon' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Gambia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Georgia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Germany' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Ghana' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Greece' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Greenland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Grenada' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Guatemala' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Guinea' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_GuineaBissau' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Guyana' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Haiti' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Hawaii' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Honduras' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_HongKong' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Hungary' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_HungaryRegions' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Iceland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Idaho' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Illinois' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_India' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Indiana' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Indonesia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Iowa' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Iran' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Iraq' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Ireland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Israel' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Italy' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Jamaica' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Japan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Jordan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Kansas' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Kazakhstan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Kentucky' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Kenya' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Kiribati' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Kuwait' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Kyrgyzstan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Laos' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Latvia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Lebanon' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Lesotho' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Liberia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Libya' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Liechtenstein' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Lithuania' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Louisiana' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Luxembourg' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Macau' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Macedonia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Madagascar' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_MadagascarRegions' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Maine' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Malawi' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Malaysia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Mali' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Malta' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Manitoba' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_MarshallIsland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Maryland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Massachusetts' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Mauritania' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Mauritius' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Mexico' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Michigan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Micronesia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_MiddleEast' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Minnesota' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Mississippi' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Missouri' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Moldova' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Monaco' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Mongolia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Montana' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Montenegro' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Morocco' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Mozambique' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Namibia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Nauru' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Nebraska' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Nepal' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Netherland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Nevada' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NewBrunswick' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NewCaledonia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NewfoundlandandLabrador' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NewHampshire' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NewJersey' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NewMexico' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NewWorld' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NewYork' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NewZealand' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Nicaragua' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Niger' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Nigeria' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NorthAmerica' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NorthAmerica_WOCentral' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NorthCarolina' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NorthDakota' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NorthEuropeanRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NorthIreland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NorthKorea' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NorthWestTerritories' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Norway' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NorwayRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_NovaScotia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Nunavut' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Oceania' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Ohio' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Oklahoma' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Oman' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Ontario' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Oregon' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Pakistan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Palau' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Panama' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_PapuaNewGuinea' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Paraguay' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Pennsylvania' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Peru' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Philippines' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Poland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_PolandCounties' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Portugal' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_PrinceEdwardIsland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_PuertoRico' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Qatar' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Quebec' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_RhodeIsland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Romania' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Russia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Rwanda' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SaintKittsandNevis' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SaintLucia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SaintVincentandtheGrenadines' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Samoa' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SanMarino' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SaoTomeandPrincipe' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Saskatchewan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SaudiArabia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Scotland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_ScotlandRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Senegal' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Serbia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Seychelles' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SierraLeone' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Singapore' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Slovakia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Slovenia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SolomonIsland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Somalia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SouthAfrica' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SouthAmerica' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SouthCarolina' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SouthDakota' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SouthEuropeanRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SouthKorea' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Spain' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SpainProvinces' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_SriLanka' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Sudan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Suriname' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Swaziland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Sweden' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Switzerland' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Syria' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Taiwan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Tajikistan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Tanzania' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Tennessee' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Texas' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Thailand' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Tibet' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Togo' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Tonga' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_TrinidadandTobago' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Tunisia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Turkey' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Turkmenistan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Tuvalu' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_UAE' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Uganda' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_UK' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_UK7' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Ukraine' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Uruguay' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_USA' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_USACentralRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_USANorthEastRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_USANorthWestRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_USARegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_USASouthEastRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_USASouthWestRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Utah' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Uzbekistan' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Vanuatu' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_VaticanCity' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Venezuela' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Vermont' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Vietnam' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Virginia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Wales' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Washington' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_WesternSahara' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_WestEuropeanRegion' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_WestVirginia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Wisconsin' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_World' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_World8' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_WorldwithCountries' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Wyoming' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Yemen' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_YukonTerritory' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Zambia' => { 'display' => 'fusion', 'hidden' => true },
        'FCMap_Zimbabwe' => { 'display' => 'fusion', 'hidden' => true }
    }
end
