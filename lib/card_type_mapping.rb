# Provides functions mapping a given column to a card type.
module CardTypeMapping

  include CommonMetadataTransitionMethods

  CARD_TYPE_MAPPING = JSON.parse(IO.read(
    File.join(Rails.root, 'lib', 'data', 'card-type-mapping.json')
  ))

  # This cardinality threshold is only used by the 'new' way
  # to compute default and available card types, not the old way.
  CARDINALITY_THRESHOLD = 35

  def card_type_for(column, logical_datatype_key, dataset_size=nil)
    if metadata_transition_phase_3?
      default_card_type_for(column, dataset_size)
    else
      old_card_type_for(column, logical_datatype_key, dataset_size)
    end
  end

  def default_card_type_for(column, dataset_size)
    physical_datatype = column.try(:[], :physicalDatatype)

    unless physical_datatype.present?
      error_message = "Could not determine card type: physicalDatatype " \
        "property not present on column '#{column.inspect}'."
      Airbrake.notify(
        :error_class => 'NoPhysicalDatatypeError',
        :error_message => error_message
      )
      Rails.logger.error(error_message)
      return 'invalid'
    end

    cardinality = column.try(:[], :cardinality)
    # If cardinality information is not present, assume it is larger than
    # the threshnold.
    unless cardinality.present?
      cardinality = CARDINALITY_THRESHOLD + 1
    end

    case physical_datatype
      when 'boolean'
        card_type = 'column'
      when 'fixed_timestamp'
        card_type = 'timeline'
      when 'floating_timestamp'
        card_type = 'timeline'
      when 'geo_entity'
        card_type = 'feature'
      when 'money'
        if is_low_cardinality?(cardinality, dataset_size)
          card_type = 'column'
        else
          if histogram_supported?
            card_type = 'histogram'
          else
            card_type = 'search'
          end
        end
      when 'number'
        if has_georegion_computation_strategy?(column)
          card_type = 'choropleth'
        elsif is_low_cardinality?(cardinality, dataset_size)
          card_type = 'column'
        else
          if histogram_supported?
            card_type = 'histogram'
          else
            card_type = 'search'
          end
        end
      when 'point'
        card_type = 'feature'
      when 'text'
        # See: https://socrata.atlassian.net/browse/CORE-4755
        if dataset_size <= 10
          card_type = 'column'
        elsif is_low_cardinality?(cardinality, dataset_size)
          card_type = 'column'
        else
          card_type = 'search'
        end
      when 'multiline'
        card_type = 'invalid'
      when 'multipolygon'
        card_type = 'invalid'
      else
        error_message = "Could not determine card type: invalid " \
          "physicalDatatype '#{physical_datatype.inspect}' on column #{column.inspect}."
        Airbrake.notify(
          :error_class => 'UnrecognizedPhysicalDatatypeError',
          :error_message => error_message
        )
        Rails.logger.error(error_message)
        return 'invalid'
    end

    card_type
  end

  def available_card_types_for(column, dataset_size)
    physical_datatype = column.try(:[], :physicalDatatype)

    unless physical_datatype.present?
      error_message = "Could not determine card type: physicalDatatype " \
        "property not present on column '#{column.inspect}'."
      Airbrake.notify(
        :error_class => 'NoPhysicalDatatypeError',
        :error_message => error_message
      )
      Rails.logger.error(error_message)
      return ['invalid']
    end

    cardinality = column.try(:[], :cardinality)
    # If cardinality information is not present, assume it is very large
    unless cardinality.present?
      cardinality = CARDINALITY_THRESHOLD + 1
    end

    case physical_datatype
      when 'boolean'
        available_card_types= ['column']
      when 'fixed_timestamp'
        available_card_types = ['timeline']
      when 'floating_timestamp'
        available_card_types = ['timeline']
      when 'geo_entity'
        available_card_types = ['feature']
      when 'money'
        if histogram_supported?
          available_card_types = ['column', 'histogram']
        else
          available_card_types = ['column', 'search']
        end
      when 'number'
        if has_georegion_computation_strategy?(column)
          available_card_types = ['choropleth']
        else
          if histogram_supported?
            available_card_types = ['column', 'histogram']
          else
            available_card_types = ['column', 'search']
          end
        end
      when 'point'
        available_card_types = ['feature']
      when 'text'
        available_card_types = ['column', 'search']
      when 'multipolygon'
        available_card_types = ['invalid']
      when 'multiline'
        available_card_types = ['invalid']
      else
        error_message = "Could not determine available card types: " \
          "invalid physicalDatatype '#{physical_datatype.inspect}' on column #{column.inspect}."
        Airbrake.notify(
          :error_class => 'UnrecognizedPhysicalDatatypeError',
          :error_message => error_message
        )
        Rails.logger.error(error_message)
        return ['invalid']
    end

    available_card_types
  end

  # Deprecated method to determine default card type.

  def old_card_type_for(column, logical_datatype_key, dataset_size)
    mapping = CARD_TYPE_MAPPING['map'].try(:[], column[logical_datatype_key]).
      try(:[], column[:physicalDatatype])

    if mapping
      if column[:cardinality].is_a?(Numeric)
        # We only want cards for items with a cardinality that is interesting (it's boring if all
        # the values are the same)
        if column[:cardinality] >= CARD_TYPE_MAPPING['cardinality']['min']
          card_type = begin
            if column[:cardinality] < CARD_TYPE_MAPPING['cardinality']['threshold']
              mapping['lowCardinalityDefault']
            else
              mapping['highCardinalityDefault']
            end
          end
          # Don't create a card if it's a column chart where every datapoint is different (which
          # makes for a very uninteresting (ie flat) column chart.)
          if card_type == 'column' && column[:cardinality] >= dataset_size
            nil
          else
            card_type
          end
        end
      else
        mapping['lowCardinalityDefault']
      end
    end
  end

  private

  def histogram_supported?
    FeatureFlags.derive(nil, defined?(request) ? request : nil)[:odux_enable_histogram]
  end

  def has_georegion_computation_strategy?(column)
    computation_strategy_type = column.try(:[], :computationStrategy).try(:[], :strategy_type)

    (computation_strategy_type.present? &&
      (computation_strategy_type == 'georegion_match_on_string' ||
      computation_strategy_type == 'georegion_match_on_point'))
  end

  def is_low_cardinality?(cardinality, dataset_size)
    (cardinality > 1) && (cardinality < CARDINALITY_THRESHOLD) && (cardinality != dataset_size)
  end
end
