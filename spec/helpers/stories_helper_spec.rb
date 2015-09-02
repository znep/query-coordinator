require 'rails_helper'

RSpec.describe StoriesHelper, type: :helper do

  describe '#component_partial_name' do
    it 'returns a mapping for valid component types' do
      valid_component_types = [
        'html',
        'youtube.video',
        'socrata.visualization.columnChart',
        'assetSelector'
      ]

      valid_component_types.each do |component_type|
        expect {
          component_partial_name(component_type)
        }.not_to raise_error
      end
    end

    it 'raises an error for invalid component types' do
      expect {
        component_partial_name('invalid.type')
      }.to raise_error(RuntimeError)
    end
  end

  describe '#type_to_class_name_for_component_type' do
    it 'removes `.`s, underscores, and capital letters' do
      class_name = type_to_class_name_for_component_type("socrata.visualization.columnChart")

      expect(class_name).not_to match(/\./)
      expect(class_name).not_to match(/_/)
      expect(class_name).not_to match(/[A-Z]/)
    end

    it 'turns camel case into dashes' do
      expect(
        type_to_class_name_for_component_type('MySpecialThing')
      ).to eq('component-my-special-thing')
    end

    it 'handles mixed dashes .Capitals and camelCase' do
      expect(
        type_to_class_name_for_component_type('prefix-WOO.MySpecialThing-also-with-dashes')
      ).to eq('component-prefix-woo-my-special-thing-also-with-dashes')
    end
  end

  describe '#component_container_classes' do
    it 'adds a `component-container` class' do
      expect(
        component_container_classes('6')
      ).to match(/component-container /)
    end

    it 'adds a class for col width' do
      expect(
        component_container_classes('6')
      ).to match(/col6/)
    end
  end

  describe '#component_classes' do
    it 'adds a `component` class' do
      expect(
        component_classes('youtube.video')
      ).to match(/component /)
    end

    it 'calls `type_to_class_name_for_component_type`' do
      expect(helper).to receive(:type_to_class_name_for_component_type).with('youtube.video')
      helper.component_classes('youtube.video')
    end
  end

end
