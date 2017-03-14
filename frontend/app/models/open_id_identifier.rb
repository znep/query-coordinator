class OpenIdIdentifier < Model
  def self.create(user_id, rpx_token)
    path = "/users/#{user_id}/open_id_identifiers?rpx_token=#{rpx_token}"
    return parse(CoreServer::Base.connection.create_request(path))
  end

  def delete_path
    "/users/#{User.current_user.id}/open_id_identifiers/#{id}"
  end
end
