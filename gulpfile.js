'use strict';
var gulp   = require('gulp'),
    $      = require('gulp-load-plugins')({ camelize: true }),
    sprite = require('css-sprite').stream,
    path   = require('path'),
    merge  = require('merge-stream');

var sass = function(src, dest) {
  var dest  = dest ? dest : path.dirname(src);
  return gulp.src(src)
    .pipe($.plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
    }}))
    .pipe($.rubySass({
      style: 'expanded',
      bundleExec: true
    }))
    .pipe($.pleeease({
      autoprefixer: {
        browsers: ['last 5 version','Firefox >= 20','ie 8','ie 9']
      },
      minifier: false,
    }))
    .pipe(gulp.dest(dest));
}

// Stylesheets
gulp.task('css', function(){
  return merge(
    sass('public/hoge/css/*.scss'),
    sass('public/foo/css/*.scss'),
    sass('public/bar/*.scss', 'public/bar/css')
  )
});

gulp.task('watch', function() {
  gulp.watch('public/**/*.scss', ['css']);
});

gulp.task('default', ['css']);
