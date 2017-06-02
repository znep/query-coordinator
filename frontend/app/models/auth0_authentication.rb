
class Auth0Authentication
  attr_accessor :token, :user, :response, :error

  def initialize(token)
    @error = false
    @token = token
    load
  end

  def authenticated?
    return !(@user.nil?)
  end

protected
  def load
    uri = UserSessionProvider.klass.auth_uri.clone
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
    elsif @response.is_a?(Net::HTTPNotFound)
      Rails.logger.info("User not found")
    else
      Rails.logger.info("Unexpected response code from core (#{@response.code}). Did you try to log in as a deleted user via auth0?")
      @error = true
    end
  end
end
