module ActiveSupport
  module Cache
    module Strategy
      module LocalCache

        # All classes extending this module
        ThreadKeys = []

        def self.extended(base)
          ThreadKeys.push(base.send(:thread_local_key))
        end

        class Middleware

          def call(env)
            ThreadKeys.each do |tkey|
              Thread.current[tkey] = LocalStore.new
            end
            @app.call(env)
          ensure
            ThreadKeys.each do |tkey|
              Thread.current[tkey] = nil
            end
          end

        end

        private
        def thread_local_key
          @thread_local_key ||= "#{self.class.name.underscore}_local_cache".gsub(/[\/-]/, '_').to_sym
        end
      end
    end
  end
end
