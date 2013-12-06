class Attachment < Model
  def href(view_id)
    data['assetId'].present? ? "/api/views/#{view_id}/files/#{assetId}?download=true" : "/api/assets/#{blobId}?download=true"
  end
  
  def displayName
    data['name'].present? ? data['name'] : data['filename']
  end
end
