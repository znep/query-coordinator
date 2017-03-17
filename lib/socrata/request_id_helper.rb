module Socrata
  module RequestIdHelper

    module_function

    def current_request_id=(request_id)
      Thread.current[:request_id] = request_id
    end

    def current_request_id
      Thread.current[:request_id]
    end

  end
end
