module CardTypeMapping
  CARD_TYPE_MAPPING = JSON.parse(IO.read(
    File.join(Rails.root, 'lib', 'data', 'card-type-mapping.json')
  ))

  def card_type_for(column)
    mapping = CARD_TYPE_MAPPING['map'].try(:[], column[:logicalDatatype]).
      try(:[], column[:physicalDatatype])

    if mapping
      if column[:cardinality].is_a?(Numeric)
        if column[:cardinality] >= CARD_TYPE_MAPPING['cardinality']['min']
          if column[:cardinality] < CARD_TYPE_MAPPING['cardinality']['threshold']
            mapping['lowCardinalityDefault']
          else
            mapping['highCardinalityDefault']
          end
        end
      else
        mapping['lowCardinalityDefault']
      end
    end
  end
end
