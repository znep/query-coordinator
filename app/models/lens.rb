class Lens < Model
  def is_shared?
    permissions.any? {|p| p.isEnabled && !p.isPublic}
  end

  def self.find( options )
    user_id = User.current_user.id.to_s
    if !options['userId'].nil?
      user_id = options['userId']
      options.delete('userId')
    end

    path = nil
    if options.is_a? Hash
      path = "/Users/#{user_id}/#{self.name.pluralize}.json?" +
        options_string(options)
    else
      path = "/Users/#{user_id}/#{self.name.pluralize}/#{options}.json"
    end

    send_request(path)
  end

end
