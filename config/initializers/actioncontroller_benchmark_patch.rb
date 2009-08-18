require 'benchmark'

# Rewrite the benchmark code in ActionController to support logging CoreServer stuff
module ActionController
  module CoreServerBenchmarking
    def self.included(base)
      base.class_eval do
        alias_method :perform_action, :perform_action_without_benchmark
        alias_method :render, :render_without_benchmark
      end

      base.class_eval do
        alias_method_chain :perform_action, :core_benchmark
        alias_method_chain :render, :core_benchmark
      end
    end

    def perform_action_with_core_benchmark
      if logger
        ms = [Benchmark.ms { perform_action_without_core_benchmark }, 0.01].max
        logging_view          = defined?(@view_runtime)
        logging_active_record = Object.const_defined?("ActiveRecord") && ActiveRecord::Base.connected?
        logging_core_server   = Object.const_defined?("CoreServer")

        log_message  = 'Completed in %.0fms' % ms

        if logging_view || logging_active_record || logging_core_server
          log_message << " ("
          log_message << view_runtime if logging_view

          if logging_active_record
            log_message << ", " if logging_view
            log_message << active_record_runtime
          end

          if logging_core_server
            log_message << ", " if (logging_view || logging_active_record)
            log_message << core_server_runtime
          end

          log_message << ")"
        end

        log_message << " | #{response.status}"
        log_message << " [#{complete_request_uri rescue "unknown"}]"

        logger.info(log_message)
        response.headers["X-Runtime"] = "%.0f" % ms

      else
        perform_action_without_core_benchmark
      end
    end

    def render_with_core_benchmark(options = nil, extra_options = {}, &block)
      if logger
        if Object.const_defined?("ActiveRecord") && ActiveRecord::Base.connected?
          db_runtime = ActiveRecord::Base.connection.reset_runtime
        end

        if Object.const_defined?("CoreServer")
          core_runtime = CoreServer::Base.connection.reset_runtime
        end

        render_output = nil
        @view_runtime = Benchmark.ms { render_output = render_without_core_benchmark(options, extra_options, &block) }

        if Object.const_defined?("ActiveRecord") && ActiveRecord::Base.connected?
          @db_rt_before_render = db_runtime
          @db_rt_after_render = ActiveRecord::Base.connection.reset_runtime
          @view_runtime -= @db_rt_after_render
        end

        if Object.const_defined?("CoreServer")
          @core_rt_before_render = core_runtime
          @core_rt_after_render = CoreServer::Base.connection.reset_runtime
          @view_runtime -= @core_rt_after_render
        end

        render_output
      else
        render_without_core_benchmark(options, extra_options, &block)
      end
    end

    def core_server_runtime
      core_runtime = CoreServer::Base.connection.reset_runtime
      core_runtime += @core_rt_before_render if @core_rt_before_render
      core_runtime += @core_rt_after_render if @core_rt_after_render
      "Core Server: %.0f" % core_runtime
    end
  end
end

ActionController::Base.class_eval do
  include ActionController::CoreServerBenchmarking
end