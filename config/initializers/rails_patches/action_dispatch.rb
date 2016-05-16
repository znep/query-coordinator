module ActionDispatch
  module Routing
    class RouteSet
      class NamedRouteCollection
        def define_url_helper(mod, route, name, opts, route_key, url_strategy)
          helper = UrlHelper.create(route, opts, route_key, url_strategy)
          mod.module_eval do
            define_method(name) do |*args|
              # We call the path helper methods like this:
              # view_path(view_instance)
              #   => "/category/dataset/1234-1234"
              # view_path(view_instance, :locale => 'es')
              #   => "/es/category/dataset/1234-1234"
              # view_path(view_instance, :locale => 'es', :param => 'param')
              #   => "/es/category/dataset/1234-1234?param=param"
              options = nil
              options = args.pop if args.last.is_a? Hash
              options = (options || {}).merge(args.pop.route_params) if args.last.respond_to?(:route_params)
              helper.call self, args, options
            end
          end
        end
      end
    end
  end
end
