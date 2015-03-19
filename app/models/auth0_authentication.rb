class Auth0Authentication
  attr_accessor :token, :user, :response

  def initialize(token)
    @token = token
    load
  end

  def authenticated?
    return false if @user.nil?
    return @user.auth0IdentifierId.nil?
  end

protected
  def load
    uri = UserSession.auth_uri.clone
    uri.query = 'method=authenticateFederatedAuth0User'
    post = Net::HTTP::Post.new(uri.request_uri)
    post['X-Socrata-Host'] = CurrentDomain.cname
    post.form_data = {'token' => token}

    @response = Net::HTTP.start(uri.host, uri.port) do |http|
      http.request post
    end

    if @response.is_a?(Net::HTTPSuccess)
      @user = User.parse(response.body)
      Rails.logger.info("User: #{@user}")
    end
  end
end
