# Provides functions mapping a given column to a card type.
module CardTypeMapping

  CARD_TYPE_MAPPING = JSON.parse(IO.read(
    File.join(Rails.root, 'lib', 'data', 'card-type-mapping.json')
  ))

  # For convenience, visualizations can be defined in card-type-mapping.json as a plain string,
  # instead of as an object with [type, onlyIf, defaultIf] keys. This normalizes strings into the
  # object representation (objects with just a type key).
  CARD_TYPE_MAPPING['map'].each do |physicalDatatype, visualization_definitions|
    visualization_definitions.map! do |visualization_definition|
      if visualization_definition.is_a?(String)
        { 'type' => visualization_definition }
      else
        visualization_definition
      end
    end
  end

  # Given dataset column metadata and a dataset size (row count), returns
  # a sensible default cardType or nil if none cound be determined
  # (unsupported physical datatype, all visualizations did not pass onlyIf,
  # column is below minimum cardinality).
  def card_type_for(column, dataset_size=nil)
    mapping = CARD_TYPE_MAPPING['map'].try(:[], column[:physicalDatatype])

    unless mapping
      Rails.logger.error(
        "No card mapping specified in card-type-mapping.json for physicalDatatype: #{column[:physicalDatatype]}")
      return nil
    end

    cardinality_min = CARD_TYPE_MAPPING['cardinality']['min']
    return nil unless column.fetch(:cardinality, FALLBACK_CARDINALITY) >= cardinality_min

    # Get rid of visualizations that fail their onlyIf check.
    enabled_visualizations = mapping.keep_if do |visualization_definition|
      visualization_type_enabled(column, dataset_size, visualization_definition)
    end

    return nil if enabled_visualizations.empty?

    # Sort visualizations in this order:
    # 1) defaultIf evaluates to true.
    # 2) no defaultIf expression specified.
    # 3) defaultIf evaluates to false.
    enabled_visualizations.sort_by! do |visualization_definition|
      if visualization_definition.include?('defaultIf')
        expression_holds = compute_expression_value_for_column(
          column,
          dataset_size,
          visualization_definition['defaultIf'])

        # If the condition holds, treat as top priority.
        # Otherwise, lowest priority.
        expression_holds ? 0 : 2
      else
        1 # No condition specified. Goes in middle of priority.
      end
    end

    enabled_visualizations.first['type']

  end

  private
  FALLBACK_CARDINALITY = 9007199254740992; # (max safe js int).

  def visualization_type_enabled(column, dataset_size, visualization_definition)
    
    if visualization_definition.include?('onlyIf')
      return compute_expression_value_for_column(column, dataset_size, visualization_definition['onlyIf'])
    else
      return true
    end

  end

  def compute_expression_value_for_column(column, dataset_size, expression)
    cardinality_threshold = CARD_TYPE_MAPPING['cardinality']['threshold']
    cardinality_min = CARD_TYPE_MAPPING['cardinality']['min']

    column_cardinality = column.fetch(:cardinality, FALLBACK_CARDINALITY)
    column_computation_strategy = column[:computationStrategy]

    case expression
      when 'isHighCardinality'
        column_cardinality >= cardinality_threshold || dataset_size == column_cardinality
      when 'isLowCardinality'
        (column_cardinality < cardinality_threshold &&
         column_cardinality >= cardinality_min) &&
        (dataset_size != column_cardinality)
      when 'isGeoregionComputed'
        (column_computation_strategy === 'georegion_match_on_string' ||
         column_computation_strategy === 'georegion_match_on_point')
      else
        raise "Unknown expression value in card-type-mapping.json: #{expression} for physicalDatatype: #{column[:physicalDatatype]}"
    end

  end

end
