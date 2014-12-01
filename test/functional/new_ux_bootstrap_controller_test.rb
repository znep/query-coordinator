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

  test 'bootstrap redirects to the last page if the 4x4 already has pages' do
    @controller.stubs(has_rights?: true)
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
    @controller.stubs(has_rights?: true)
    @page_metadata_manager.stubs(
      pages_for_dataset: { status: '500', body: { error: 'you suck' } }
    )
    get :bootstrap, id: 'four-four'
    assert_redirected_to('/datasets/four-four')
    assert_equal(@controller.flash[:error], 'A preview is not available for this dataset.')
  end

  test 'bootstrap returns 404 if dataset does not exist' do
    @controller.stubs(has_rights?: true)
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
    @controller.stubs(has_rights?: true)
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
    @controller.stubs(has_rights?: true)
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
