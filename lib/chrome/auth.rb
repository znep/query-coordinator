require 'core/auth/client'

module Chrome
  class Auth
    def initialize(domain, email, password)
      @domain = domain
      @email = email
      @password = password
    end

    def authenticate
      auth = Core::Auth::Client.new(@domain, email: @email, password: @password)
      fail('Authentication failed') unless auth.logged_in?
      auth
    end
  end
end
