require 'rails_helper'

RSpec.describe ErrorsController, type: :controller do

  before do
    Rails.application.routes.draw { get 'test_action' => 'errors#show' }
  end

  after do
    Rails.application.reload_routes!
  end

  def expect_custom_error_page(error, status, content)
    request.env['action_dispatch.exception'] = error
    get :show

    expect(response.status).to eq(status)
    expect(response.body).to have_content(content)
  end

  describe '#show' do
    render_views

    it 'renders html' do
      get :show, format: :html
      expect(response.headers['Content-Type']).to match('html')
    end

    it 'renders json' do
      get :show, format: :json
      expect(response.headers['Content-Type']).to match('json')
    end

    it 'renders 404 on unimplemented routes' do
      expect_custom_error_page(
        ActionController::RoutingError.new(nil),
        404,
        'The requested page does not exist or is otherwise unavailable.'
      )
    end

    it 'renders 404 on unrecognized formats' do
      expect_custom_error_page(
        ActionController::UnknownFormat.new(nil),
        404,
        'The requested page does not exist or is otherwise unavailable.'
      )
    end

    it 'renders 404 on unmatched records' do
      expect_custom_error_page(
        ActiveRecord::RecordNotFound.new(nil),
        404,
        'The requested page does not exist or is otherwise unavailable.'
      )
    end

    it 'renders 500 on other problems' do
      expect_custom_error_page(
        NameError.new,
        500,
        'The server encountered an error.'
      )
    end
  end
end
