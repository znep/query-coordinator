class UserLink < Model
  cattr_accessor :link_types, :new_link_types
  
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
  
# TODO/v4: Remove this crap. BTW who forgot friendster?
  @@link_types = [
    ["MY_COMPANY", "My Company / Organization"],
    ["BLOG", "My Blog"],
    ["MY_SITE", "My Website (personal)"],
    ["DOC_STOCK", "docstoc"],
    ["FACEBOOK", "Facebook"],
    ["FLICKR", "flickr"],
    ["FRIEND_FEED", "FriendFeed"],
    ["LINKED_IN", "LinkedIn"],
    ["MYSPACE", "MySpace"],
    ["SLIDESHARE", "Slideshare"],
    ["TWITTER", "Twitter"],
    ["YOUTUBE", "YouTube"],
    ["SCRIBD", "Scribd"],
    ["GOVLOOP", "GovLoop"]
  ]

  @@new_link_types = [
    ["MY_SITE", "My Site"],
    ["BLOG", "My Blog"],
    ["TWITTER", "Twitter"],
    ["FACEBOOK", "Facebook"],
    ["FLICKR", "Flickr"],
    ["OTHER", "Other"]
  ]
  
end
