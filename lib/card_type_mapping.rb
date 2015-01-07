# Provides functions mapping a given column to a card type.
# See the documentation and schema in CardTypeMapping.js.
class CardTypeMapping

  attr_reader :config

  DEFAULT_CARD_TYPE_MAPPING = JSON.parse(IO.read(
    File.join(Rails.root, 'lib', 'data', 'card-type-mapping.json')
  ))

  # TODO document the format.
  def initialize(config = DEFAULT_CARD_TYPE_MAPPING)
    @config = config.with_indifferent_access
    unless @config.include?(:map)
      raise(ArgumentError.new('Configuration object must have a "map" key'))
    end
    unless @config[:map].respond_to?(:[])
      raise(ArgumentError.new('Configuration object must have an indexable object under the "map" key'))
    end
    unless @config.include?(:cardinality)
      raise(ArgumentError.new('Configuration object must have a "cardinality" key'))
    end
    unless @config[:cardinality].include?(:threshold)
      raise(ArgumentError.new('Configuration object cardinality configuration must have the "threshold" key'))
    end
    unless @config[:cardinality].include?(:min)
      raise(ArgumentError.new('Configuration object cardinality configuration must have the "min" key'))
    end
    unless @config[:cardinality].include?(:default)
      raise(ArgumentError.new('Configuration object cardinality configuration must have the "default" key'))
    end
  end

  # Given dataset column metadata and a dataset size (row count), returns
  # a sensible default cardType or nil if none cound be determined
  # (unsupported physical datatype, all visualizations did not pass onlyIf,
  # column is below minimum cardinality).
  def card_type_for(column_metadata, dataset_size=nil)
    mapping = config[:map][column_metadata[:physicalDatatype]]

    unless mapping
      Rails.logger.error(
        "No card mapping specified in card-type-mapping.json for physicalDatatype: #{column_metadata[:physicalDatatype]}")
      return nil
    end

    cardinality_min = config[:cardinality][:min]
    return nil unless column_metadata.fetch(:cardinality, config[:cardinality][:default]) >= cardinality_min

    # Get rid of visualizations that fail their onlyIf check.
    enabled_visualizations = mapping.select do |visualization_definition|
      visualization_type_enabled(column_metadata, dataset_size, visualization_definition)
    end

    return nil if enabled_visualizations.empty?

    # Sort visualizations in this order:
    # 1) defaultIf evaluates to true.
    # 2) no defaultIf expression specified.
    # 3) defaultIf evaluates to false.
    enabled_visualizations.sort_by!.with_index do |visualization_definition, index|
      primary_sort_by = if visualization_definition.include?('defaultIf')
        expression_holds = compute_expression_value_for_column(
          column_metadata,
          dataset_size,
          visualization_definition['defaultIf'])

        # If the condition holds, treat as top priority (0).
        # Otherwise, lowest priority (2).
        expression_holds ? 0 : 2
      else
        1 # No condition specified. Goes in middle of priority.
      end

      # We need a stable sort.
      [primary_sort_by, index]
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

  def visualization_type_enabled(column_metadata, dataset_size, visualization_definition)
    if visualization_definition.include?('onlyIf')
      compute_expression_value_for_column(column_metadata, dataset_size, visualization_definition['onlyIf'])
    else
      true
    end
  end

  def compute_expression_value_for_column(column_metadata, dataset_size, expression)
    cardinality_threshold = config[:cardinality][:threshold]
    cardinality_min = config[:cardinality][:min]

    column_cardinality = column_metadata.fetch(:cardinality, config[:cardinality][:default])
    column_computation_strategy = column_metadata[:computationStrategy]

    case expression
      when 'isHighCardinality'
        column_cardinality >= cardinality_threshold || dataset_size == column_cardinality
      when 'isLowCardinality'
        (cardinality_min...cardinality_threshold).include?(column_cardinality) &&
        column_cardinality != dataset_size
      when 'isGeoregionComputed'
        %w(georegion_match_on_string georegion_match_on_point).include?(column_computation_strategy)
      else
        raise(UnsupportedCardTypeMappingExpression.new(expression),
              "Unknown expression value in card-type-mapping.json: #{expression} for physicalDatatype: #{column_metadata[:physicalDatatype]}")
    end

  end

end

class UnsupportedCardTypeMappingExpression < StandardError
  def initialize(expression)
    @expression = expression
  end
end
