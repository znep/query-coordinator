class AuthorComponent < ImageComponent
  # component data will look like:
  # {
  #   type: "author",
  #   value: {
  #     blurb: '<p>Author blurb!</p>',
  #     image: {
  #       url: "https://sa-storyteller-cust-us-west-2-rc.s3.amazonaws.com/documents/uploads/000/000/743/original/mcdonalds.jpg?1464390559",
  #       documentId: 743
  #     }
  #   }
  # }

  def blurb_html
    component_value.try(:[], 'blurb').to_s
  end

  def image_alt_text
    image_component.try(:[], 'alt')
  end

  private

  # Overridden from ImageComponent
  def document_id
    image_component.try(:[], 'documentId')
  end

  # Overridden from ImageComponent
  def image_url
    image_component.try(:[], 'url')
  end

  private

  def image_component
    component_value.try(:[], 'image')
  end
end
