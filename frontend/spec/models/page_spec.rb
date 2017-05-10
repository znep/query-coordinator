require 'rails_helper'

describe Page do
  describe '#viewable_by?' do
    let(:anon) { nil }
    let(:unprivileged) {
      user = double('unprivileged user')
      allow(user).to receive(:id).and_return('some-prsn')
      allow(user).to receive(:rights).and_return([])
      allow(user).to receive(:has_right?).and_return(false)
      user
    }
    let(:editor_not_owner) {
      user = double('roled not owner')
      allow(user).to receive(:id).and_return('roll-roll')
      allow(user).to receive(:rights).and_return([UserRights::EDIT_PAGES])
      allow(user).to receive(:has_right?) do |right|
        right == UserRights::EDIT_PAGES
      end
      user
    }
    let(:editor_owner) {
      user = double('owner roled')
      allow(user).to receive(:id).and_return(owner_id)
      allow(user).to receive(:rights).and_return([UserRights::EDIT_PAGES])
      allow(user).to receive(:has_right?) do |right|
        right == UserRights::EDIT_PAGES
      end
      user
    }
    let(:unroled_owner) {
      user = double('owner unprivileged')
      allow(user).to receive(:id).and_return(owner_id)
      allow(user).to receive(:rights).and_return([])
      allow(user).to receive(:has_right?).and_return(false)
      user
    }

    let(:owner_id) { 'bigg-boss' }

    subject {
      Page.new(
        'permission' => permission,
        'owner' => owner_id
      ).viewable_by?(user)
    }

    context 'public permission' do
      let(:permission) { 'public' }

      context 'anonymous' do
        let(:user) { anon }
        it 'returns true' do
          expect(subject).to be(true)
        end
      end

      context 'unprivileged' do
        let(:user) { unprivileged }
        it 'returns true' do
          expect(subject).to be(true)
        end
      end

      context 'EDIT_PAGES role but not owner' do
        let(:user) { editor_not_owner }
        it 'returns true' do
          expect(subject).to be(true)
        end
      end

      context 'EDIT_PAGES role and owner' do
        let(:user) { editor_owner }
        it 'returns true' do
          expect(subject).to be(true)
        end
      end

      context 'unroled owner' do
        let(:user) { unroled_owner }
        it 'returns true' do
          expect(subject).to be(true)
        end
      end
    end

    context 'private permission' do
      let(:permission) { 'private' }

      context 'anonymous' do
        let(:user) { anon }
        it 'returns false' do
          expect(subject).to be(false)
        end
      end

      context 'unprivileged' do
        let(:user) { unprivileged }
        it 'returns false' do
          expect(subject).to be(false)
        end
      end

      context 'EDIT_PAGES role but not owner' do
        let(:user) { editor_not_owner }
        it 'returns true' do
          expect(subject).to be(true)
        end
      end

      context 'EDIT_PAGES role and owner' do
        let(:user) { editor_owner }
        it 'returns true' do
          expect(subject).to be(true)
        end
      end

      context 'unroled owner' do
        let(:user) { unroled_owner }
        it 'returns true' do
          expect(subject).to be(true)
        end
      end
    end

    context 'domain_private permission' do
      let(:permission) { 'domain_private' }

      context 'anonymous' do
        let(:user) { anon }
        it 'returns false' do
          expect(subject).to be(false)
        end
      end

      context 'unprivileged' do
        let(:user) { unprivileged }
        it 'returns false' do
          expect(subject).to be(false)
        end
      end

      context 'EDIT_PAGES role but not owner' do
        let(:user) { editor_not_owner }
        it 'returns true' do
          expect(subject).to be(true)
        end
      end

      context 'EDIT_PAGES role and owner' do
        let(:user) { editor_owner }
        it 'returns true' do
          expect(subject).to be(true)
        end
      end

      context 'unroled owner' do
        let(:user) { unroled_owner }
        it 'returns true' do
          expect(subject).to be(true)
        end
      end
    end
  end
end
