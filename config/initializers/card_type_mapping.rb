CARD_TYPE_MAPPING = JSON(
  File.read(
    File.join(Rails.root, 'lib', 'data', 'card-type-mapping.json')
  )
)
