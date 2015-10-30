module Constraints

  class DataLensConstraint < ResourceConstraint

    def matches?(request)

      return false unless super

      # Don't render a data lens if someone specifically asks for
      # the janky admin page.
      return false if truthy(request.query_parameters['gridUx'])

      View unless defined?(View) # force this class to exist in dev mode (╯°□°）╯︵ ┻━┻

      begin
        params = request.path_parameters
        # The current user hasn't been initialized at this point,
        # so manually add the cookie header to avoid an auth error.
        cookie_string = request.cookies.kind_of?(Hash) ?
          request.cookies.map { |k, v| "#{k}=#{v}" }.join(';') : request.cookies.to_s
        view = View.find(params[:id], 'Cookie' => cookie_string)
        standalone_visualizations_enabled = FeatureFlags.derive(nil, request)[:standalone_lens_chart]
        view.data_lens? || view.new_view? || (view.standalone_visualization? && standalone_visualizations_enabled)
      rescue
        false
      end

    end

    private

    def truthy(val)
      case val
        when true, 'true', 1, '1' then true
        else false
      end
    end

  end

end
