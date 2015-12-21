'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cmq = require('gulp-combine-media-queries'),
    csscomb = require('gulp-csscomb'),
    imagemin = require('gulp-imagemin'),
    newer = require('gulp-newer'),
    clean = require('gulp-clean'),
    minifyHtml = require('gulp-minify-html'),
    replace = require('gulp-replace'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    wiredep = require('wiredep').stream,
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    rename = require('gulp-rename'),
    minifyCss = require('gulp-minify-css');

gulp.task('bower', function() {
   gulp.src('src/index.html')
        .pipe(wiredep({
          directory: 'src/bower_components'
        }))
        .pipe(gulp.dest('src'));
});

gulp.task('build:css', ['build:clean'], function() {
  return gulp.src('src/sass/style.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
          browsers: ['last 2 versions', 'ie 10']
          }))
        .pipe(cmq())
        .pipe(csscomb())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('build/css'));
});



gulp.task('build:copyHtml', ['build:clean', 'build:css', 'build:js'], function() {
  return gulp.src('src/*.html')
        .pipe(replace('style.css', 'style.min.css'))
        .pipe(replace('script.js', 'script.min.js'))
        .pipe(replace('bower', '../src/bower'))
        .pipe(gulp.dest('build'));
});



gulp.task('build:html', ['build:clean', 'build:css', 'build:js', 'build:copyHtml'], function() {
  return gulp.src('build/*.html')
        .pipe(useref())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss({keepSpecialComments: 0})))
        .pipe(gulp.dest('build'));
});

gulp.task('csscomb', function() {
  return gulp.src('src/sass/**/*.scss')
        .pipe(csscomb())
        .pipe(gulp.dest('src/sass'));
});

gulp.task('build:image', ['build:clean'], function() {
  return gulp.src('src/img/**/*')
        .pipe(newer('build'))
        .pipe(imagemin())
        .pipe(gulp.dest('build/img'));
});

gulp.task('build:clean', function() {
  return gulp.src('build')
        .pipe(clean());
})

gulp.task('build:js', ['build:clean'], function() {
  return gulp.src(['src/js/**/*', '!src/js/script.js'])
        .pipe(concat('script.js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('build/js'));
})

gulp.task('build',['build:clean','build:html', 'build:css', 'build:image',
                   'build:js']);

gulp.task('build:start', function() {
  browserSync({
    server: {
      baseDir: './build'
    },
    port: 8080,
    open: true,
    notify: false
  })
});

gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: './src'
    },
    port: 8080,
    open: true,
    notify: false
  });
});

gulp.task('css', function() {
  return gulp.src('src/sass/**/*')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('src/css'))
        .pipe(reload({stream:true}));
});

gulp.task('html', function() {
  return gulp.src('src/*.html')
        .pipe(reload({stream:true}));
});

gulp.task('js', function() {
  return gulp.src(['src/js/**/*.js', '!src/js/script.js'])
        .pipe(concat('script.js', {newLine: ';'}))
        .pipe(gulp.dest('src/js'))
        .pipe(reload({stream:true}));
});

gulp.task('watcher', function() {
  gulp.watch('bower.json', ['bower']);
  gulp.watch('src/sass/**/*', ['css']);
  gulp.watch('src/*.html', ['html']);
  gulp.watch('src/js/**/*', ['js']);
});

gulp.task('default', ['watcher', 'css', 'js', 'browserSync']);



