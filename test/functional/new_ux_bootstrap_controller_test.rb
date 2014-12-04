require 'test_helper'

class NewUxBootstrapControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
    @phidippides = Phidippides.new
    @page_metadata_manager = PageMetadataManager.new
    @controller.stubs(
      :phidippides => @phidippides,
      :page_metadata_manager => @page_metadata_manager,
    )
  end

  test 'bootstrap has no route if no id' do
    assert_raise(ActionController::RoutingError) do
      get :bootstrap
    end
  end

  test 'bootstrap returns 403 if no rights' do
    get :bootstrap, id: 'four-four'
    assert_response(403)
  end

  test 'bootstrap returns 403 if role is not set' do
    stub_user = stub(roleName: nil)
    @controller.stubs(has_rights?: true, current_user: stub_user)

    get :bootstrap, id: 'four-four'
    assert_response(403)
  end

  test 'bootstrap returns 403 if role is viewer' do
    stub_user = stub(roleName: 'viewer')
    @controller.stubs(has_rights?: true, current_user: stub_user)

    get :bootstrap, id: 'four-four'
    assert_response(403)
  end

  test 'bootstrap does not return 403 if role is administrator' do
    stub_user = stub(roleName: 'administrator')
    @controller.stubs(has_rights?: true, current_user: stub_user)

    # Stub out services, so we don't end up trying
    # to connect to external endpoints.
    @page_metadata_manager.stubs(
      pages_for_dataset: {
        status: '500', body: {}
      }
    )
    @phidippides.stubs(
      fetch_dataset_metadata: {
        status: '500', body: {}
      }
    )

    get :bootstrap, id: 'four-four'
    assert_not_equal(@response.response_code, 403)
  end

  test 'bootstrap does not return 403 if role is publisher' do
    stub_user = stub(roleName: 'publisher')
    @controller.stubs(has_rights?: true, current_user: stub_user)

    # Stub out services, so we don't end up trying
    # to connect to external endpoints.
    @page_metadata_manager.stubs(
      pages_for_dataset: {
        status: '500', body: {}
      }
    )
    @phidippides.stubs(
      fetch_dataset_metadata: {
        status: '500', body: {}
      }
    )

    get :bootstrap, id: 'four-four'
    assert_not_equal(@response.response_code, 403)
  end

  test 'bootstrap redirects to the last page if the 4x4 already has pages' do
    stub_user = stub(roleName: 'administrator')
    @controller.stubs(has_rights?: true, current_user: stub_user)
    @page_metadata_manager.stubs(
      pages_for_dataset: {
        status: '200', body: { publisher: [
          { pageId: 'page-xist' },
          { pageId: 'last-page' }
        ] }
      }
    )
    get :bootstrap, id: 'four-four'
    assert_redirected_to('/view/last-page')
  end

  test 'bootstrap redirects to dataset page with error, if page_metadata_manager hates us' do
    stub_user = stub(roleName: 'administrator')
    @controller.stubs(has_rights?: true, current_user: stub_user)
    @page_metadata_manager.stubs(
      pages_for_dataset: { status: '500', body: { error: 'you suck' } }
    )
    get :bootstrap, id: 'four-four'
    assert_redirected_to('/datasets/four-four')
    assert_equal(@controller.flash[:error], 'A preview is not available for this dataset.')
  end

  test 'bootstrap returns 404 if dataset does not exist' do
    stub_user = stub(roleName: 'administrator')
    @controller.stubs(has_rights?: true, current_user: stub_user)
    @page_metadata_manager.stubs(
      pages_for_dataset: { status: '404', body: [] }
    )
    @phidippides.stubs(
      fetch_dataset_metadata: { status: '404', body: { error: {} } }
    )
    get :bootstrap, id: 'four-four'
    assert_response(404)
  end

  test 'bootstrap creates & redirects to new page with cards for the first 10 non-system columns' do
    stub_user = stub(roleName: 'administrator')
    @controller.stubs(has_rights?: true, current_user: stub_user)
    @page_metadata_manager.stubs(
      pages_for_dataset: { status: '404', body: [] },
      create: { status: '200', body: { pageId: 'neoo-page' } },
    )
    @phidippides.stubs(
      fetch_dataset_metadata: {
        status: '200',
        body: dataset_metadata
      }
    )
    get :bootstrap, id: 'four-four'
    assert_redirected_to('/view/neoo-page')
  end

  test 'bootstrap redirects to dataset page with error if error while creating page' do
    stub_user = stub(roleName: 'administrator')
    @controller.stubs(has_rights?: true, current_user: stub_user)
    @page_metadata_manager.stubs(
      pages_for_dataset: { status: '404', body: [] },
      create: { status: '500' },
    )
    @phidippides.stubs(
      fetch_dataset_metadata: {
        status: '200',
        body: dataset_metadata
      }
    )
    get :bootstrap, id: 'four-four'
    assert_redirected_to('/datasets/four-four')
    assert_equal(@controller.flash[:error], 'A preview is not available for this dataset.')
  end

  private

  def dataset_metadata
    {
      id: 'data-iden',
      name: 'test dataset',
      description: 'dataset for unit test',
      columns: [{ title: ':system', name: ':system' }] + (1..10).map do |n|
        {
          title: "col#{n}",
          name: "col#{n}",
          cardinality: n,
        }
      end
    }
  end
end
