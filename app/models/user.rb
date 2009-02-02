class User < Model
  def displayName
    # TODO: This needs to respect privacy settings
    if !firstName.nil? && !lastName.nil?
      return firstName + " " + lastName
    end
    return login
  end
end
