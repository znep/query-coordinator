# This is only used for listing the auth0 identifiers on the user's profile page

class Auth0Identifier < Model
  def delete_path
    "/auth0_identifiers/#{identifier}"
  end
end
