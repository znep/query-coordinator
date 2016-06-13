class ImageComponent

  # component data will look like:
  # {
  #   type: 'image',
  #   value: {
  #     documentId: "1234",
  #     url: "https://bucket-name.s3.amazonaws.com/uploads/random/image.jpg"
  #   }
  # }
  # For getty images, 'documentId' will be null.
  def initialize(component_data)
    @component_data = component_data
  end

  def alt_text
    component_value['alt']
  end

  def url(size = nil)
    has_thumbnails? ? document.canonical_url(size) : image_url
  end

  def has_thumbnails?
    document.present? && document.processed?
  end

  private

  def component_value
    @component_data['value']
  end

  def document_id
    component_value['documentId'] if component_value.present?
  end

  def image_url
    component_value['url'] if component_value.present?
  end

  def document
    @document ||= if document_id.present?
      Document.find_by_id(document_id)
    elsif image_url =~ %r{getty-images/(.+)}
      GettyImage.find_by_getty_id($1).try(:document)
    else
      nil
    end
  end
end
