class Attachment < Model
  def href
    return "/api/assets/#{blobId}?app_token=" + APP_CONFIG['app_token']
  end
  
  def displayName
    data['name'].present? ? data['name'] : data['filename']
  end
end
