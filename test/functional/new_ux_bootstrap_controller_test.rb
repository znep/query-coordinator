require 'test_helper'

class NewUxBootstrapControllerTest < ActionController::TestCase

  context 'bootstrap' do
    setup do
      init_core_session
      init_current_domain
      # noinspection RubyArgCount
      CurrentDomain.stubs(domain: stub(cname: 'localhost'))
      @phidippides = Phidippides.new
      @page_metadata_manager = PageMetadataManager.new
      @controller.stubs(
        :phidippides => @phidippides,
        :page_metadata_manager => @page_metadata_manager,
      )

      Airbrake.stubs(notify: nil)
      connection_stub = stub.tap do |stub|
        stub.stubs(get_request: '[]', reset_counters: {requests: {}, runtime: 0})
      end
      CoreServer::Base.stubs(connection: connection_stub)
      stub_feature_flags_with(:metadata_transition_phase, '0')
    end

    should 'have no route if no id' do
      assert_raise(ActionController::RoutingError) do
        get :bootstrap
      end
    end

    should 'return 403 if anonymous' do
      get :bootstrap, id: 'four-four'
      assert_response(403)
    end

    context 'auth' do
      setup do
        # Stub out services, so we don't end up trying
        # to connect to external endpoints.
        @phidippides.stubs(fetch_dataset_metadata: { status: '500', body: {columns: nil} })
      end

      should 'return 403 if role is not set, and not admin' do
        stub_user = stub(is_owner?: false, is_admin?: false, roleName: nil)
        @controller.stubs(is_owner?: false, is_admin?: false, current_user: stub_user)

        get :bootstrap, id: 'four-four'
        assert_response(403)
      end

      should 'return 403 if role is viewer, and not admin' do
        stub_user = stub(is_owner?: false, is_admin?: false, roleName: 'viewer')
        @controller.stubs(current_user: stub_user)

        get :bootstrap, id: 'four-four'
        assert_response(403)
      end

      should 'not return 403 if no role, but dataset owner' do
        stub_user = stub(roleName: '', is_owner?: true)
        @controller.stubs(current_user: stub_user)

        get :bootstrap, id: 'four-four'
        assert_not_equal(@response.response_code, 403)
      end

      should 'not return 403 if no role, but superadmin' do
        stub_user = stub(roleName: '', is_admin?: true, is_owner?: false)
        @controller.stubs(current_user: stub_user)

        get :bootstrap, id: 'four-four'
        assert_not_equal(@response.response_code, 403)
      end

      should 'not return 403 if role is administrator' do
        stub_user = stub(roleName: 'administrator')
        @controller.stubs(current_user: stub_user)

        get :bootstrap, id: 'four-four'
        assert_not_equal(@response.response_code, 403)
      end

      should 'not return 403 if role is publisher' do
        stub_user = stub(roleName: 'publisher')
        @controller.stubs(current_user: stub_user)

        get :bootstrap, id: 'four-four'
        assert_not_equal(@response.response_code, 403)
      end
    end

    context 'logged in' do
      setup do
        # noinspection RubyArgCount
        stub_user = stub(roleName: 'administrator')
        @controller.stubs(current_user: stub_user)
      end

      context 'default page' do
        should 'redirect to the default page if the 4x4 already has a default page' do
          @phidippides.stubs(
            fetch_dataset_metadata: {
              status: '200', body: {defaultPage: 'defa-ultp'}
            },
            fetch_pages_for_dataset: {
              status: '200', body: { publisher: [{ pageId: 'page-xist' }, { pageId: 'defa-ultp' }, { pageId: 'last-page' }], user: [] }
            }
          )
          get :bootstrap, id: 'four-four'
          assert_redirected_to('/view/defa-ultp')
        end

        context 'does not exist' do
          setup do
            @phidippides.expects(:update_dataset_metadata).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'last-page'
              end
            @phidippides.stubs(
              fetch_pages_for_dataset: {
                status: '200', body: { publisher: [{ pageId: 'page-xist' }, { pageId: 'last-page' }], user: [] }
              }
            )
          end

          should 'set & redirect to the default page if the 4x4 only has non-default pages' do
            @phidippides.stubs(:fetch_dataset_metadata).
              returns({ status: '200', body: {columns: nil} })
            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/last-page')
          end

          should "set & redirect to a new default page if the current one doesn't exist" do
            @phidippides.stubs(:fetch_dataset_metadata).
              returns({status: '200', body: {defaultPage: 'nnot-xist'}})
            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/last-page')
          end
        end
      end

      context 'dependent service error handling' do
        should 'redirect to dataset page with error if the fetch_pages_for_dataset request fails' do
          @phidippides.stubs(
            fetch_dataset_metadata: {
              status: '200', body: {columns: nil}
            },
            fetch_pages_for_dataset: {
              status: '500', body: { error: '500 Internal Server Error' }
            }
          )
          get :bootstrap, id: 'four-four'
          assert_redirected_to('/datasets/four-four')
          assert_equal(@controller.flash[:error], 'A preview is not available for this dataset.')
        end

        should 'return 404 if dataset does not exist' do
          @phidippides.stubs(
            fetch_dataset_metadata: {
              status: '404', body: { error: {} }
            }
          )
          get :bootstrap, id: 'four-four'
          assert_response(404)
        end
      end

      context 'creating page' do
        setup do
          @phidippides.stubs(
            fetch_pages_for_dataset: {
              status: '404', body: []
            }
          )
        end

        context 'creates and redirects to new page with cards for the first 10 non-system columns' do

          setup do
            connection_stub = stub.tap do |stub|
              stub.stubs(get_request: '[{"count_0": "1234"}]',
                         reset_counters: {requests: {}, runtime: 0})
            end

            CoreServer::Base.stubs(connection: connection_stub)

            @phidippides.expects(:update_dataset_metadata).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'neoo-page'
              end

          end

          teardown do
            stub_feature_flags_with(:metadata_transition_phase, '0')
          end

          should 'in phase 0' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v0_mock_dataset_metadata
              }
            )
            stub_feature_flags_with(:metadata_transition_phase, '0')

            # Make sure the page we're creating fits certain criteria
            @page_metadata_manager.expects(:create).with do |page, _|
              assert_equal(10, page['cards'].length, 'Should create 10 cards')

              assert(page['cards'].none? do |card|
                Phidippides::SYSTEM_COLUMN_ID_REGEX.match(card['fieldName'])
              end, 'should omit system columns')

              # make sure there exists cards that have the same logical and physical types, but
              # different card types, according to cardinality.
              differing_card_types = collect_differing_card_types(page['cards'])

              # Make sure we checked some cards
              assert(differing_card_types.present?)

              assert(page['cards'].any? do |card|
                card['fieldName'] == 'none' && card['cardType'] == 'column'
              end, 'A column with no cardinality should default to its low-cardinality default')

              assert(page['cards'].none? do |card|
                card['fieldName'] == 'below'
              end, 'too-low cardinality columns should be omitted')

              assert(page['cards'].all? do |card|
                card['cardType']
              end, 'Every card should have cardType set')

              previous_card = {}
              page['cards'].first(4).each do |card|
                assert_not_equal(previous_card['cardType'], card['cardType'],
                                 'There should be a variety of cards created')
                previous_card = card
              end

              next true
            end.then.returns({ status: '200', body: { pageId: 'neoo-page' } })

            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neoo-page')
          end

          should 'in phase 1' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              }
            )
            stub_feature_flags_with(:metadata_transition_phase, '1')

            # Make sure the page we're creating fits certain criteria
            @page_metadata_manager.expects(:create).with do |page, _|
              assert_equal(10, page['cards'].length, 'Should create 10 cards')

              assert(page['cards'].none? do |card|
                Phidippides::SYSTEM_COLUMN_ID_REGEX.match(card['fieldName'])
              end, 'should omit system columns')

              # make sure there exists cards that have the same logical and physical types, but
              # different card types, according to cardinality.
              differing_card_types = collect_differing_card_types(page['cards'])

              # Make sure we checked some cards
              assert(differing_card_types.present?)

              assert(page['cards'].any? do |card|
                card['fieldName'] == 'none' && card['cardType'] == 'column'
              end, 'A column with no cardinality should default to its low-cardinality default')

              assert(page['cards'].none? do |card|
                card['fieldName'] == 'below'
              end, 'too-low cardinality columns should be omitted')

              assert(page['cards'].all? do |card|
                card['cardType']
              end, 'Every card should have cardType set')

              previous_card = {}
              page['cards'].first(4).each do |card|
                assert_not_equal(previous_card['cardType'], card['cardType'],
                                 'There should be a variety of cards created')
                previous_card = card
              end

              next true
            end.then.returns({ status: '200', body: { pageId: 'neoo-page' } })

            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neoo-page')
          end

          should 'in phase 2' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              }
            )
            stub_feature_flags_with(:metadata_transition_phase, '2')

            # Make sure the page we're creating fits certain criteria
            @page_metadata_manager.expects(:create).with do |page, _|
              assert_equal(10, page['cards'].length, 'Should create 10 cards')

              assert(page['cards'].none? do |card|
                Phidippides::SYSTEM_COLUMN_ID_REGEX.match(card['fieldName'])
              end, 'should omit system columns')

              # make sure there exists cards that have the same logical and physical types, but
              # different card types, according to cardinality.
              differing_card_types = collect_differing_card_types(page['cards'])

              # Make sure we checked some cards
              assert(differing_card_types.present?)

              assert(page['cards'].any? do |card|
                card['fieldName'] == 'none' && card['cardType'] == 'column'
              end, 'A column with no cardinality should default to its low-cardinality default')

              assert(page['cards'].none? do |card|
                card['fieldName'] == 'below'
              end, 'too-low cardinality columns should be omitted')

              assert(page['cards'].all? do |card|
                card['cardType']
              end, 'Every card should have cardType set')

              previous_card = {}
              page['cards'].first(4).each do |card|
                assert_not_equal(previous_card['cardType'], card['cardType'],
                                 'There should be a variety of cards created')
                previous_card = card
              end

              next true
            end.then.returns({ status: '200', body: { pageId: 'neoo-page' } })

            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neoo-page')
          end
        end

        context 'create page omitting column charts where cardinality == dataset_size' do

          setup do
            connection_stub = stub.tap do |stub|
              stub.stubs(get_request: '[{"count_0": "34"}]',
                         reset_counters: {requests: {}, runtime: 0})
            end

            CoreServer::Base.stubs(connection: connection_stub)

            @phidippides.expects(:update_dataset_metadata).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'neoo-page'
              end
          end

          teardown do
            stub_feature_flags_with(:metadata_transition_phase, '0')
          end

          should 'in phase 0' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v0_mock_dataset_metadata_with_uninteresting_column_chart
              }
            )
            stub_feature_flags_with(:metadata_transition_phase, '0')

            # Make sure the page we're creating fits certain criteria
            @page_metadata_manager.expects(:create).
              with { |page, _| assert_no_cards(page) }.
              returns({ status: '200', body: { pageId: 'neoo-page' } })

            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neoo-page')
          end

          should 'in phase 1' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata_with_uninteresting_column_chart
              }
            )
            stub_feature_flags_with(:metadata_transition_phase, '1')

            # Make sure the page we're creating fits certain criteria
            @page_metadata_manager.expects(:create).
              with { |page, _| assert_no_cards(page) }.
              returns({ status: '200', body: { pageId: 'neoo-page' } })

            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neoo-page')
          end

          should 'in phase 2' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata_with_uninteresting_column_chart
              }
            )
            stub_feature_flags_with(:metadata_transition_phase, '2')

            # Make sure the page we're creating fits certain criteria
            @page_metadata_manager.expects(:create).
              with { |page, _| assert_no_cards(page) }.
              returns({ status: '200', body: { pageId: 'neoo-page' } })

            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neoo-page')
          end
        end

        should 'redirect to dataset page with error if error while creating page' do
          connection_stub = stub.tap do |stub|
            stub.stubs(get_request: '[{"count_0": "1234"}]',
                       reset_counters: {requests: {}, runtime: 0})
          end
          CoreServer::Base.stubs(connection: connection_stub)
          @page_metadata_manager.stubs(
            create: { status: '500' },
          )
          @phidippides.stubs(
            fetch_dataset_metadata: {
              status: '200',
              body: v0_mock_dataset_metadata
            }
          )
          get :bootstrap, id: 'four-four'
          assert_redirected_to('/datasets/four-four')
          assert_equal(@controller.flash[:error], 'A preview is not available for this dataset.')
        end
      end
    end
  end

  private

  def assert_no_cards(page)
    assert_equal(
      0,
      page['cards'].length,
      'Should not create column card with cardinality == dataset_size'
    )
  end

  def collect_differing_card_types(cards)
    seen_multi_cards = {}
    cards.map do |card|
      if card['fieldName'].start_with?('multi')
        if seen_multi_cards.has_key?(card['fieldName'])
          assert_not_equal(
            seen_multi_cards[card['fieldName']]['cardType'],
            card['fieldName']['cardType'],
            'Given a physical/logical type, differing cardinality should create ' +
            'different cardType'
          )
          card
        else
          seen_multi_cards[card['fieldName']] = card
        end
      end
    end.compact
  end

  def cardinality_threshold
    CardTypeMapping::CARD_TYPE_MAPPING['cardinality']['threshold']
  end

  def v0_mock_dataset_metadata_with_uninteresting_column_chart
    cardinality_equal_to_dataset_size = [
      title: 'cardinality equal to dataset size',
      name: 'too_much',
      logicalDatatype: 'category',
      physicalDatatype: 'number',
      cardinality: cardinality_threshold - 1
    ]

    mock_metadata = v0_mock_dataset_metadata
    mock_metadata[:columns] = cardinality_equal_to_dataset_size
    mock_metadata
  end

  def v1_mock_dataset_metadata_with_uninteresting_column_chart
    cardinality_equal_to_dataset_size = {
      too_much: {
        description: 'cardinality equal to dataset size',
        name: 'too much',
        fred: 'category',
        physicalDatatype: 'number',
        cardinality: cardinality_threshold - 1
      }
    }

    mock_metadata = v1_mock_dataset_metadata
    mock_metadata[:columns] = cardinality_equal_to_dataset_size
    mock_metadata
  end

  def v0_mock_dataset_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v0-bootstrap-dataset-metadata.json")).with_indifferent_access
  end

  def v1_mock_dataset_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-bootstrap-dataset-metadata.json")).with_indifferent_access
  end

end
