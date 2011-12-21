require 'benchmark'


module ActionController
  # First, neuter the default logic that provides benchmarking.
  #
  # HACK: alias_method_chain is an abomination. It's pretty much impossible to
  # modify the logic in the benchmark code; we want to preserve most functionality
  # of the ActionController::Benchmarking class, but essentially remove the
  # benchmark from the render and perform_action chains. Unfortunately, there's no
  # good way to do that.
  #
  # You have to know that in the Rails initialization process, render is only
  # called once for alias_method_chain as part of the benchmarking, so we override
  # the render method directly to call render_without_benchmark. However,
  # perform_action is chained a 2nd time in the Rescue module; so instead we write
  # code that looks incorrect by redefining perform_action_without_rescue to call
  # perform_action_without_benchmark. If we overrode perform_action directly, we'd
  # lose a chunk of the alias_method_chain that provided things like rescue, flash
  # hashes, etc.
  #
  # This code will need to be maintained very carefully during Rails upgrades, at
  # least until we upgrade to Rails 3.0, which gets rid of alias_method_chain. For
  # more information:
  #
  # https://rails.lighthouseapp.com/projects/8994/tickets/285-alias_method_chain-limits-extensibility
  class Base
    def render(options = nil, extra_options = {}, &block)
      render_without_benchmark(options, extra_options, &block)
    end

    def perform_action_without_rescue
      perform_action_without_benchmark
    end
  end

  # Rewrite the benchmark code in ActionController to support logging CoreServer stuff
  module CoreServerBenchmarking
    def self.included(base)
      base.class_eval do
        alias_method_chain :perform_action, :core_benchmark
        alias_method_chain :render, :core_benchmark
      end
    end

    def perform_action_with_core_benchmark
      if logger
        ms = [Benchmark.ms { perform_action_without_core_benchmark }, 0.01].max
        logging_view          = defined?(@view_runtime)
        logging_core_server   = Object.const_defined?("CoreServer")

        log_message  = 'Completed in %.0fms' % ms

        if logging_view || logging_core_server
          log_message << " ("
          log_message << view_runtime if logging_view

          if logging_core_server
            core_stats = core_server_stats
            log_message << ", " if logging_view
            log_message << "Core Server: %i req/%.0f ms" % [total_requests(core_stats[:requests]), core_stats[:runtime]]
          end

          log_message << ")"
        end

        log_message << " | #{response.status}"
        log_message << " [#{complete_request_uri rescue "unknown"}]"

        logger.info(log_message)
        response.headers["X-Runtime"] = "%.0f" % ms

        if core_stats[:requests].any?{ |thread, count| too_many_core_server_requests(count) }
          # Raise an exception just for Hoptoad. Yes, that's ugly, but
          # getting the right data without doing it is uglier, and we're
          # likely to want to re-raise the exception regardless.
          begin
            raise CoreServer::TooManyRequests.new(self, action_name, core_stats[:requests][Thread.current.object_id])
          rescue CoreServer::TooManyRequests => e
            notify_hoptoad(e)
            raise unless Rails.env.production?
          end
        end

      else
        perform_action_without_core_benchmark
      end
    end

    def total_requests(requests)
      requests.reduce(0){ |s, p| s + p.last }
    end

    def render_with_core_benchmark(options = nil, extra_options = {}, &block)
      if logger
        if Object.const_defined?("CoreServer")
          core_counters = CoreServer::Base.connection.reset_counters
        end

        render_output = nil
        @view_runtime = Benchmark.ms { render_output = render_without_core_benchmark(options, extra_options, &block) }

        if Object.const_defined?("CoreServer")
          @core_rt_before_render = core_counters
          @core_rt_after_render = CoreServer::Base.connection.reset_counters
          @view_runtime -= @core_rt_after_render[:runtime]
        end

        render_output
      else
        render_without_core_benchmark(options, extra_options, &block)
      end
    end

    def too_many_core_server_requests(requests)
      APP_CONFIG['max_core_server_requests'].present? &&
        (requests > APP_CONFIG['max_core_server_requests'])
    end

    # Display a formatted count of the number of requests made to the core
    # server and the cumulative time (in ms) it took to make those requests.
    def core_server_stats
      counters = CoreServer::Base.connection.reset_counters

      core_runtime = counters[:runtime]
      core_runtime += @core_rt_before_render[:runtime] if @core_rt_before_render
      core_runtime += @core_rt_after_render[:runtime] if @core_rt_after_render

      core_requests = counters[:requests]
      core_requests.merge_sum(@core_rt_before_render[:requests]) if @core_rt_before_render
      core_requests.merge_sum(@core_rt_after_render[:requests]) if @core_rt_after_render

      {:runtime => core_runtime, :requests => core_requests}
    end
  end
end

ActionController::Base.class_eval do
  include ActionController::CoreServerBenchmarking
end
