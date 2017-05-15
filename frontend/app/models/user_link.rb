class UserLink < Model
  cattr_accessor :link_types

  def self.find(user_id)
    path = "/users/#{user_id}/links.json"
    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.create(user_id, attributes)
    path = "/users/#{user_id}/links.json"
    return parse(CoreServer::Base.connection.create_request(path, attributes.to_json))
  end

  def self.update(user_id, id, attributes)
    path = "/users/#{user_id}/links/#{id}.json"
    return parse(CoreServer::Base.connection.update_request(path, attributes.to_json))
  end

  def self.delete(user_id, id)
    path = "/users/#{user_id}/links/#{id}.json"
    return parse(CoreServer::Base.connection.delete_request(path))
  end

  @@link_types = [
    ["MY_COMPANY", 'my_company'],
    ["MY_SITE", 'my_site'],
    ["BLOG", 'my_blog'],
    ["TWITTER", 'twitter'],
    ["FACEBOOK", 'facebook'],
    ["FLICKR", 'flickr'],
    ["OTHER", 'other']
  ]

end
