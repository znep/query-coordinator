module ActionDispatch
  class Request < Rack::Request
    def core_session
      # TODO - this cannot work! CoreSession constructor requires two args
      @env['socrata.core-session'] ||= CoreSession.new
    end

    def core_session=(session)
      @env['socrata.core-session'] = session
    end

    def reset_core_session
      @env['socrata.core-session'].clear! if @env['socrata.core-session']
    end
  end
end
