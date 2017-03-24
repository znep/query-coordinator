require 'rails_helper'

describe BrowserTypeHelper do
  shared_examples 'a helper which correctly identifies the browser type'  do
    it'returns the correct info for a user agent string' do
      browser = browser_from_user_agent(user_agent)
      expect(browser[:family]).to eq(family)
      expect(browser[:version]).to eq(version)
      expect(browser[:mobile]).to eq(mobile)
    end
  end

  shared_examples 'a helper which correctly identifies both desktop and mobile browsers'  do
    describe 'Desktop' do
      let(:mobile) { false }
      let(:user_agent) { desktop_user_agent }
      let(:version) { desktop_version }

      it_behaves_like 'a helper which correctly identifies the browser type'
    end

    describe 'Mobile' do
      let(:mobile) { true }
      let(:user_agent) { mobile_user_agent }
      let(:version) { mobile_version }

      it_behaves_like 'a helper which correctly identifies the browser type'
    end
  end

  describe 'Chrome' do
    describe 'Chromium' do
      let(:family) { 'chrome' }
      let(:version) { '27' }
      let(:mobile) { false }
      let(:user_agent) { 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.11 (KHTML, like Gecko) Ubuntu/11.10 Chromium/27.0.1453.93 Chrome/27.0.1453.93 Safari/537.36' }

      it_behaves_like 'a helper which correctly identifies the browser type'
    end

    let(:family) { 'chrome' }
    let(:desktop_version) { '27' }
    let(:desktop_user_agent) { 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.94 Safari/537.36' }

    let(:mobile_version) { '18' }
    let(:mobile_user_agent) { 'Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19' }

    it_behaves_like 'a helper which correctly identifies both desktop and mobile browsers'
  end

  describe 'Firefox' do
    let(:family) { 'firefox' }
    let(:desktop_version) { '21' }
    let(:desktop_user_agent) { 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20100101 Firefox/21.0' }
    let(:mobile_version) { '14' }
    let(:mobile_user_agent) { 'Mozilla/5.0 (Android; Mobile; rv:14.0) Gecko/14.0 Firefox/14.0' }

    it_behaves_like 'a helper which correctly identifies both desktop and mobile browsers'
  end

  describe 'IE' do
    let(:family) { 'ie' }
    let(:desktop_version) { '10' }
    let(:desktop_user_agent) { 'Mozilla/5.0 (compatible; WOW64; MSIE 10.0; Windows NT 6.2)' }
    let(:mobile_version) { '10' }
    let(:mobile_user_agent) { 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)' }

    it_behaves_like 'a helper which correctly identifies both desktop and mobile browsers'
  end

  describe 'Safari' do
    let(:family) { 'safari' }
    let(:desktop_version) { '5' }
    let(:desktop_user_agent) { 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; en-US) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27' }
    let(:mobile_version) { '5' }
    let(:mobile_user_agent) { 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3' }

    it_behaves_like 'a helper which correctly identifies both desktop and mobile browsers'
  end

  describe 'Other' do
    describe 'Empty String' do
      let(:family) { 'other' }
      let(:version) { nil }
      let(:mobile) { false }
      let(:user_agent) { '' }

      it_behaves_like 'a helper which correctly identifies the browser type'
    end

    describe 'nil' do
      let(:family) { 'other' }
      let(:version) { nil }
      let(:mobile) { false }
      let(:user_agent) { nil }

      it_behaves_like 'a helper which correctly identifies the browser type'
    end

    describe 'Blackberry' do
      let(:family) { 'other' }
      let(:version) { nil }
      let(:mobile) { true }
      let(:user_agent) { 'Mozilla/5.0 (PlayBook; U; RIM Tablet OS 2.1.0; en-US) AppleWebKit/536.2+ (KHTML, like Gecko) Version/7.2.1.0 Safari/536.2+' }

      it_behaves_like 'a helper which correctly identifies the browser type'
    end
  end
end

