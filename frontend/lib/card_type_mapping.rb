# Provides functions mapping a given column to a card type.
module CardTypeMapping

  include CommonMetadataTransitionMethods

  # This cardinality threshold is only used by the 'new' way
  # to compute default and available card types, not the old way.
  CARDINALITY_THRESHOLD = 35

  def default_card_type_for(column, dataset_size = nil, is_derived_view = false)
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
    # the threshold.
    unless cardinality.present?
      cardinality = CARDINALITY_THRESHOLD + 1
    end

    case physical_datatype
      when 'boolean' then card_type = 'column'
      when 'calendar_date', 'date' then card_type = 'timeline'
      when 'fixed_timestamp' then card_type = 'timeline'
      when 'floating_timestamp' then card_type = 'timeline'
      when 'geo_entity' then card_type = 'feature'
      when 'money' then card_type = 'histogram'
      when 'number' then card_type = has_georegion_computation_strategy?(column) ? 'choropleth' : 'histogram'
      when 'point', 'location' then card_type = 'feature'
      when 'multiline', 'line' then card_type = 'invalid'
      when 'multipolygon', 'polygon' then card_type = 'invalid'
      when 'text', 'url'
        if has_georegion_computation_strategy?(column)
          card_type = 'choropleth'
        # See: https://socrata.atlassian.net/browse/CORE-4755
        elsif dataset_size <= 10
          card_type = 'column'
        elsif is_low_cardinality?(cardinality, dataset_size)
          card_type = 'column'
        elsif is_derived_view
          card_type = 'column'
        else
          card_type = 'search'
        end

      else
        error_message = "Could not determine card type: invalid " \
          "physicalDatatype '#{physical_datatype.inspect}' on column #{column.inspect}."
        Airbrake.notify(
          :error_class => 'UnrecognizedPhysicalDatatypeError',
          :error_message => error_message
        )
        Rails.logger.error(error_message)
        card_type = 'invalid'
    end

    card_type
  end

  def available_card_types_for(column, dataset_size, is_derived_view=false)
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
      when 'calendar_date'
        available_card_types = ['timeline']
      when 'fixed_timestamp'
        available_card_types = ['timeline']
      when 'floating_timestamp'
        available_card_types = ['timeline']
      when 'geo_entity'
        available_card_types = ['feature']
      when 'money'
        if is_derived_view
          available_card_types = ['column', 'histogram']
        else
          available_card_types = ['column', 'search', 'histogram']
        end
      when 'number'
        if has_georegion_computation_strategy?(column)
          available_card_types = ['choropleth']
        elsif is_derived_view
          available_card_types = ['histogram', 'column']
        else
          available_card_types = ['histogram', 'column', 'search']
        end
      when 'point'
        available_card_types = ['feature', 'choropleth']
      when 'text'
        if has_georegion_computation_strategy?(column)
          available_card_types = ['choropleth']
        elsif is_derived_view
          available_card_types = ['column']
        else
          available_card_types = ['column', 'search']
        end
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

  private

  def has_georegion_computation_strategy?(column)
    # Phidippides returns strategy_type in its computation strategies, Core returns type in
    # its computation strategies. As of 1/2017, the only data lenses using the Core
    # computation strategies are data lenses created from derived views, since they can't use
    # Phidippides
    computation_strategy_type = column.dig(:computationStrategy, :strategy_type) ||
      column.dig(:computationStrategy, :type)

    (computation_strategy_type.present? &&
      (computation_strategy_type == 'georegion_match_on_string' ||
      computation_strategy_type == 'georegion_match_on_point'))
  end

  def is_low_cardinality?(cardinality, dataset_size)
    (cardinality > 1) && (cardinality < CARDINALITY_THRESHOLD) && (cardinality != dataset_size)
  end
end
