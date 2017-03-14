class RpxAuthentication
  attr_accessor :token, :user, :response

  def initialize(token)
    @token = token
    load
  end

  def existing_account?
    return false if @user.nil?
    return @user.openIdIdentifierId.nil?
  end

protected
  def load
    uri = UserSession.auth_uri.clone
    uri.query = "method=findOrCreateByRpxToken"
    post = Net::HTTP::Post.new(uri.request_uri)
    post['X-Socrata-Host'] = CurrentDomain.cname
    post.form_data = {'token' => token}

    @response = Net::HTTP.start(uri.host, uri.port) do |http|
      http.request post
    end

    if @response.is_a?(Net::HTTPSuccess) || @response.is_a?(Net::HTTPNotFound)
      @user = User.parse(response.body)
    end
  end
end
