var gulp = require('gulp');

gulp.task('socrata-components', require('./tasks/socrata-components.js'));

gulp.task('prototypes', ['clean', 'socrata-components', 'move'], require('./tasks/prototypes.js'));

gulp.task('clean', [], require('./tasks/clean.js'));

gulp.task('move', ['clean', 'socrata-components'], require('./tasks/move.js'));

gulp.task('default', ['clean', 'socrata-components', 'prototypes']);
