# This controller is invoked via config.exceptions_app on unhandled exceptions.
# The various error classes can be mapped to appropriate status codes (because
# the "normal" way of getting these codes, via ExceptionWrapper, can give some
# unexpected results such as a 500 for a RoutingError).
#
# Error pages are only rendered if config.consider_all_requests_local is false;
# this setting is typically true in development for more helpful debugging.
#
# Individual controllers can override the default error handling by defining
# their own rescue_from behavior (see StoriesController). Custom error handlers
# should only specify a status, title, and description which are plugged into
# the errors/show view (see ApplicationController#render_story_404).
class ErrorsController < ApplicationController
  layout 'error'

  def show
    case request.env['action_dispatch.exception']
      # For some reason, ActionDispatch::ExceptionWrapper#status_code reports
      # these as being 500 errors, but that's not really desirable for us.
      when ActionController::RoutingError,
           ActionController::UnknownFormat,
           ActiveRecord::RecordNotFound
        @status = 404
      else
        @status = 500
    end
    @title = I18n.t("error_pages.generic_#{@status}.title")
    @description = I18n.t("error_pages.generic_#{@status}.description")

    respond_to do |format|
      format.json do
        render status: @status, json: { status: @status.to_s, error: @title }
      end
      format.html do
        render status: @status
      end
      format.any do
        render status: @status, formats: [:html], content_type: 'text/html'
      end
    end
  end
end
