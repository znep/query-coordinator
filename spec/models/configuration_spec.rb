require 'rails_helper'

describe Configuration do

  include TestHelperMethods

  before do
    init_current_domain
  end

  describe 'caching' do

    context 'cache_key' do

      it 'builds the cache_key using the configuration type', :verify_stubs => false do
        allow(CurrentDomain).to receive(:configUpdatedAt).and_return(1477332981)
        cache_key_my_type = subject.class.cache_key('my_type')
        cache_key_other_type = subject.class.cache_key('other_type')
        expect(cache_key_my_type).to match(/configurations:my_type/)
        expect(cache_key_other_type).to_not match(/configurations:my_type/)
        expect(cache_key_other_type).to match(/configurations:other_type/)
      end

      it 'changes when configUpdatedAt changes', :verify_stubs => false do
        allow(CurrentDomain).to receive(:configUpdatedAt).and_return(1477332982)
        first_cache_key = subject.class.cache_key('site_chrome')
        allow(CurrentDomain).to receive(:configUpdatedAt).and_return(1477332983)
        expect(first_cache_key).to_not eq(subject.class.cache_key('site_chrome'))
      end

      it 'does not change when configUpdatedAt is the same', :verify_stubs => false do
        allow(CurrentDomain).to receive(:configUpdatedAt).and_return(1477332982)
        expect(subject.class.cache_key('site_chrome')).to eq(subject.class.cache_key('site_chrome'))
      end

    end

    context 'find_by_type' do

      it 'calls core only once for a given type', :verify_stubs => false do
        begin
          Rails.cache = ActiveSupport::Cache::MemoryStore.new
          Rails.cache.clear
          allow(CurrentDomain).to receive(:configUpdatedAt).and_return(1477332984)
          expect(CoreServer::Base.connection).to receive(:get_request).once.and_return(site_chrome_response)
          config = subject.class.find_by_type('site_chrome', default_only = true, CurrentDomain.cname)
          expect(config.type).to eq('site_chrome')
          subject.class.find_by_type('site_chrome', default_only = true, CurrentDomain.cname)
          subject.class.find_by_type('site_chrome', default_only = true, CurrentDomain.cname)
          subject.class.find_by_type('site_chrome', default_only = true, CurrentDomain.cname)

          Rails.cache.clear
        ensure
          Rails.cache = ActiveSupport::Cache::NullStore.new
        end
      end

      it 'does not cache when cname is nil', :verify_stubs => false do
        begin
          Rails.cache = ActiveSupport::Cache::MemoryStore.new
          Rails.cache.clear
          allow(CurrentDomain).to receive(:configUpdatedAt).and_return(1477332984)
          expect(CoreServer::Base.connection).to receive(:get_request).twice.and_return(site_chrome_response)
          config = subject.class.find_by_type('site_chrome', default_only = true, nil)
          expect(config.type).to eq('site_chrome')
          subject.class.find_by_type('site_chrome', default_only = true, nil)

          Rails.cache.clear
        ensure
          Rails.cache = ActiveSupport::Cache::NullStore.new
        end
      end

    end

  end

  def site_chrome_response
    @site_chrome_response ||= File.read('spec/fixtures/site_chrome.json')
  end

end
