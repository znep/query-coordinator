require 'core/auth/client'

module Chrome
  class Auth
    def initialize(domain, email, password, verify_ssl_cert = true)
      @domain = domain
      @email = email
      @password = password
      @verify_ssl_cert = verify_ssl_cert
    end

    def authenticate
      Core::Auth::Client.new(@domain, email: @email, password: @password, verify_ssl_cert: @verify_ssl_cert).
        tap do |auth|
          fail('Authentication failed') unless auth.logged_in?
        end
    end
  end
end
