require 'test_helper'

class NewUxBootstrapControllerTest < ActionController::TestCase

  context 'bootstrap' do
    setup do
      init_core_session
      init_current_domain
      # noinspection RubyArgCount
      CurrentDomain.stubs(domain: stub(cname: 'localhost'))
      @phidippides = Phidippides.new('localhost', 2401)
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
      # TODO determine why 23 tests fail or break when :use_ephemeral_bootstrap is set to true
      stub_feature_flags_with(:use_ephemeral_bootstrap => false)
      stub_feature_flags_with(:create_v2_data_lens => false)
      stub_feature_flags_with(:enable_data_lens_page_metadata_migrations => false)
    end

    should 'have no route if no id' do
      assert_raises(ActionController::UrlGenerationError) do
        get :bootstrap, app: 'dataCards'
      end
    end

    should 'return 403 if anonymous - for V1 Data Lenses' do
      get :bootstrap, id: 'four-four', app: 'dataCards'
      assert_response(403)
    end

    should 'return 403 if anonymous - even for V2 Data Lenses' do
      stub_feature_flags_with(:create_v2_data_lens => true)
      get :bootstrap, id: 'four-four', app: 'dataCards'
      assert_response(403)
    end

    context 'auth' do
      setup do
        # Stub out services, so we don't end up trying
        # to connect to external endpoints.
        @phidippides.stubs(fetch_dataset_metadata: { status: '500', body: {columns: nil} })
      end

      should 'return 403 if role is not set, and not admin - for V1 Data Lenses' do
        stub_user = stub(is_owner?: false, is_superadmin?: false, roleName: nil)
        @controller.stubs(is_owner?: false, is_superadmin?: false, current_user: stub_user)

        get :bootstrap, id: 'four-four', app: 'dataCards'
        assert_response(403)
      end

      should 'return 403 if role is not set, and not admin - even for V2 Data Lenses' do
        stub_feature_flags_with(:create_v2_data_lens => true)
        stub_user = stub(is_owner?: false, is_superadmin?: false, roleName: nil)
        @controller.stubs(is_owner?: false, is_superadmin?: false, current_user: stub_user)

        get :bootstrap, id: 'four-four', app: 'dataCards'
        assert_response(403)
      end


      should 'return 403 if role is viewer, and not admin - ONLY for V1 Data Lenses' do
        stub_user = stub(is_owner?: false, is_superadmin?: false, roleName: 'viewer')
        @controller.stubs(current_user: stub_user)

        get :bootstrap, id: 'four-four', app: 'dataCards'
        assert_response(403)
      end

      should 'not return 403 if no role, but dataset owner' do
        stub_user = stub(roleName: '', is_owner?: true)
        @controller.stubs(current_user: stub_user)

        get :bootstrap, id: 'four-four', app: 'dataCards'
        assert_not_equal(@response.response_code, 403)
      end

      should 'not return 403 if no role, but superadmin' do
        stub_user = stub(roleName: '', is_superadmin?: true, is_owner?: false)
        @controller.stubs(current_user: stub_user)

        get :bootstrap, id: 'four-four', app: 'dataCards'
        assert_not_equal(@response.response_code, 403)
      end

      should 'not return 403 if role is administrator' do
        stub_user = stub(roleName: 'administrator')
        @controller.stubs(current_user: stub_user)

        get :bootstrap, id: 'four-four', app: 'dataCards'
        assert_not_equal(@response.response_code, 403)
      end

      should 'not return 403 if role is publisher' do
        stub_user = stub(roleName: 'publisher')
        @controller.stubs(current_user: stub_user)

        get :bootstrap, id: 'four-four', app: 'dataCards'
        assert_not_equal(@response.response_code, 403)
      end

      should 'not return 403 if using ephemeral bootstrap' do
        stub_user = stub(roleName: 'viewer', is_superadmin?: false, is_owner?: false)
        @controller.stubs(current_user: stub_user)

        stub_feature_flags_with(:use_ephemeral_bootstrap => true)

        get :bootstrap, id: 'four-four', app: 'dataCards'
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

          get :bootstrap, id: 'data-iden', app: 'dataCards'
          assert_response(400)
        end
      end

      context 'bootstrapping datasets with groupBys should fail and redirect' do
        should 'redirect to homepage' do
          @controller.stubs(:dataset_has_group_by? => true)

          get :bootstrap, id: 'data-iden', app: 'dataCards'
          assert_response(302)
        end
      end

      context 'default page' do
        context 'creating a new default page if there is already a default page but the default page is not v1' do
          setup do
            @page_metadata_manager.stubs(
              show: {
                status: '200'
              },
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
              }
            )
            @controller.stubs(:default_page_accessible => true)

            get :bootstrap, id: 'data-iden', app: 'dataCards'
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
              update_dataset_metadata: {
                status: '200'
              }
            )
            @controller.stubs(:default_page_accessible => true)
          end

        end

        context 'redirect to the default page if there is already a default page and the default page is v1' do
          setup do
            @page_metadata_manager.stubs(
              show: {
                status: '200'
              }
            )
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: { defaultPage: 'defa-ultp' }
              },
              fetch_pages_for_dataset: {
                status: '200', body: { publisher: [{ pageId: 'page-xist', version: '1' }, { pageId: 'defa-ultp', version: '1' }, { pageId: 'last-page', version: '1' }], user: [] }
              },
              update_dataset_metadata: {
                status: '200'
              }
            )
            @controller.stubs(:default_page_accessible => true)
          end

          should 'redirect to the default page' do
            get :bootstrap, id: 'data-iden', app: 'dataCards'
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
                status: '200', body: { publisher: [], user: [] }
              }
            )

            get :bootstrap, id: 'data-iden', app: 'dataCards'
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

            get :bootstrap, id: 'data-iden', app: 'dataCards'
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
                body: v1_mock_dataset_metadata.deep_dup.tap { |dataset_metadata| dataset_metadata[:defaultPage] = 'lost-page' }
              },
              fetch_pages_for_dataset: {
                status: '404', body: ''
              }
            )

            get :bootstrap, id: 'data-iden', app: 'dataCards'
            assert_redirected_to('/view/abcd-efgh')
          end
        end

        context 'default page is set and is present in publisher pages but does not actually exist' do

          setup do
            # default page is set
            stub_request(:get, 'http://127.0.0.1:2401/v1/id/data-iden/dataset').
              to_return(
                :status => 200,
                :body => v1_mock_dataset_metadata.deep_dup.
                  tap { |dataset_metadata| dataset_metadata[:defaultPage] = 'lost-page' }.to_json.to_s)

            # default page is present in pages
            stub_request(:get, 'http://127.0.0.1:2401/v1/id/data-iden/pages').
              to_return(
                :status => 200,
                :body => {
                  'lost-page' => {
                    'pageId' => 'lost-page',
                    'version' => 1
                  }
                }.to_json.to_s)

            # default page does not exist
            stub_request(:get, 'http://127.0.0.1:2401/v1/pages/lost-page').
              to_return(:status => 404)

            stub_request(:get, 'http://localhost:2401/v1/id/data-iden/dataset').
              to_return(
                :status => 200,
                :body => v1_mock_dataset_metadata.deep_dup.
                  tap { |dataset_metadata| dataset_metadata[:defaultPage] = 'lost-page' }.to_json.to_s)

            stub_request(:get, 'http://localhost:2401/v1/id/data-iden/pages').
              to_return(
                :status => 200,
                :body => {
                  'lost-page' => {
                    'pageId' => 'lost-page',
                    'version' => 1
                  }
                }.to_json.to_s)

            Phidippides.any_instance.stubs(
              log_datalens_access: nil
            )
          end

          should 'create a new default page, update page metadata, and redirect' do

            # Create new default page
            @page_metadata_manager.
              expects(:create).
              with { |page_metadata| page_metadata['datasetId'] == 'data-iden' }.
              returns({
                  status: '200',
                  body: { pageId: 'abcd-efgh' }
                })

            # Update dataset with new default page
            @phidippides.
              expects(:update_dataset_metadata).
              with { |dataset_metadata| dataset_metadata[:defaultPage] == 'abcd-efgh' }.
              returns({ status: '200' })

            @controller.stubs(page_accessible?: false)

            get :bootstrap, id: 'data-iden', app: 'dataCards'

            # Redirect to new default page
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

            get :bootstrap, id: 'data-iden', app: 'dataCards'
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
            @controller.stubs(
              page_accessible?: true
            )
            @phidippides.expects(:update_dataset_metadata).
              returns({ status: '200' }).
              with do |dataset_metadata|
                dataset_metadata[:defaultPage] == 'neww-page'
              end
            stub_fetch_dataset_metadata_without_default_page_and_fetch_pages_for_dataset
            get :bootstrap, id: 'four-four', app: 'dataCards'
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
          get :bootstrap, id: 'four-four', app: 'dataCards'
          assert_redirected_to('/datasets/four-four')
          assert_equal(@controller.flash[:error], 'A preview is not available for this dataset.')
        end

        should 'return 404 if dataset does not exist' do
          @phidippides.stubs(
            fetch_dataset_metadata: {
              status: '404', body: { error: {} }
            }
          )
          get :bootstrap, id: 'four-four', app: 'dataCards'
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

            get :bootstrap, id: 'four-four', app: 'dataCards'
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

            get :bootstrap, id: 'four-four', app: 'dataCards'
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

            get :bootstrap, id: 'four-four', app: 'dataCards'
          end

          should 'not create a card for a latitude or longitude column' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              },
              update_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              }
            )

            @page_metadata_manager.expects(:create).with do |page, _|
              is_latitude = lambda { |fieldName| fieldName =~ /latitude/ }
              assert(page['cards'].pluck('fieldName').map(&:downcase).none?(&is_latitude))
              is_longitude = lambda { |fieldName| fieldName =~ /latitude/ }
              assert(page['cards'].pluck('fieldName').map(&:downcase).none?(&is_longitude))
            end.returns(status: '200', body: { pageId: 'neoo-page' })

            get :bootstrap, id: 'four-four', app: 'dataCards'
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

            get :bootstrap, id: 'four-four', app: 'dataCards'
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

            get :bootstrap, id: 'four-four', app: 'dataCards'
          end

          context 'on point columns' do

            is_point_column = lambda { |fieldName| fieldName == 'location' }

            setup do
              @mock_cardinality_metadata = v1_mock_dataset_metadata.deep_dup
              @mock_cardinality_metadata['columns']['location']['cardinality'] = 1000
              @mock_cardinality_metadata['columns']['location']['physicalDatatype'] = 'point'
              @phidippides.stubs(
                  update_dataset_metadata: {
                  status: '200', body: v1_mock_dataset_metadata
                }
              )
            end

            should 'not create any cards for point columns with insufficient cardinality' do
              @mock_cardinality_metadata['columns']['location']['cardinality'] = 1

              @phidippides.stubs(
                fetch_dataset_metadata: { status: '200', body: @mock_cardinality_metadata }
              )

              @page_metadata_manager.expects(:create).with do |page, _|
                assert_equal(10, page['cards'].length, 'Should create 10 cards')

                assert(
                  page['cards'].pluck('fieldName').map(&:downcase).none?(&is_point_column),
                  'should omit point column cards when the location has insufficient cardinality'
                )
              end.returns(status: '200', body: { pageId: 'neoo-page' })

              get :bootstrap, id: 'four-four', app: 'dataCards'
            end

            should 'create point column cards for columns with sufficient cardinality' do
              @phidippides.stubs(
                fetch_dataset_metadata: { status: '200', body: @mock_cardinality_metadata }
              )

              @page_metadata_manager.expects(:create).with do |page, _|
                assert_equal(10, page['cards'].length, 'Should create 10 cards')

                assert(
                  page['cards'].pluck('fieldName').map(&:downcase).any?(&is_point_column),
                  'should include point column cards when the location has sufficient cardinality'
                )
              end.returns(status: '200', body: { pageId: 'neoo-page' })

              get :bootstrap, id: 'four-four', app: 'dataCards'
            end

          end

          context 'choropleths' do
            setup do
              @phidippides.stubs(
                update_dataset_metadata: {
                  status: '200', body: v1_mock_dataset_metadata
                },
                fetch_dataset_metadata: { status: '200', body: v1_mock_dataset_metadata }
              )
            end

            should 'not create cards for computed columns that reference disabled curated regions' do
              CuratedRegion.stubs(find_by_view_id: CuratedRegion.new)
              CuratedRegion.any_instance.stubs(disabled?: true)

              @page_metadata_manager.expects(:create).with do |page, _|
                assert_equal(10, page['cards'].length, 'Should create 10 cards')
                is_choropleth = lambda { |fieldName| fieldName =~ /(other_)?computed/ }

                assert(
                  page['cards'].pluck('fieldName').map(&:downcase).none?(&is_choropleth),
                  'expected no choropleth cards to be bootstrapped due to curated regions being disabled'
                )
              end.returns(status: '200', body: { pageId: 'neoo-page' })

              get :bootstrap, id: 'four-four', app: 'dataCards'
            end

            should 'create cards for computed columns that reference enabled curated regions' do
              CuratedRegion.stubs(find_by_view_id: CuratedRegion.new)
              CuratedRegion.any_instance.stubs(disabled?: false)

              @page_metadata_manager.expects(:create).with do |page, _|
                assert_equal(10, page['cards'].length, 'Should create 10 cards')
                is_choropleth = lambda { |fieldName| fieldName =~ /(other_)?computed/ }

                assert(
                  page['cards'].pluck('fieldName').map(&:downcase).any?(&is_choropleth),
                  'expected choropleths to be bootstrapped'
                )
              end.returns(status: '200', body: { pageId: 'neoo-page' })

              get :bootstrap, id: 'four-four', app: 'dataCards'
            end

            should 'not fail if fetching the curated region errors' do
              CuratedRegion.
                expects(:find_by_view_id).
                at_least_once.
                raises(CoreServer::ResourceNotFound)

              @page_metadata_manager.expects(:create).with do |page, _|
                assert_equal(10, page['cards'].length, 'Should create 10 cards')
                is_choropleth = lambda { |fieldName| fieldName =~ /(other_)?computed/ }

                assert(
                  page['cards'].pluck('fieldName').map(&:downcase).none?(&is_choropleth),
                  'expected no choropleth cards to be bootstrapped due to curated region call failing'
                )
              end.returns(status: '200', body: { pageId: 'neoo-page' })

              get :bootstrap, id: 'four-four', app: 'dataCards'
            end
          end

          should 'not create a card for columns with no valid card types' do
            @phidippides.stubs(
              fetch_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              },
              update_dataset_metadata: {
                status: '200', body: v1_mock_dataset_metadata
              }
            )

            @page_metadata_manager.expects(:create).with do |page, _|
              is_invalid_card = lambda { |fieldName| fieldName =~ /wacko_card_type/ }
              assert(page['cards'].pluck('fieldName').map(&:downcase).none?(&is_invalid_card))
            end.returns(status: '200', body: { pageId: 'neoo-page' })

            get :bootstrap, id: 'four-four', app: 'dataCards'
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

  def v1_mock_dataset_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-bootstrap-dataset-metadata.json")).with_indifferent_access
  end

end
