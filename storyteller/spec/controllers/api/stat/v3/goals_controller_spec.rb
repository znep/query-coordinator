require 'rails_helper'

RSpec.describe Api::Stat::V3::GoalsController, type: :controller do
  before do
    request.env['HTTPS'] = 'on' # otherwise we get redirected to HTTPS for all requests.
  end

  let(:action) { :nothing }
  let(:goal_uid) { 'open-perf' } # This story exists in test seeds.
  let(:format) { 'json' }
  let(:get_request) { get action, uid: goal_uid, format: format }
  let(:is_goal_accessible) { true }
  let(:is_goal_unauthorized) { false }

  before do
    stub_current_domain
    set_features(['govstat'])
    stub_goal_accessibility(
      goal_uid,
      :accessible => is_goal_accessible,
      :unauthorized => is_goal_unauthorized
    )
  end

  describe '#index (format: json)' do
    let(:action) { :index }

    shared_examples 'accessible endpoint' do
      let(:odysseus_response) { instance_double(HttpResponse) }
      let(:odysseus_ok) { true }
      let(:odysseus_json) { [] }
      before do
        allow(OpenPerformance::Odysseus).to receive(:list_goals).and_return(odysseus_response)
        allow(odysseus_response).to receive(:ok?).and_return(odysseus_ok)
        allow(odysseus_response).to receive(:json).and_return(odysseus_json)
        get_request
        json_response = JSON.parse(response.body)
      end

      describe('ody is ok') do
        json_response = nil
        narrative = nil

        before do
          json_response = JSON.parse(response.body)
          narrative = json_response.length > 0 ? json_response[0]['narrative'] : nil
        end

        it '200s' do
          expect(response.status).to be(200)
        end

        describe 'no goals' do
          it('returns an empty array') do
            expect(json_response).to eq([])
          end
        end

        describe 'goal with no revisions at all' do
          let(:odysseus_json) {[
            { 'id' => 'noth-ingg' }
          ]}

          it('set draft to nil') do
            expect(narrative['draft']).to eq(nil)
          end

          it('set published to nil') do
            expect(narrative['published']).to eq(nil)
          end
        end

        describe 'goal with only a single draft' do
          let(:odysseus_json) {[
            { 'id' => 'open-perf' }
          ]}

          it('set draft to the draft details') do
            expect(narrative['draft']).to have_key('created_at') # Value varies
            expect(narrative['draft']).to include('created_by' => 'perf-lord')
          end

          it('set published to nil') do
            expect(narrative['published']).to eq(nil)
          end
        end

        describe 'goal with multiple drafts' do
          let(:odysseus_json) {[
            { 'id' => 'many-draf' }
          ]}

          it('set draft to the latest draft details') do
            expect(narrative['draft']).to include(
              'created_by' => 'time-trvl',
            )
            # Assert based on year to avoid timezone confusion.
            expect(Time.parse(narrative['draft']['created_at']).year).to eq(1988)
          end

          it('set published to nil') do
            expect(narrative['published']).to eq(nil)
          end
        end

        describe 'goal with a single published revision' do
          let(:odysseus_json) {[
            { 'id' => 'test-test' }
          ]}

          it('set draft to the draft details') do
            expect(narrative['draft']).to have_key('created_at') # Value varies
            expect(narrative['draft']).to include('created_by' => 'good-doer')
          end

          it('set published to the revision details') do
            expect(narrative['published']).to have_key('created_at') # Value varies
            expect(narrative['published']).to include('created_by' => 'good-doer')
          end
        end

        describe 'goal with multiple published revisions' do
          let(:odysseus_json) {[
            { 'id' => 'many-publ' }
          ]}

          it('set published to the revision details') do
            expect(narrative['published']).to include(
              'created_by' => 'neil-amst'
            )
            # Assert based on year to avoid timezone confusion.
            expect(Time.parse(narrative['published']['created_at']).year).to eq(2000)
          end
        end
      end

      describe('ody fails') do
        let(:odysseus_ok) { false }

        it '500s' do
          expect(response.status).to be(500)
        end
      end
    end

    shared_examples 'inaccessible endpoint' do
      it '403s' do
        get_request
        expect(response.status).to be(403)
      end
    end

    describe 'anon' do
      before do
        stub_invalid_session
      end

      it_behaves_like 'inaccessible endpoint'
    end

    describe 'logged in as' do
      before do
        stub_valid_session
        stub_current_user_story_authorization(auth)
      end

      describe 'unpriviledged' do
        let(:auth) { mock_user_authorization_unprivileged }
        it_behaves_like 'inaccessible endpoint'
      end

      describe 'with edit_goals right' do
        let(:auth) { mock_user_authorization_with_domain_rights(%w(edit_goals)) }
        it_behaves_like 'accessible endpoint'
      end

      describe 'without edit_goals right' do
        let(:auth) { mock_user_authorization_with_domain_rights(%w(something_else)) }
        it_behaves_like 'inaccessible endpoint'
      end
    end
  end

  describe '#index (format: csv)' do
    let(:action) { :index }
    let(:format) { 'csv' }

    shared_examples 'accessible endpoint' do
      header_row = 'Goal Title,Goal page link,Goal owner,Goal updated date,Visibility,Goal status,Goal status override,Dashboard name,Dashboard link,Category,Dataset Owner,Dataset updated date,Action,Subject,Kind,Range,Target value,Baseline value,Units,Range value,Range units,Start date,End date'.split(',')
      let(:odysseus_response) { instance_double(HttpResponse) }
      let(:odysseus_ok) { true }
      let(:visibility_index) { header_row.index('Visibility') }
      let(:visibility_claimed_by_procrustes) { 'Public' }
      let(:odysseus_csv) { [
        header_row,
        [
          'title',
          "https://example.com/stat/goals/default/cate-gory/#{goal_uid}",
          'owner',
          'update date',
          visibility_claimed_by_procrustes
        ]
      ] }
      before do
        allow(OpenPerformance::Odysseus).to receive(:list_goals).and_return(odysseus_response)
        allow(odysseus_response).to receive(:ok?).and_return(odysseus_ok)
        allow(odysseus_response).to receive(:csv).and_return(odysseus_csv)
        get_request
      end

      describe('ody is ok') do
        csv_response = nil
        narrative = nil
        returned_visibility = nil

        before do
          csv_response = CSV.parse(response.body)
          returned_visibility = csv_response.length > 1 ? csv_response[1][visibility_index] : nil
        end

        it '200s' do
          expect(response.status).to be(200)
        end

        describe 'no goals' do
          let(:odysseus_csv) { [ header_row ] }
          it('returns just the header') do
            expect(csv_response).to eq([ header_row ])
          end
        end

        describe 'public goal with no revisions at all' do
          let(:visibility_claimed_by_procrustes) { 'Public' }
          let(:goal_uid) { 'noth-ingg' }

          it('sets Visibility to Public') do
            expect(returned_visibility).to eq('Public')
          end
        end

        describe 'private goal with only a single draft' do
          let(:visibility_claimed_by_procrustes) { 'Private' }
          let(:goal_uid) { 'open-perf' }

          it('sets Visibility to Private') do
            expect(returned_visibility).to eq('Private')
          end
        end

        describe 'private goal with multiple drafts' do
          let(:visibility_claimed_by_procrustes) { 'Private' }
          let(:goal_uid) { 'many-draf' }

          it('sets Visibility to Private') do
            expect(returned_visibility).to eq('Private')
          end
        end

        describe 'public goal with only drafts (aka, migrated but not published)' do
          let(:visibility_claimed_by_procrustes) { 'Public' }
          let(:goal_uid) { 'many-draf' }

          it('sets Visibility to Public (unpublished draft)') do
            expect(returned_visibility).to eq('Public (unpublished draft)')
          end
        end

        describe 'public goal with a draft newer than the published revision' do
          let(:visibility_claimed_by_procrustes) { 'Public' }
          let(:goal_uid) { 'neww-drft' }

          it('sets Visibility to Public (unpublished drafts)') do
            expect(returned_visibility).to eq('Public (unpublished draft)')
          end
        end

        describe 'private goal with a draft newer than the published revision' do
          let(:visibility_claimed_by_procrustes) { 'Private' }
          let(:goal_uid) { 'neww-drft' }

          it('sets Visibility to Private') do
            expect(returned_visibility).to eq('Private')
          end
        end
      end

      describe('ody fails') do
        let(:odysseus_ok) { false }

        it '500s' do
          expect(response.status).to be(500)
        end
      end
    end

    shared_examples 'inaccessible endpoint' do
      it '403s' do
        get_request
        expect(response.status).to be(403)
      end
    end

    describe 'anon' do
      before do
        stub_invalid_session
      end

      it_behaves_like 'inaccessible endpoint'
    end

    describe 'logged in as' do
      before do
        stub_valid_session
        stub_current_user_story_authorization(auth)
      end

      describe 'unpriviledged' do
        let(:auth) { mock_user_authorization_unprivileged }
        it_behaves_like 'inaccessible endpoint'
      end

      describe 'with edit_goals right' do
        let(:auth) { mock_user_authorization_with_domain_rights(%w(edit_goals)) }
        it_behaves_like 'accessible endpoint'
      end

      describe 'without edit_goals right' do
        let(:auth) { mock_user_authorization_with_domain_rights(%w(something_else)) }
        it_behaves_like 'inaccessible endpoint'
      end
    end
  end
end
