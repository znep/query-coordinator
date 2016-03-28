require 'core/auth/client'

module Chrome
  class Auth
    def initialize(domain, email, password)
      @domain = domain
      @email = email
      @password = password
    end

    def authenticate
      Core::Auth::Client.new(@domain, email: @email, password: @password).
        tap do |auth|
          fail('Authentication failed') unless auth.logged_in?
        end
    end
  end
end
