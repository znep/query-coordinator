require 'lib/v4_routing/routeset'
require 'lib/v4_routing/route'
require 'action_controller/routing'

ActionController::Routing::RouteSet.send :include,
  V4Chrome::Routing::RouteSetExtensions

ActionController::Routing::Route.send :include,
  V4Chrome::Routing::RouteExtensions
