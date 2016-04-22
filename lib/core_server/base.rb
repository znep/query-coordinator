module CoreServer
  class Base

    def self.connection
      @@connection ||= CoreServer::Connection.new(Rails.logger)
    end

    def self.connection=(conn)
      @@connection = conn
    end

  end
end
