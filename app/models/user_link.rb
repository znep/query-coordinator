class UserLink < Model
  cattr_accessor :link_types
  
  def self.find(user_id)
    path = "/users/#{user_id}/links.json"
    get_request(path)
  end

  def self.create(user_id, attributes)
    path = "/users/#{user_id}/links.json"
    return self.create_request(path, JSON.generate(attributes))
  end

  def self.update(user_id, id, attributes)
    path = "/users/#{user_id}/links/#{id}.json"
    return self.update_request(path, JSON.generate(attributes))
  end
  
  def self.delete(user_id, id)
    path = "/users/#{user_id}/links/#{id}.json"
    return self.delete_request(path)
  end
  
  @@link_types = [
    ["MY_COMPANY", "My Company"],
    ["BLOG", "My Blog"],
    ["MY_SITE", "My Website (personal)"],
    ["DOC_STOCK", "DockStock"],
    ["FACEBOOK", "Facebook"],
    ["FLICKR", "flickr"],
    ["FRIEND_FEED", "FriendFeed"],
    ["LINKED_IN", "LinkedIn"],
    ["MYSPACE", "MySpace"],
    ["SLIDESHARE", "Slideshare"],
    ["TWITTER", "Twitter"],
    ["YOUTUBE", "YouTube"]
  ]
  
end