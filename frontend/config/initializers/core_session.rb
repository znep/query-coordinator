module ActionDispatch
  class Request < Rack::Request
    def core_session
      @env['socrata.core-session']
    end

    def core_session=(session)
      @env['socrata.core-session'] = session
    end

    def reset_core_session
      @env['socrata.core-session'].try(:clear!)
    end
  end
end
