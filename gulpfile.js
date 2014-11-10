'use strict';
var gulp   = require('gulp'),
    $      = require('gulp-load-plugins')({ camelize: true }),
    sprite = require('css-sprite').stream,
    path   = require('path'),
    _      = require('underscore'),
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

var sprite = function(base) {
  var src      = path.join(base, 'sprite'),
      imgDest  = path.join(base, 'img'),
      scssDest = path.join(base, 'scss'),
      webRoot  = base.substring(base.indexOf(path.sep), base.length),
      imgPath  = path.join(webRoot, 'img', 'sprite.png');

  var spriteData = gulp.src(path.join(src, '*.png'))
    .pipe($.spritesmith({
      imgName: 'sprite.png',
      cssName: '_sprite.scss',
      imgPath: imgPath,
      cssFormat: 'scss',
  }));

  return [
    spriteData.img.pipe(gulp.dest(imgDest)), //imgNameで指定したスプライト画像の保存先
    spriteData.css.pipe(gulp.dest(scssDest)), //cssNameで指定したcssの保存先
  ];
}

var config = [
  'public/hoge',
];

gulp.task('sprite', function() {
  return merge(_.map(config, function(base) { return sprite(base); }));
});

// Stylesheets
gulp.task('css', ['sprite'], function() {
  return merge(_.map(config, function(base) { return sass(base); }));
});

gulp.task('watch', function() {
  _.each(config, function(base) {
    gulp.watch(path.join(base, '**', '*.css'));
    gulp.watch(path.join(base, '**', 'sprite', '*.png'));
  });
});

gulp.task('server', function() {
  gulp.src('public')
    .pipe($.webserver({
      livereload: true,
      directoryListing: true,
      open: true
    }));
});

gulp.task('default', ['css', 'server', 'watch']);
