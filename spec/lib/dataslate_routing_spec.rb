require 'rails_helper'
require_relative '../../lib/dataslate_routing'

describe DataslateRouting do
  before(:each) do
    # We're not testing this method.
    allow_any_instance_of(DataslateRouting).to receive(:scrape_pages_dataset_for_paths!).
      and_return(nil)
  end

  describe '.for' do
    it 'gives a Routing object when given a string' do
      expect(DataslateRouting.for('cname')).to be_a(DataslateRouting)
    end

    it 'gives a Routing object when given a domain' do
      domain = Domain.new({ 'cname' => 'some.cname'})
      expect(DataslateRouting.for(domain)).to be_a(DataslateRouting)
    end
  end

  describe '#page_for' do
    subject { DataslateRouting.for('some.cname') }

    before(:each) do
      allow(Page).to receive(:find_by_unique_path).and_return(unique_path_response)
      allow_any_instance_of(DataslateRouting).to receive(:fetch_from_pages_dataset).
        and_return(pages_dataset_response)
      allow(Page).to receive(:find_by_uid).and_return(uid_response)

      subject.instance_variable_set :@pages, pages
      subject.instance_variable_set :@ds_paths, ds_paths
    end

    let(:pages) { {} }
    let(:ds_paths) { {} }

    let(:unique_path_response) { Page.new }
    let(:pages_dataset_response) { Page.new }
    let(:uid_response) { Page.new }

    context 'when @pages is empty' do
      context 'but @ds_paths is also empty' do
        it 'should attempt to speak to the Pages Service' do
          expect(Page).to receive(:find_by_unique_path).once
          expect(subject).to receive(:fetch_from_pages_dataset).never
          subject.page_for('/some_path')
        end
      end

      context 'and @ds_paths is not empty and Pages Service responds with 404' do
        let(:ds_paths) { { '/some_path' => '/some_path' } }
        let(:unique_path_response) { nil }

        it 'should attempt to fetch from the Pages Dataset after attempting the Pages Service' do
          expect(Page).to receive(:find_by_unique_path).once
          expect(subject).to receive(:fetch_from_pages_dataset).once
          subject.page_for('/some_path')
        end
      end
    end

    context 'when @pages is not empty and @ds_paths is not empty' do
      let(:pages) { { '/some_path' => Page.new } }
      let(:ds_paths) { { '/some_path' => '/some_path' } }

      it 'should attempt to fetch from the Pages Dataset' do
        expect(Page).to receive(:find_by_unique_path).never
        expect(subject).to receive(:fetch_from_pages_dataset).once
        subject.page_for('/some_path')
      end
    end

    context 'when Pages Service-served page is cached' do
      let(:pages) { { '/some_path' => current_page } }
      let(:current_page) { Page.new }

      it 'should test for cache status' do
        allow(Page).to receive(:last_updated_at).and_return(Time.now)
        expect(Page).to receive(:last_updated_at).once

        allow(current_page).to receive(:updated_at).and_return(Time.now.to_i)
        expect(current_page).to receive(:updated_at).once

        subject.page_for('/some_path')
      end

      it 'should attempt to fetch by UID if cache is stale' do
        allow(Page).to receive(:last_updated_at).and_return(Time.now)
        allow(current_page).to receive(:updated_at).and_return(Time.now.to_i - 1000)

        expect(Page).to receive(:find_by_uid).once

        subject.page_for('/some_path')
      end

      it 'should not attempt to fetch by UID if cache is not stale' do
        allow(Page).to receive(:last_updated_at).and_return(Time.now)
        allow(current_page).to receive(:updated_at).and_return(Time.now.to_i + 1000)

        expect(Page).to receive(:find_by_uid).never

        subject.page_for('/some_path')
      end
    end
  end
end
