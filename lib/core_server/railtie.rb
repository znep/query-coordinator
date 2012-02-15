require 'rails'

module CoreServer
  class Railtie < Rails::Railtie

    initializer "core_server.log_runtime" do |app|
      require 'core_server/railties/controller_runtime'
      ActiveSupport.on_load(:action_controller) do
        include CoreServer::Railties::ControllerRuntime
      end
    end
  end
end
