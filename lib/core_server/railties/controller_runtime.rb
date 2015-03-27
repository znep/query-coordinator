require 'benchmark'
require 'active_support/concern'

module CoreServer
  module Railties
    module ControllerRuntime
      extend ActiveSupport::Concern

    protected

      def cleanup_view_runtime
        if Object.const_defined?("CoreServer")
          core_rt_before_render = ::CoreServer::Base.connection.reset_counters
          @core_requests = core_rt_before_render[:requests]
          runtime = super
          core_rt_after_render = ::CoreServer::Base.connection.reset_counters
          @core_runtime = core_rt_before_render[:runtime] + core_rt_after_render[:runtime]
          runtime - core_rt_after_render[:runtime]
        else
          super
        end
      end

      def append_info_to_payload(payload)
        super
        if Object.const_defined?("CoreServer")
          core_counters = ::CoreServer::Base.connection.reset_counters
          payload[:core_runtime] = (@core_runtime || 0) + core_counters[:runtime]
          payload[:core_requests] = (@core_requests || {}).merge(core_counters[:requests])


          if payload[:core_requests].any?{ |thread, count| too_many_core_server_requests(count) }
            # Raise an exception just for Hoptoad. Yes, that's ugly, but
            # getting the right data without doing it is uglier, and we're
            # likely to want to re-raise the exception regardless.
            begin
              raise CoreServer::TooManyRequests.new(self, action_name, core_counters[:requests][Thread.current.object_id])
            rescue CoreServer::TooManyRequests
              raise unless Rails.env.production?
            end
          end
        end
      end

    private

      def too_many_core_server_requests(requests)
        APP_CONFIG['max_core_server_requests'].present? &&
          (requests > APP_CONFIG['max_core_server_requests'])
      end

      module ClassMethods
        def total_requests(requests)
          requests.reduce(0){ |s, p| s + p.last }
        end

        def log_process_action(payload)
          messages, core_runtime, core_requests = super, payload[:core_runtime], payload[:core_requests]
          if core_runtime && core_runtime > 0
            messages << ("Core Server: %i req/%0.fms" % [total_requests(core_requests), core_runtime])
          end
          messages
        end
      end

    end
  end
end
