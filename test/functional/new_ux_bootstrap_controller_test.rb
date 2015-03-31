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
        :dataset_is_new_backend? => true
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
            connection_stub = stub.tap do |stub|
              stub.stubs(
                get_request: '[{"count_0": "1234"}]',
                reset_counters: { requests: {}, runtime: 0 }
              )
            end
            CoreServer::Base.stubs(connection: connection_stub)
      end

      context 'bootstrapping old backend datasets should error' do
        should 'in phases 1, 2 and 3' do
          @controller.stubs(:dataset_is_new_backend? => false)

          stub_feature_flags_with(:metadata_transition_phase, '1')
          get :bootstrap, id: 'data-iden'
          assert_response(400)

          stub_feature_flags_with(:metadata_transition_phase, '2')
          get :bootstrap, id: 'data-iden'
          assert_response(400)

          stub_feature_flags_with(:metadata_transition_phase, '3')
          get :bootstrap, id: 'data-iden'
          assert_response(400)
        end
      end

      context 'default page' do
        context 'creating a new default page if there is already a default page but the default page is not v1' do
          setup do
            @page_metadata_manager.stubs(
              create: {
                status: '200',
                body: { pageId: 'abcd-efgh' }
              }
            )
          end

          should 'in phases 1, 2 and 3' do
            @phidippides.expects(:update_dataset_metadata).
              times(3).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'abcd-efgh'
              end
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200',
                body: v1_mock_dataset_metadata.deep_dup.tap { |dataset_metadata| dataset_metadata[:defaultPage] = 'olde-page' }
              },
              fetch_pages_for_dataset: {
                status: '200', body: { publisher: [{ pageId: 'olde-page' }, { pageId: 'neww-page' }], user: [] }
              }
            )

            stub_feature_flags_with(:metadata_transition_phase, '1')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')

            stub_feature_flags_with(:metadata_transition_phase, '2')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')

            stub_feature_flags_with(:metadata_transition_phase, '3')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')
          end
        end

        context 'redirect to the default page if there is already a default page' do
          setup do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: { defaultPage: 'defa-ultp' }
              },
              fetch_pages_for_dataset: {
                status: '200', body: { publisher: [{ pageId: 'page-xist', version: '1' }, { pageId: 'defa-ultp' }, { pageId: 'last-page', version: '1' }], user: [] }
              }
            )
          end

          should 'in phase 0' do
            stub_feature_flags_with(:metadata_transition_phase, '0')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/defa-ultp')
          end
        end

        context 'redirect to the default page if there is already a default page and the default page is v1' do
          setup do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: { defaultPage: 'defa-ultp' }
              },
              fetch_pages_for_dataset: {
                status: '200', body: { publisher: [{ pageId: 'page-xist', version: '1' }, { pageId: 'defa-ultp', version: '1' }, { pageId: 'last-page', version: '1' }], user: [] }
              }
            )
          end

          should 'in phases 1, 2 and 3' do
            stub_feature_flags_with(:metadata_transition_phase, '1')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/defa-ultp')

            stub_feature_flags_with(:metadata_transition_phase, '2')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/defa-ultp')

            stub_feature_flags_with(:metadata_transition_phase, '3')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/defa-ultp')
          end
        end

        context 'create a new default page if no default page is set and no pages exist' do
          setup do
            @page_metadata_manager.stubs(
              create: {
                status: '200',
                body: { pageId: 'abcd-efgh' }
              }
            )
          end

          should 'in phase 0' do
            @phidippides.expects(:update_dataset_metadata).
              times(1).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'abcd-efgh'
              end
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200',
                body: v0_mock_dataset_metadata.deep_dup.tap { |dataset_metadata| dataset_metadata.delete(:defaultPage)  }
              },
              fetch_pages_for_dataset: {
                status: '200', body: { publisher: [], user: [] }
              }
            )

            stub_feature_flags_with(:metadata_transition_phase, '0')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')
          end

          should 'in phases 1, 2 and 3' do
            @phidippides.expects(:update_dataset_metadata).
              times(3).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'abcd-efgh'
              end
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200',
                body: v1_mock_dataset_metadata.deep_dup.tap { |dataset_metadata| dataset_metadata.delete(:defaultPage)  }
              },
              fetch_pages_for_dataset: {
                status: '200', body: { publisher: [], user: [] }
              }
            )

            stub_feature_flags_with(:metadata_transition_phase, '1')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')

            stub_feature_flags_with(:metadata_transition_phase, '2')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')

            stub_feature_flags_with(:metadata_transition_phase, '3')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')
          end
        end

        context 'create a new default page if no default page is set and there are already pages' do

          should 'in phase 0' do
            @phidippides.expects(:update_dataset_metadata).
              times(1).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'olde-page'
              end
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200',
                body: v0_mock_dataset_metadata.deep_dup.tap { |dataset_metadata| dataset_metadata.delete(:defaultPage)  }
              },
              fetch_pages_for_dataset: {
                status: '200', body: { publisher: [{ pageId: 'olde-page' }, { pageId: 'neww-page' }], user: [] }
              }
            )

            stub_feature_flags_with(:metadata_transition_phase, '0')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/olde-page')
          end
        end

        context 'create a new default page if no default page is set and there are already pages but none are v1' do
          setup do
            @page_metadata_manager.stubs(
              create: {
                status: '200',
                body: { pageId: 'abcd-efgh' }
              }
            )
          end

          should 'in phases 1, 2 and 3' do
            @phidippides.expects(:update_dataset_metadata).
              times(3).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'abcd-efgh'
              end
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200',
                body: v1_mock_dataset_metadata.deep_dup.tap { |dataset_metadata| dataset_metadata.delete(:defaultPage)  }
              },
              fetch_pages_for_dataset: {
                status: '200', body: { publisher: [{ pageId: 'olde-page' }, { pageId: 'neww-page' }], user: [] }
              }
            )

            stub_feature_flags_with(:metadata_transition_phase, '1')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')

            stub_feature_flags_with(:metadata_transition_phase, '2')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')

            stub_feature_flags_with(:metadata_transition_phase, '3')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')
          end
        end

        context 'create a new default page if default page is set but the default page does not exist' do
          setup do
            @page_metadata_manager.stubs(
              create: {
                status: '200',
                body: { pageId: 'abcd-efgh' }
              }
            )
          end

          should 'in phase 0' do
            @phidippides.expects(:update_dataset_metadata).
              times(1).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'abcd-efgh'
              end
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200',
                body: v0_mock_dataset_metadata.deep_dup.tap { |dataset_metadata| dataset_metadata[:defaultPage] = 'lost-page'  }
              },
              fetch_pages_for_dataset: {
                status: '200', body: { publisher: [], user: [] }
              }
            )

            stub_feature_flags_with(:metadata_transition_phase, '0')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')
          end

          should 'in phases 1, 2 and 3' do
            @phidippides.expects(:update_dataset_metadata).
              times(3).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'abcd-efgh'
              end
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200',
                body: v1_mock_dataset_metadata.deep_dup.tap { |dataset_metadata| dataset_metadata[:defaultPage] = 'lost-page'  }
              },
              fetch_pages_for_dataset: {
                status: '200', body: { publisher: [], user: [] }
              }
            )

            stub_feature_flags_with(:metadata_transition_phase, '1')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')

            stub_feature_flags_with(:metadata_transition_phase, '2')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')

            stub_feature_flags_with(:metadata_transition_phase, '3')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')
          end
        end

        context 'set an existing page as default and redirect to it if no default page is set and there are already pages and at least one is v1' do
          should 'in phase 0' do
            @phidippides.expects(:update_dataset_metadata).
              times(1).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'olde-page'
              end
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200',
                body: v0_mock_dataset_metadata.deep_dup.tap { |dataset_metadata| dataset_metadata.delete(:defaultPage)  }
              },
              fetch_pages_for_dataset: {
                status: '200', body: { publisher: [{ pageId: 'olde-page' }, { pageId: 'neww-page', version: '1' }], user: [] }
              }
            )

            stub_feature_flags_with(:metadata_transition_phase, '0')
            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/olde-page')
          end

          should 'in phase 1, 2 and 3' do

            # Apparently stub responses are cached or memoized or kept by
            # reference or something, so we need to re-stub
            # fetch_dataset_metadata before every one of these tests.
            # This seems like it is because bootstrap mutates the dataset
            # metadata and the stub 'helpfully' notices that and retains the
            # changes?
            def stub_fetch_dataset_metadata_without_default_page_and_fetch_pages_for_dataset
              @phidippides.stubs(
                fetch_dataset_metadata: {
                  status: '200',
                  body: v1_mock_dataset_metadata.deep_dup.tap { |dataset_metadata| dataset_metadata.delete(:defaultPage) }
                },
                fetch_pages_for_dataset: {
                  status: '200', body: { publisher: [{ pageId: 'olde-page' }, { pageId: 'neww-page', version: '1' }], user: [] }
                }
              )
            end

            @phidippides.expects(:update_dataset_metadata).
              times(3).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'neww-page'
              end

            stub_fetch_dataset_metadata_without_default_page_and_fetch_pages_for_dataset
            stub_feature_flags_with(:metadata_transition_phase, '1')
            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neww-page')

            stub_fetch_dataset_metadata_without_default_page_and_fetch_pages_for_dataset
            stub_feature_flags_with(:metadata_transition_phase, '2')
            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neww-page')

            stub_fetch_dataset_metadata_without_default_page_and_fetch_pages_for_dataset
            stub_feature_flags_with(:metadata_transition_phase, '3')
            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neww-page')
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
            end.returns({ status: '200', body: { pageId: 'neoo-page' } })

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
            end.returns({ status: '200', body: { pageId: 'neoo-page' } })

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
            end.returns({ status: '200', body: { pageId: 'neoo-page' } })

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

        context 'skip cards we do not care about' do
          should 'not create a card for columns specified in field_names_to_avoid_during_bootstrap feature flag' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              }
            )
            stub_feature_flags_with(:metadata_transition_phase, '3')

            # Make sure the page we're creating fits certain criteria
            @page_metadata_manager.expects(:create).with do |page, _|
              assert_equal(10, page['cards'].length, 'Should create 10 cards')

              assert(page['cards'].none? do |card|
                 %w(latitude longitude lat lng x y).include?(card['fieldName'].downcase)
              end, 'should omit latitude and longitude columns')

            end.returns(status: '200', body: { pageId: 'neoo-page' })

            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neoo-page')
          end
        end

        context 'invalid input in feature flag field_names_to_avoid_during_bootstrap' do
          should 'not skip any cards' do
            invalid_because_not_array = 'single3'
            stub_multiple_feature_flags_with(
              :field_names_to_avoid_during_bootstrap => invalid_because_not_array,
              :metadata_transition_phase => '3'
            )

            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              }
            )

            # Make sure the page we're creating fits certain criteria
            @page_metadata_manager.expects(:create).with do |page, _|
              assert_equal(10, page['cards'].length, 'Should create 10 cards')

              # still expect card because filter was invalid
              assert(page['cards'].any? { |card| card['fieldName'] == 'single3' })

            end.returns({ status: '200', body: { pageId: 'neoo-page' } })

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
    CARD_TYPE_MAPPING['cardinality']['threshold']
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
