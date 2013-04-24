module ActionDispatch
  module Routing
    class RouteSet
      class NamedRouteCollection
        private
          def define_hash_access(route, name, kind, options)
            selector = hash_access_name(name, kind)

            # We use module_eval to avoid leaks
            @module.module_eval <<-END_EVAL, __FILE__, __LINE__ + 1
              remove_possible_method :#{selector}
              def #{selector}(*args)
                options = nil
                if args.size == 1 && args.first.respond_to?(:route_params)
                  # this clause is our custom hook. it checks for our
                  # has_route_params? method, and sees it if is able to
                  # give us route params. this way we can directly call
                  # some_path(model) rather than manually extracting.
                  options = args.pop.route_params
                else
                  options = args.extract_options!
                end
                result = #{options.inspect}

                if args.size > 0
                  result[:_positional_args] = args
                  result[:_positional_keys] = #{route.segment_keys.inspect}
                end

                result.merge(options)
              end
              protected :#{selector}
            END_EVAL
            helpers << selector
          end
      end
    end
  end
end
