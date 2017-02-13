require 'rails_helper'

describe ApplicationHelper do
  include TestHelperMethods

  describe 'render_feature_flags_for_javascript' do
    let(:flags) do
      {
        'foo_flag:' => 'bar_value_with_$pecial_chars{}"\\'
      }
    end

    before do
      allow(FeatureFlags).to receive(:derive).and_return(flags)
    end

    it 'renders feature flags into window.socrata.featureFlags' do
      rendered_value = render_feature_flags_for_javascript
      expect(rendered_value).to eq(%q(<script id="feature-flags">
//<![CDATA[

        window.socrata = window.socrata || {};
        window.socrata.featureFlags =
         {"foo_flag:":"bar_value_with_$pecial_chars{}\"\\\\"};
      
//]]>
</script>)
      )
    end
  end

  describe '#suppress_govstat?', :verify_stubs => false do

    let(:current_user) { double('current_user') }
    let(:member_response) { false }

    before do
      allow(helper).to receive(:current_user).and_return(current_user)
      allow(CurrentDomain).to receive(:member?).with(current_user).and_return(member_response)
    end

    context 'when response from CurrentDomain is nil' do
      let(:member_response) { nil }

      it 'returns true' do
        expect(suppress_govstat?).to eq(true)
      end
    end

    context 'when response from CurrentDomain is false' do
      let(:member_response) { false }

      it 'returns true' do
        expect(suppress_govstat?).to eq(true)
      end
    end

    context 'when response from CurrentDomain is true' do
      let(:member_response) { true }

      it 'returns false' do
        expect(suppress_govstat?).to eq(false)
      end

      context 'when @suppress_govstat is true' do
        before do
          @suppress_govstat = true
        end

        it 'returns true' do
          expect(suppress_govstat?).to eq(true)
        end
      end
    end

  end

  describe '#apply_custom_css?' do
    let(:custom_css) { 'body { color: rebeccapurple; }' }
    let(:govstat_enabled) { false }
    let(:action_name) { 'anything' }
    let(:using_dataslate) { false }
    let(:on_homepage) { false }
    let(:suppress_govstat) { false }

    before do
      allow(CurrentDomain)
        .to receive(:properties)
        .and_return(double(:custom_css => custom_css))

      allow_any_instance_of(ApplicationHelper)
        .to receive(:module_enabled?)
        .with(:govStat)
        .and_return(govstat_enabled)

      allow_any_instance_of(ApplicationHelper)
        .to receive(:suppress_govstat?)
        .and_return(suppress_govstat)

      @using_dataslate = using_dataslate
      @on_homepage = on_homepage
    end

    context 'when custom_css is blank' do
      let(:custom_css) { '' }

      it 'does not apply custom_css' do
        expect(apply_custom_css?).to eq(false)
      end
    end

    context 'when custom_css is not blank' do
      context 'when govStat is not enabled' do
        let(:govstat_enabled) { false }

        it 'applies custom_css' do
          expect(apply_custom_css?).to eq(true)
        end
      end

      context 'when govStat is enabled' do
        let(:govstat_enabled) { true }

        context 'when action is "chromeless"' do
          let(:action_name) { 'chromeless' }

          it 'does not apply custom_css' do
            expect(apply_custom_css?).to eq(false)
          end
        end

        context 'when action is not "chromeless"' do
          context 'when using dataslate and we\'re on the homepage' do
            let(:using_dataslate) { true }
            let(:on_homepage) { true }

            it 'applies custom_css' do
              expect(apply_custom_css?).to eq(true)
            end
          end

          context 'when not using dataslate or not on the homepage' do
            context 'when suppressing govstat' do
              let(:suppress_govstat) { true }

              it 'applies custom css' do
                expect(apply_custom_css?).to eq(true)
              end
            end

            context 'when not suppressing govstat' do
              let(:suppress_govstat) { false }

              it 'does not apply custom css' do
                expect(apply_custom_css?).to eq(false)
              end
            end
          end
        end
      end
    end
  end

  describe '#dataset_landing_page_enabled?' do

    let(:site_chrome_find_double) do
      double.tap { |site_chrome| allow(site_chrome).to receive(:dslp_enabled?).and_return(dslp_enabled) }
    end

    before do
      allow(SiteAppearance).to receive(:find).and_return(site_chrome_find_double)
    end

    context 'site chrome is activated' do
      let(:dslp_enabled) { true }

      it 'returns true' do
        helper.request.cookies[:socrata_site_chrome_preview] = false
        expect(dataset_landing_page_enabled?).to eq(true)
      end
    end

    context 'site chrome is not activated' do
      let(:dslp_enabled) { false }

      it 'is true if in site chrome preview mode' do
        helper.request.cookies[:socrata_site_chrome_preview] = true
        expect(dataset_landing_page_enabled?).to eq(true)
      end

      it 'is false not in site chrome preview mode' do
        helper.request.cookies[:socrata_site_chrome_preview] = false
        expect(dataset_landing_page_enabled?).to eq(false)
      end
    end

  end

  describe 'using_cetera? when feature flag is set' do

    let(:cetera_internal_uri) { 'http://localhost:1234' }
    let(:controller_name) { 'browse' }
    let(:action_name) { 'show' }

    before do
      init_current_domain
      allow(FeatureFlags).to receive(:using_signaller?).and_return(false)
      allow(FeatureFlags.derive).to receive(:cetera_search?).and_return(true)
      allow(APP_CONFIG).to receive(:cetera_internal_uri).and_return(cetera_internal_uri)
      allow(helper).to receive(:controller_name).and_return(controller_name)
      allow(helper).to receive(:action_name).and_return(action_name)
    end

    context 'cetera_internal_uri is not set' do
      let(:cetera_internal_uri) { nil }
      it 'should be false' do
        expect(helper.using_cetera?).to eq(false)
      end
    end

    context 'cetera_internal_uri is set' do
      it 'should be true' do
        expect(helper.using_cetera?).to eq(true)
      end

      context 'cetera_internal_uri syntax is incorrect' do
        let(:cetera_internal_uri) { 'localhost' }
        it 'should be false' do
          expect(Rails.logger).to receive(:error)
          expect(helper.using_cetera?).to eq(false)
        end
      end
    end

    context 'on profile controller' do
      let(:controller_name) { 'profile' }
      it 'should be false' do
        expect(helper.using_cetera?).to eq(false)
      end
    end

    context 'on browse controller' do
      context 'action is select_dataset' do
        let(:action_name) { 'select_dataset' }
        it 'should be false' do
          expect(helper.using_cetera?).to eq(false)
        end
      end
      context 'action is not select_dataset' do
        it 'should be true' do
          expect(helper.using_cetera?).to eq(true)
        end
      end
    end

    context 'on administration controller' do
      let(:controller_name) { 'administration' }
      context 'action is not home' do
        it 'should be false' do
          expect(helper.using_cetera?).to eq(false)
        end
      end
      context 'action is home' do
        let(:action_name) { 'home' }
        it 'should be false' do
          expect(helper.using_cetera?).to eq(true)
        end
      end
    end

    context 'included in non-controller classes' do
      before do
        helper.instance_eval do
          undef :controller_name, :action_name, :request
        end
      end

      after do
        helper.class_eval do
          attr_accessor :controller_name, :action_name, :request
        end
      end

      it 'should be true' do
        expect(helper.using_cetera?).to eq(true)
      end
    end

    context 'in date helpers' do
      let(:timestamp) { 1480410000 }
      context 'for short_date_span' do
        it 'returns a span containing the time formatted as %b %-d %Y' do
          expect(helper.short_date_span(timestamp)).to eq('<span class="dateLocalize" data-format="ll" data-rawdatetime="1480410000">Nov 29 2016</span>')
        end
      end
      context 'for long_date_span' do
        it 'returns a span containing the time formatted as %B %-d %Y' do
          expect(helper.long_date_span(timestamp)).to eq('<span class="dateLocalize" data-format="LL" data-rawdatetime="1480410000">November 29 2016</span>')
        end
      end
      context 'for date_time_span' do
        it 'returns a span containing the time formatted as %B %-d %Y %I:%M %P' do
          expect(helper.date_time_span(timestamp)).to match(/<span class="dateLocalize" data-format="LLL" data-rawdatetime="1480410000">November 29 2016 \d{2}:\d{2} [ap]m<\/span>/)
        end
      end
      context 'for format_date' do
        it 'returns the default formatting of %b %-d %Y if an unknown format type is passed in' do
          expect(helper.format_date(timestamp, 'foo')).to eq('Nov 29 2016')
        end
      end
      context 'for get_epoch' do
        it 'returns nil if the input type is not Integer, String, Time, or Date' do
          expect(helper.get_epoch({})).to eq(nil)
        end
        it 'returns the correct epoch time if the input type is an Integer' do
          expect(helper.get_epoch(timestamp)).to eq(timestamp)
        end
        it 'returns the correct epoch time if the input type is a String' do
          expect(helper.get_epoch('2016-11-29 01:00:00 -0800')).to eq(timestamp)
        end
        it 'returns the correct epoch time if the input type is a Time object' do
          expect(helper.get_epoch(Time.parse('2016-11-29 01:00:00 -0800'))).to eq(timestamp)
        end
        it 'returns the correct epoch time if the input type is a Date object' do
          # Returns a slightly different timestamp due to lack of H/M/S
          # 36000 = 10 hours; Jenkins and localhost are on different timezones
          expect(helper.get_epoch(Date.new(2016, 11, 29))).to be_within(36000).of(timestamp)
        end
        it 'returns the correct epoch time if the input type is a DateTime object' do
          expect(helper.get_epoch(DateTime.new(2016, 11, 29, 01, 00, 00, Rational(-8, 24)))).to eq(timestamp)
        end
      end
    end
  end

end
