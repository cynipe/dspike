'use strict';
var gulp   = require('gulp'),
    $      = require('gulp-load-plugins')({ camelize: true }),
    sprite = require('css-sprite').stream,
    path   = require('path'),
    merge  = require('merge-stream');

// FIXME 以下が対応されたらgulp-sourcemapsで生成する
// https://github.com/sindresorhus/gulp-ruby-sass/pull/137
// sourceMappingURLについても手動で入れなくても対応できるようになるはず
var sass = function(base) {
  var src        = path.join(base, 'scss'),
      dest       = path.join(base, 'css'),
      srcmapPath = path.join('..', 'scss'),
      cssPath = path.join(dest, 'style.css'),
      mapPath = path.basename(cssPath) + '.map',
      isCssFile = function(file) {
        return path.extname(file.path) === '.css'
      };

  return gulp.src(path.join(src, '*.scss'))
    .pipe($.plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
    }}))
    .pipe($.rubySass({
      style: 'compact',
      sourcemap: true,
      sourcemapPath: srcmapPath,
      bundleExec: true
    }))
    .pipe($.pleeease({
      autoprefixer: {
        browsers: ['last 5 version','Firefox >= 20','ie 8','ie 9']
      },
      minifier: false
    }))
    // sourceMappingURLが自動で入らないので.cssファイルの末尾に追記する
    .pipe($.if(isCssFile, $.footer('/*# sourceMappingURL=${mapPath} */', {mapPath: mapPath})))
    .pipe(gulp.dest(dest));
};

// Stylesheets
gulp.task('css', function() {
  return merge(
    sass('public/hoge')
  );
});

gulp.task('watch', function() {
  gulp.watch('public/**/*.scss', ['css']);
});

gulp.task('default', ['css']);
