class Metadata < Model
  def attachments
    data['attachments']
  end

  def custom_fields
    data['custom_fields']
  end
end
