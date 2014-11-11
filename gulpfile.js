'use strict';
var gulp     = require('gulp'),
    $        = require('gulp-load-plugins')({ camelize: true }),
    sprite   = require('css-sprite').stream,
    path     = require('path'),
    _        = require('underscore'),
    merge    = require('merge-stream'),
    gifsicle = require('imagemin-gifsicle'),
    jpegtran = require('imagemin-jpegtran'),
    pngquant = require('imagemin-pngquant');

_.str = require('underscore.string');

// FIXME 以下が対応されたらgulp-sourcemapsで生成する
// https://github.com/sindresorhus/gulp-ruby-sass/pull/137
// sourceMappingURLについても手動で入れなくても対応できるようになるはず
var sass = function(base, options) {
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
      minifier: false,
      rem: false
    }))
    // sourceMappingURLが自動で入らないので.cssファイルの末尾に追記する
    .pipe($.if(isCssFile, $.footer('/*# sourceMappingURL=${mapPath} */', {mapPath: mapPath})))
    .pipe(gulp.dest(dest));
};

var sprite = function(base, options) {
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
};

// jpg,png,gifを圧縮して元画像と同じディレクトリ上にファイル名に.minを付与して出力する。
// .min, .ignoreが含まれるファイルは圧縮対象外。
var imagemin = function(base, options) {
  var imgPath       = path.join(base, 'img'),
      isIgnoredFile = function(file) {
        var pathFromBase = file.path.substring(file.base.length, file.path.length);
        var extname = path.extname(pathFromBase);
        return _.str.endsWith(pathFromBase, '.ignore' + extname) || _.str.endsWith(pathFromBase, '.min' + extname);
      };
  return gulp.src(path.join(imgPath, '**', '*.{jpg,png,gif}'))
    .pipe($.ignore.exclude(isIgnoredFile))
    .pipe($.imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [gifsicle(), jpegtran(), pngquant()]
    }))
    .pipe($.rename({suffix: '.min'}))
    .pipe(gulp.dest(imgPath));
}

var aggregate = function(callback) {
  return merge(_.map(_.keys(config), function(base) {
    var options = config[base];
    return callback(base, options);
  }));
};

var config = {
  'public/hoge': { },
  'public/foo': { },
};

gulp.task('sprite', function() {
  return aggregate(function(base) {
    return sprite(base);
  });
});

// Stylesheets
gulp.task('css', ['sprite'], function() {
  return aggregate(function(base) {
    return sass(base);
  });
});

gulp.task('imagemin', function() {
  return aggregate(function(base, opts) {
    return imagemin(base, opts.imagemin);
  });
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
