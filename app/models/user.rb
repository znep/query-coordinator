class User < Model
  cattr_accessor :current_user
  attr_accessor :session_token

  def displayName
    # TODO: This needs to respect privacy settings
    if (flag?("guest"))
      return "Anonymous User"
    else
      if !firstName.nil? && !lastName.nil?
        return firstName + " " + lastName
      end
    end
    return login
  end

  def self.login(login,password)
    send_request("/authenticate/#{login}.json?password=#{password}")
  end
  
  def is_established?
    # An established user has 4 or more total blists.
    View.find(Hash.new).length > 3
  end
  
  # size can be "large", "medium", or "small"
  def profile_image(size = "large")
    "#{User.url.to_s}users/#{self.id}/profile_images/#{size}"
  end
end
