// A lot of singleton objects in Storyteller read things off of window at module load time.
// This file is directly loaded by Karma before any webpacked bundle to eliminate any
// timing issues.

// When singletons use anything environmental to enable successful instantiation, there will need to be a
// corresponding variable here.
window.PRIMARY_OWNER_UID = 'test-test';
window.STORY_UID = 'what-what';

