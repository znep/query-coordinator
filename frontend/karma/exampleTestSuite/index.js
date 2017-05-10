import { FeatureFlags } from 'common/feature_flags';

FeatureFlags.useTestFixture({
  enable_turboencabulator: true
});

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
