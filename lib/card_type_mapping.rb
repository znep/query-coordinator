# Provides functions mapping a given column to a card type.
class CardTypeMapping

  attr_reader :config

  DEFAULT_CARD_TYPE_MAPPING = JSON.parse(IO.read(
    File.join(Rails.root, 'lib', 'data', 'card-type-mapping.json')
  ))

  # TODO document the format.
  def initialize(config = DEFAULT_CARD_TYPE_MAPPING)
    @config = config.with_indifferent_access
    raise 'Configuration object must have a "map" key' unless @config.include?(:map)
    raise 'Configuration object must have an indexable object under the "map" key' unless @config[:map].respond_to?(:[])
    raise 'Configuration object must have a "cardinality" key' unless @config.include?(:cardinality)
    raise 'Configuration object cardinality configuration must have the "threshold" key' unless @config[:cardinality].include?(:threshold)
    raise 'Configuration object cardinality configuration must have the "min" key' unless @config[:cardinality].include?(:min)
  end

  # Given dataset column metadata and a dataset size (row count), returns
  # a sensible default cardType or nil if none cound be determined
  # (unsupported physical datatype, all visualizations did not pass onlyIf,
  # column is below minimum cardinality).
  #TODO rename to column_metadata
  def card_type_for(column, dataset_size=nil)
    mapping = config[:map][column[:physicalDatatype]]

    unless mapping
      Rails.logger.error(
        "No card mapping specified in card-type-mapping.json for physicalDatatype: #{column[:physicalDatatype]}")
      return nil
    end

    cardinality_min = config[:cardinality][:min]
    #TODO put in config.
    return nil unless column.fetch(:cardinality, FALLBACK_CARDINALITY) >= cardinality_min

    # Get rid of visualizations that fail their onlyIf check.
    enabled_visualizations = mapping.select do |visualization_definition|
      visualization_type_enabled(column, dataset_size, visualization_definition)
    end

    return nil if enabled_visualizations.empty?

    # Sort visualizations in this order:
    # 1) defaultIf evaluates to true.
    # 2) no defaultIf expression specified.
    # 3) defaultIf evaluates to false.
    enabled_visualizations.sort_by! do |visualization_definition|
      # TODO factor out like onlyIf
      if visualization_definition.include?('defaultIf')
        expression_holds = compute_expression_value_for_column(
          column,
          dataset_size,
          visualization_definition['defaultIf'])

        # If the condition holds, treat as top priority (0).
        # Otherwise, lowest priority (2).
        expression_holds ? 0 : 2
      else
        1 # No condition specified. Goes in middle of priority.
      end
    end

    enabled_visualizations.first['type']

  end

  private

  def mapping
    config['map']
  end

  def cardinality_min
    config['cardinality']['min']
  end

  def cardinality_threshold
    config['cardinality']['threshold']
  end

  FALLBACK_CARDINALITY = 9007199254740992 # (max safe js int).

  def visualization_type_enabled(column, dataset_size, visualization_definition)
    if visualization_definition.include?('onlyIf')
      compute_expression_value_for_column(column, dataset_size, visualization_definition['onlyIf'])
    else
      true
    end
  end

  def compute_expression_value_for_column(column, dataset_size, expression)
    cardinality_threshold = config[:cardinality][:threshold]
    cardinality_min = config[:cardinality][:min]

    column_cardinality = column.fetch(:cardinality, FALLBACK_CARDINALITY)
    column_computation_strategy = column[:computationStrategy]

    case expression
      when 'isHighCardinality'
        column_cardinality >= cardinality_threshold || dataset_size == column_cardinality
      when 'isLowCardinality'
        (cardinality_min...cardinality_threshold).include?(column_cardinality) &&
        column_cardinality != dataset_size
      when 'isGeoregionComputed'
        %w(georegion_match_on_string georegion_match_on_point).include?(column_computation_strategy)
      else
        raise "Unknown expression value in card-type-mapping.json: #{expression} for physicalDatatype: #{column[:physicalDatatype]}"
    end

  end

end
