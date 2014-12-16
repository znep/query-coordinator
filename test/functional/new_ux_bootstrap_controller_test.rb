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

  test 'bootstrap returns 403 if anonymous' do
    get :bootstrap, id: 'four-four'
    assert_response(403)
  end

  test 'bootstrap returns 403 if role is not set, and not admin' do
    stub_user = stub(is_owner?: false, is_admin?: false, roleName: nil)
    @controller.stubs(is_owner?: false, is_admin?: false, current_user: stub_user)

    get :bootstrap, id: 'four-four'
    assert_response(403)
  end

  test 'bootstrap returns 403 if role is viewer, and not admin' do
    stub_user = stub(is_owner?: false, is_admin?: false, roleName: 'viewer')
    @controller.stubs(current_user: stub_user)

    get :bootstrap, id: 'four-four'
    assert_response(403)
  end

  test 'bootstrap does not return 403 if no role, but dataset owner' do
    stub_user = stub(roleName: '', is_owner?: true)
    @controller.stubs(current_user: stub_user)

    # Stub out services, so we don't end up trying
    # to connect to external endpoints.
    @page_metadata_manager.stubs(pages_for_dataset: { status: '500', body: {} })
    @phidippides.stubs(fetch_dataset_metadata: { status: '500', body: {} })

    get :bootstrap, id: 'four-four'
    assert_not_equal(@response.response_code, 403)
  end

  test 'bootstrap does not return 403 if no role, but superadmin' do
    stub_user = stub(roleName: '', is_admin?: true, is_owner?: false)
    @controller.stubs(current_user: stub_user)

    # Stub out services, so we don't end up trying
    # to connect to external endpoints.
    @page_metadata_manager.stubs(pages_for_dataset: { status: '500', body: {} })
    @phidippides.stubs(fetch_dataset_metadata: { status: '500', body: {} })

    get :bootstrap, id: 'four-four'
    assert_not_equal(@response.response_code, 403)
  end

  test 'bootstrap does not return 403 if role is administrator' do
    stub_user = stub(roleName: 'administrator')
    @controller.stubs(current_user: stub_user)

    # Stub out services, so we don't end up trying
    # to connect to external endpoints.
    @page_metadata_manager.stubs(pages_for_dataset: { status: '500', body: {} })
    @phidippides.stubs(fetch_dataset_metadata: { status: '500', body: {} })

    get :bootstrap, id: 'four-four'
    assert_not_equal(@response.response_code, 403)
  end

  test 'bootstrap does not return 403 if role is publisher' do
    stub_user = stub(roleName: 'publisher')
    @controller.stubs(current_user: stub_user)

    # Stub out services, so we don't end up trying
    # to connect to external endpoints.
    @page_metadata_manager.stubs(pages_for_dataset: { status: '500', body: {} })
    @phidippides.stubs(fetch_dataset_metadata: { status: '500', body: {} })

    get :bootstrap, id: 'four-four'
    assert_not_equal(@response.response_code, 403)
  end

  test 'bootstrap redirects to the last page if the 4x4 already has pages' do
    stub_user = stub(roleName: 'administrator')
    @controller.stubs(current_user: stub_user)
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
    @controller.stubs(current_user: stub_user)
    @page_metadata_manager.stubs(
      pages_for_dataset: { status: '500', body: { error: 'you suck' } }
    )
    get :bootstrap, id: 'four-four'
    assert_redirected_to('/datasets/four-four')
    assert_equal(@controller.flash[:error], 'A preview is not available for this dataset.')
  end

  test 'bootstrap returns 404 if dataset does not exist' do
    stub_user = stub(roleName: 'administrator')
    @controller.stubs(current_user: stub_user)
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
    @controller.stubs(current_user: stub_user)
    @page_metadata_manager.stubs(
      pages_for_dataset: { status: '404', body: [] },
    )

    @phidippides.stubs(
      fetch_dataset_metadata: {
        status: '200',
        body: dataset_metadata
      }
    )
    # Make sure the page we're creating is the correct one
    @page_metadata_manager.expects(:create).with do |page, params|
      assert_equal(10, page['cards'].length, 'Should create 10 cards')

      assert(page['cards'].none? do |card|
        Phidippides::SYSTEM_COLUMN_ID_REGEX.match(card['fieldName'])
      end, 'should omit system columns')

      # make sure there exists cards that have the same logical and physical types, but different
      # card types, according to cardinality.
      seen_multi_cards = {}
      differing_card_types = page['cards'].map do |card|
        if card['fieldName'].start_with?('multi')
          if seen_multi_cards.has_key?(card['fieldName'])
            assert_not_equal(
              seen_multi_cards[card['fieldName']]['cardType'],
              card['fieldName']['cardType'],
              'For a given physical/logical type, different cardinality creates different cardType'
            )
            card
          else
            seen_multi_cards[card['fieldName']] = card
          end
        end
      end.compact
      # Make sure we checked some cards
      assert(differing_card_types.present?)

      assert(page['cards'].any? do |card|
        card['description'] == 'no cardinality' && card['cardType'] == 'column'
      end, 'A column with no cardinality should default to its low-cardinality default')

      assert(page['cards'].none? do |card|
        card['description'] == 'below min cardinality'
      end, 'too-low cardinality columns should be omitted')

      assert(page['cards'].all? { |card| card['cardType'] }, 'Every card should have cardType set')

      previous_card = {}
      page['cards'].first(4).each do |card|
        assert_not_equal(previous_card['cardType'], card['cardType'],
                         'There should be a variety of cards created')
        previous_card = card
      end

      true
    end.then.returns({ status: '200', body: { pageId: 'neoo-page' } })

    get :bootstrap, id: 'four-four'
    assert_redirected_to('/view/neoo-page')
  end

  test 'bootstrap redirects to dataset page with error if error while creating page' do
    stub_user = stub(roleName: 'administrator')
    @controller.stubs(current_user: stub_user)
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

  def column_for_type(logical_type, physical_type, cardinality, name)
    {
      title: name,
      name: name,
      logicalDatatype: logical_type,
      physicalDatatype: physical_type,
      cardinality: cardinality,
    }
  end

  def columns_for_cardtypes(types, prefix)
    cardinality_threshold = CardTypeMapping::CARD_TYPE_MAPPING['cardinality']['threshold']
    cardinality_toggle = 1
    counter = 0
    types.keys.map do |logical_type|
      counter += 1
      types[logical_type].map do |physical_type|
        cardinality_toggle *= -1
        column_for_type(logical_type, physical_type,
                        cardinality_threshold + cardinality_toggle, "#{prefix}#{counter}")
      end
    end.flatten(1)
  end

  def dataset_metadata
    multiple_cardtype_types = {
      'category' => ['number', 'text'],
      'identifier' => ['number', 'text'],
      'name' => ['number', 'text'],
      'text' => ['number', 'text'],
    }
    # A sampling of datatypes that map to only one cardtype
    single_cardtype_types = {
      'amount' => ['*'],
      'category' => ['boolean'],
      'identifier' => ['fixed_timestamp', 'money'],
      'location' => ['number', 'point'],
    }
    no_cardtype_types = {
      '*' => ['boolean'],
      'time' => ['geo_entity']
    }

    counter = 0

    multi_cardtype_cols = columns_for_cardtypes(multiple_cardtype_types, 'multi')
    single_cardtype_cols = columns_for_cardtypes(single_cardtype_types, 'single')
    no_cardtype_cols = columns_for_cardtypes(no_cardtype_types, 'none')
    below_minimum_cardinality = [{
      title: 'below min cardinality',
      name: 'below',
      logicalDatatype: 'category',
      physicalDatatype: 'number',
      cardinality: CardTypeMapping::CARD_TYPE_MAPPING['cardinality']['min'] - 1
    }]
    no_cardinality = [{
      title: 'no cardinality',
      name: 'none',
      logicalDatatype: 'category',
      physicalDatatype: 'number',
    }]

    {
      id: 'data-iden',
      name: 'test dataset',
      description: 'dataset for unit test',
      columns: [{ title: ':system', name: ':system' }] +
        no_cardinality +
        below_minimum_cardinality +
        no_cardtype_cols.first(2) +
        single_cardtype_cols.first(4) +
        multi_cardtype_cols.first(6)
    }
  end
end
