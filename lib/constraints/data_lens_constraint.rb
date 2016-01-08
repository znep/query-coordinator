module Constraints

  class DataLensConstraint

    def matches?(request)
      params = request.path_parameters

      # Inheriting ResourceConstraint broke when category/viewname constraints added.
      return false unless ResourceConstraint.new.valid_uid?(params[:id])

      View unless defined?(View) # force this class to exist in dev mode (╯°□°）╯︵ ┻━┻

      begin
        # The current user hasn't been initialized at this point,
        # so manually add the cookie header to avoid an auth error.
        cookie_string = request.cookies.respond_to?(:map) ?
          request.cookies.map { |k, v| "#{k}=#{v}" }.join(';') : request.cookies.to_s
        view = View.find(params[:id], 'Cookie' => cookie_string)
        standalone_visualizations_enabled = FeatureFlags.derive(nil, request)[:standalone_lens_chart]
        view.data_lens? || (view.standalone_visualization? && standalone_visualizations_enabled)
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
