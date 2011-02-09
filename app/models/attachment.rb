class Attachment < Model
  def href
    return "/api/assets/#{blobId}"
  end
  
  def displayName
    data['name'].present? ? data['name'] : data['filename']
  end
end
