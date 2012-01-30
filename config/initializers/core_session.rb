module ActionDispatch
  class Request < Rack::Request
    def core_session
      @env['blist.core-session'] ||= CoreSession.new
    end

    def core_session=(session)
      @env['blist.core-session'] = session
    end

    def reset_core_session
      @env['blist.core-session'].clear! if @env['blist.core-session']
    end
  end
end

