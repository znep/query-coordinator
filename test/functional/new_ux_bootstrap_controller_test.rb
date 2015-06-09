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
      load_sample_data('test/fixtures/sample-data.json')
      test_view = View.find('test-data')
      View.any_instance.stubs(:find => test_view)
      stub_multiple_feature_flags_with(odux_enable_histogram: true)
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

      context 'bootstrapping old backend datasets should error' do
        should 'show 400 error' do
          @controller.stubs(:dataset_is_new_backend? => false)

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

          should 'create a new page' do
            @phidippides.expects(:update_dataset_metadata).
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
              },
              fetch_page_metadata: {
                status: '200'
              }
            )
            @controller.stubs(:default_page_accessible => true)

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
              },
              fetch_page_metadata: {
                status: '200'
              },
              update_dataset_metadata: {
                status: '200'
              }
            )
            @controller.stubs(:default_page_accessible => true)
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
              },
              fetch_page_metadata: {
                status: '200'
              },
              update_dataset_metadata: {
                status: '200'
              }
            )
            @controller.stubs(:default_page_accessible => true)
          end

          should 'redirect to the default page' do
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

          should 'createa  new default page' do
            @phidippides.expects(:update_dataset_metadata).
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

            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')
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

          should 'create a new default page' do
            @phidippides.expects(:update_dataset_metadata).
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

            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')
          end
        end

        context 'create a new default page if default page is set but fetching pages returns a 404' do
          setup do
            @page_metadata_manager.stubs(
              create: {
                status: '200',
                body: { pageId: 'abcd-efgh' }
              }
            )
          end

          should 'create a new default page' do
            @phidippides.expects(:update_dataset_metadata).
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
                status: '404', body: ''
              }
            )

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

          should 'create a new default page' do
            @phidippides.expects(:update_dataset_metadata).
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

            get :bootstrap, id: 'data-iden'
            assert_redirected_to('/view/abcd-efgh')
          end
        end

        context 'set an existing page as default and redirect to it if no default page is set and there are already pages and at least one is v1' do

          should 'set an existing page as default' do

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
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'neww-page'
              end

            stub_fetch_dataset_metadata_without_default_page_and_fetch_pages_for_dataset
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
            @phidippides.expects(:update_dataset_metadata).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'neoo-page'
              end

          end

          should 'create and redirect' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              }
            )

            # Make sure the page we're creating fits certain criteria
            @page_metadata_manager.expects(:create).with do |page, _|
              assert_equal(10, page['cards'].length, 'Should create 10 cards')

              assert(page['cards'].none? do |card|
                Phidippides::SYSTEM_COLUMN_ID_REGEX.match(card['fieldName'])
              end, 'should omit system columns')

              # TODO Make this test assertion do what it claims to be doing
              # make sure there exists cards that have the same logical and physical types, but
              # different card types, according to cardinality.
              # differing_card_types = collect_differing_card_types(page['cards'])
              # # Make sure we checked some cards
              # assert(differing_card_types.present?)

              assert(page['cards'].any? do |card|
                card['fieldName'] == 'no_cardinality' && card['cardType'] == 'histogram'
              end, 'A column with no cardinality should default to its high-cardinality default')

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

        context 'skip cards we do not care about' do

          should 'not create a card for things that look like OBE sub-columns' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              },
              update_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              }
            )

            # Make sure the page we're creating fits certain criteria
            @page_metadata_manager.expects(:create).with do |page, _|
              assert_equal(10, page['cards'].length, 'Should create 10 cards')

              assert(page['cards'].none? do |card|
                card['fieldName'] == 'point_city'
              end, 'should omit sub-columns')

            end.returns(status: '200', body: { pageId: 'neoo-page' })

            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neoo-page')
          end

          should 'not create a card for number or money columns, if histograms are unsupported' do
            mock_dataset_metadata = v1_mock_dataset_metadata
            mock_dataset_metadata[:columns] = {
              money_column: {
                name: 'Moneymoneymoneymoooney',
                description: 'A Money column that should be omitted',
                fred: 'money',
                physicalDatatype: 'money'
              },
              number_column: {
                name: 'Onetwothree',
                description: 'best to conserve numbers afore they run out',
                fred: 'number',
                physicalDatatype: 'number'
              },
              time_column: {
                name: 'time column',
                description: 'this is the only one that should be included',
                fred: 'time',
                physicalDatatype: 'fixed_timestamp'
              }
            }
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: mock_dataset_metadata
              },
              update_dataset_metadata: {
                status: '200', body: mock_dataset_metadata
              }
            )
            stub_multiple_feature_flags_with(
              odux_enable_histogram: false
            )

            # Make sure the page we're creating doesn't create cards out of money or number columns
            @page_metadata_manager.expects(:create).with do |page, _|
              refute(page['cards'].any? { |card| card['cardType'] == 'histogram' },
                'should omit all number/money coumns')

              assert_equal(page['cards'][0]['fieldName'], 'time_column')

            end.returns(status: '200', body: { pageId: 'neoo-page' })

            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neoo-page')
          end

          should 'not create a card for any money column' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              },
              update_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              }
            )

            @page_metadata_manager.expects(:create).with do |page, _|
              is_money = lambda { |fieldName| fieldName =~ /single4/ }
              assert(page['cards'].pluck('fieldName').map(&:downcase).none?(&is_money))
            end.returns(status: '200', body: { pageId: 'neoo-page' })

            get :bootstrap, id: 'four-four'
          end

          should 'not create a card for point columns when the dataset size is > 100_000' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              },
              update_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              }
            )
            @controller.stubs(:dataset_size => 200_000)

            # Make sure the page we're creating fits certain criteria
            @page_metadata_manager.expects(:create).with do |page, _|
              assert_equal(10, page['cards'].length, 'Should create 10 cards')
              point_columns = lambda { |fieldName| fieldName =~ /computed/ }

              assert(
                page['cards'].pluck('fieldName').map(&:downcase).none?(&point_columns),
                'should omit point column cards when dataset size is too large'
              )

            end.returns(status: '200', body: { pageId: 'neoo-page' })

            get :bootstrap, id: 'four-four'
            assert_redirected_to('/view/neoo-page')
          end

          should 'not create a card for columns with known uniform cardinality' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              },
              update_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              }
            )

            @page_metadata_manager.expects(:create).with do |page, _|
              assert_equal(10, page['cards'].length, 'Should create 10 cards')
              uniform_columns = lambda { |fieldName| fieldName == 'point_city' }

              assert(
                page['cards'].pluck('fieldName').map(&:downcase).none?(&uniform_columns),
                'should not create a card for a column with cardinality of 1'
              )
            end.returns(status: '200', body: { pageId: 'neoo-page' })

            get :bootstrap, id: 'four-four'
          end

          context 'on point columns' do

            setup do
              @mock_cardinality_metadata = v1_mock_dataset_metadata.deep_dup
              @mock_cardinality_metadata['columns'][':@computed']['cardinality'] = 1000
              @mock_cardinality_metadata['columns'][':@computed']['physicalDatatype'] = 'point'
              @mock_cardinality_metadata['columns'][':@other_computed']['cardinality'] = 1000
              @mock_cardinality_metadata['columns'][':@other_computed']['physicalDatatype'] = 'point'
              @phidippides.stubs(
                  update_dataset_metadata: {
                  status: '200', body: v1_mock_dataset_metadata
                }
              )
              end

            should 'not create any cards for point columns with insufficient cardinality' do
              @mock_cardinality_metadata['columns'][':@computed']['cardinality'] = 1
              @mock_cardinality_metadata['columns'][':@other_computed']['cardinality'] = 1

              @phidippides.stubs(
                fetch_dataset_metadata: { status: '200', body: @mock_cardinality_metadata }
              )

              @page_metadata_manager.expects(:create).with do |page, _|
                assert_equal(10, page['cards'].length, 'Should create 10 cards')
                point_columns = lambda { |fieldName| fieldName =~ /(other_)?computed/ }

                assert(
                  page['cards'].pluck('fieldName').map(&:downcase).none?(&point_columns),
                  'should omit point column cards when the location has insufficient cardinality'
                )
              end.returns(status: '200', body: { pageId: 'neoo-page' })

              get :bootstrap, id: 'four-four'
            end

            should 'create point column cards for columns with sufficient cardinality' do
              @phidippides.stubs(
                fetch_dataset_metadata: { status: '200', body: @mock_cardinality_metadata }
              )

              @page_metadata_manager.expects(:create).with do |page, _|
                assert_equal(10, page['cards'].length, 'Should create 10 cards')
                point_columns = lambda { |fieldName| fieldName =~ /(other_)?computed/ }

                assert(
                  page['cards'].pluck('fieldName').map(&:downcase).any?(&point_columns),
                  'should include point column cards when the location has sufficient cardinality'
                )
              end.returns(status: '200', body: { pageId: 'neoo-page' })

              get :bootstrap, id: 'four-four'
            end

          end

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
