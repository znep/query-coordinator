require 'addressable/uri'
require 'httparty'
require 'nokogiri'

module Core
  module Auth
    class Client
      class << self

        # Creates a new Core::Auth::Client
        #
        # @param domain [String]
        # @param [Hash] options
        # @param options [String] :email
        # @param options [String] :password
        # @param options [String] :cookie An existing auth cookie
        # @param options [String] :auth_token An existing auth token
        # @param options [Boolean] :verify_ssl_cert Skip SSL verifification
        def new(host, options)
          client_class = Class.new(AbstractClient) do |klass|
            url_host = host.dup
            if options[:port]
              url_host << ":#{options[:port]}"
            elsif url_host.start_with?('localhost')
              url_host << ':9443'
            end
            url_host = "https://#{url_host}" unless url_host.start_with?('http')
            uri = Addressable::URI.parse(url_host).to_s
            klass.base_uri(uri)
          end
          client_class.new(options)
        end

      end

      class AbstractClient
        include HTTParty
        attr_reader :cookie, :verify_ssl_cert, :auth_token

        def initialize(options = {})
          @verify_ssl_cert = options[:verify_ssl_cert]
          @cookie = options[:cookie]
          @auth_token = options[:auth_token]
          @expires_at = nil
          login(options[:email], options[:password]) unless @cookie
        end

        # @return [Hash]
        def current_user
          self.class.get('/users/current.json', headers: {'Cookie' => cookie}, verify: verify_ssl_cert)
        end

        def logged_in?
          current_user.include?('id')
        end

        def update_expire_time!
          response = self.class.get('/api/sessionExpiration/current.json', headers: {'Cookie' => cookie}, verify: verify_ssl_cert)
          @expires_at = if response.include?('error') || response.include?('expired')
                          Time.at(0) # beginning of time; should be earlier than any possible Time.now
                        else
                          Time.now + JSON.parse(response.body)['seconds']
                        end
        end

        def expired?
          update_expire_time! if @expires_at.nil?
          Time.now > @expires_at
        end

        # Allows login with different credentials
        #
        # @param email [String]
        # @param password [String]
        # @return [Core::Auth::Client]
        def login(email, password)
          login_page = self.class.get('/login', verify: verify_ssl_cert)
          @auth_token = begin
            dom = Nokogiri::XML(login_page.body)
            csrf_token_element = dom.css('//meta[name=csrf-token]')[0]

            err_msg = "Error: #{self.class.base_uri} is not a Socrata site; cannot login"
            raise err_msg if csrf_token_element.nil?
            csrf_token_element.attribute('content').value
          end
          login_response = self.class.post(
            '/user_sessions',
            body: {
              'user_session[login]' => email,
              'user_session[password]' => password,
              'authenticity_token' => auth_token
            },
            headers: {
              'Cookie' => [
                "socrata-csrf-token=#{auth_token}",
                login_page.headers['Set-Cookie']
              ].join('; ')
            },
            verify: verify_ssl_cert
          )
          @cookie = login_response.request.options[:headers]['Cookie']
          update_expire_time!
          self
        end
      end
    end
  end
end
