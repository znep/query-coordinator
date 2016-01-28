# Provides functions mapping a given column to a card type.
module CardTypeMapping

  include CommonMetadataTransitionMethods

  # This cardinality threshold is only used by the 'new' way
  # to compute default and available card types, not the old way.
  CARDINALITY_THRESHOLD = 35

  def card_type_for(column, logical_datatype_key, dataset_size=nil)
    default_card_type_for(column, dataset_size)
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
    # the threshold.
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
        card_type = 'histogram'
      when 'number'
        if has_georegion_computation_strategy?(column)
          card_type = 'choropleth'
        else
          card_type = 'histogram'
        end
      when 'point'
        card_type = 'feature'
      when 'text'
        if has_georegion_computation_strategy?(column)
          card_type = 'choropleth'
        # See: https://socrata.atlassian.net/browse/CORE-4755
        elsif dataset_size <= 10
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
        available_card_types = ['column', 'search', 'histogram']
      when 'number'
        if has_georegion_computation_strategy?(column)
          available_card_types = ['choropleth']
        else
          available_card_types = ['histogram', 'column', 'search']
        end
      when 'point'
        available_card_types = ['feature', 'choropleth']
      when 'text'
        if has_georegion_computation_strategy?(column)
          available_card_types = ['choropleth']
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
    computation_strategy_type = column.try(:[], :computationStrategy).try(:[], :strategy_type)

    (computation_strategy_type.present? &&
      (computation_strategy_type == 'georegion_match_on_string' ||
      computation_strategy_type == 'georegion_match_on_point'))
  end

  def is_low_cardinality?(cardinality, dataset_size)
    (cardinality > 1) && (cardinality < CARDINALITY_THRESHOLD) && (cardinality != dataset_size)
  end
end
