module CoreServer
  class Base

    def self.connection
      @@connection ||= CoreServer::Connection.new(Rails.logger)
    end
  end
end
