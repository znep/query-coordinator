# Provides functions mapping a given column to a card type.
module CardTypeMapping
  CARD_TYPE_MAPPING = JSON.parse(IO.read(
    File.join(Rails.root, 'lib', 'data', 'card-type-mapping.json')
  ))

  def card_type_for(column, logical_datatype_key, dataset_size=nil)
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
end
