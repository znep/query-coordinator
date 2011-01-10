class AppToken < Model
  def self.find(user_id)
    path = "/users/#{user_id}/app_tokens.json"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.find_by_id(user_id, token_id)
    path = "/users/#{user_id}/app_tokens/#{token_id}"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.create(user_id, attributes)
    path = "/users/#{user_id}/app_tokens.json"
    return parse(CoreServer::Base.connection.create_request(path, attributes.to_json))
  end

  def self.delete(user_id, id)
    path = "/users/#{user_id}/app_tokens/#{id}"
    return parse(CoreServer::Base.connection.delete_request(path))
  end

  def thumbnail_url(size='thumb')
    if data['thumbnailSha'].nil?
      return
    end
    # Nil size means no geometry, get full image
    opts = { :size => size }
    "/api/file_data/#{data['thumbnailSha']}?#{opts.to_param}"
  end

  def set_thumbnail_url(user_id)
    "/api/users/#{user_id}/app_tokens?method=setThumbnail&id=#{data['id']}"
  end
end
