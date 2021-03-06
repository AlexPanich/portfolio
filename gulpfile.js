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
    rigger = require('gulp-rigger'),
    svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    svgpath = require('path'),
    cheerio = require('gulp-cheerio'),
    inject = require('gulp-inject'),
    iconify = require('gulp-iconify'),
    minifyCss = require('gulp-minify-css');

var path = {
  build: {
    html: 'build/',
    js: 'build/js/',
    css: 'build/css/',
    img: 'build/img/',
    fonts: 'build/fonts/'
  },
  src: {
    root: 'src/',
    html: 'src/html/*.html',
    js: 'src/js/main.js',
    css: 'src/css/',
    sass: 'src/sass/style.scss',
    img: 'src/img/',
    fonts: 'src/fonts/**/*.*',
    template: 'src/html/template',
    svg: { inline: 'src/img/svg/inline/',
           data: 'src/img/svg/data/'
         },
    bower_insert: ['src/html/template/link.html', 'src/html/template/script.html']
  },
  watch: {
    html: 'src/html/**/*.html',
    js: ['src/js/**/*.js', '!src/js/script.js'],
    sass: 'src/sass/**/*.scss',
    fonts: 'src/fonts/**/*.*',
    bower: 'bower.json',
    svg: { inline: 'src/img/svg/inline/',
           data: 'src/img/svg/data/'
         }
  },
  clean: './build',
  bower: 'src/bower_components'
}


gulp.task('bower', function() {
   gulp.src(path.src.bower_insert)
        .pipe(wiredep({
          directory: path.bower
        }))
        .pipe(gulp.dest(path.src.template));
});

gulp.task('build:fonts', ['build:clean'], function() {
  return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
})

gulp.task('build:css', ['build:clean'], function() {
  return gulp.src(path.src.sass)
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
          browsers: ['last 2 versions', 'ie 10']
          }))
        .pipe(cmq())
        .pipe(csscomb())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(path.build.css));
});


gulp.task('build:copyHtml', ['build:clean', 'build:css', 'build:js', 'svgstore'], function() {
  return gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(replace('style.css', 'style.min.css'))
        .pipe(replace('script.js', 'script.min.js'))
        .pipe(replace('"../../bower', '"../src/bower'))
        .pipe(gulp.dest(path.build.html));
});

gulp.task('build:html', ['build:clean', 'build:css', 'build:js', 'svgstore', 'build:copyHtml'], function() {
  return gulp.src(path.build.html + '*.html')
        .pipe(useref())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss({keepSpecialComments: 0})))
        .pipe(gulp.dest(path.build.html));
});


gulp.task('csscomb', function() {
  return gulp.src('src/sass/**/*.scss')
        .pipe(csscomb())
        .pipe(gulp.dest('src/sass'));
});

gulp.task('build:image', ['build:clean'], function() {
  return gulp.src('src/img/**/*', '!src/img/svg/**/*')
        .pipe(newer('build'))
        .pipe(imagemin())
        .pipe(gulp.dest('build/img'));
});

gulp.task('build:clean', function() {
  return gulp.src('build')
        .pipe(clean());
});

gulp.task('build:js', ['build:clean'], function() {
  return gulp.src(path.src.js)
        .pipe(rigger())
        .pipe(rename({
                      basename: 'script',
                      suffix: '.min'
                      }))
        .pipe(gulp.dest(path.build.js));
});

gulp.task('build',['build:clean','build:html', 'build:css', 'build:image',
                   'build:js', 'build:fonts'], function() {
  return gulp.src(path.build.html + '*.html')
        .pipe(minifyHtml())
        .pipe(gulp.dest(path.build.html));
});

gulp.task('build:start', function() {
  browserSync({
    server: {
      baseDir: './build'
    },
    port: 8080,
    open: true,
    notify: false
  });
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
  return gulp.src(path.src.sass)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(path.src.css))
        .pipe(reload({stream:true}));
});

gulp.task('html',['svgstore'], function() {
  return gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(replace('"../../bower', '"bower'))
        .pipe(replace(/{{{.*}}}/g, function(a) {
            var name = a.replace('{{{','').replace('}}}','');
            return '<svg class="' + name + '"><use xlink:href="#' + 'icon-' + name + '"></use></svg>';
          }))
        .pipe(gulp.dest(path.src.root))
        .pipe(reload({stream:true}));
});

gulp.task('js', function() {
  return gulp.src(path.src.js)
        .pipe(rigger())
        .pipe(rename('script.js'))
        .pipe(gulp.dest(path.src.root + 'js/'))
        .pipe(reload({stream:true}));
});

gulp.task('svgstore', function() {
  var svgs =  gulp.src(path.src.svg.inline + '*.svg')
        .pipe(rename({prefix: 'icon-'}))
        .pipe(svgmin(function (file) {
          var prefix = svgpath.basename(file.relative, svgpath.extname(file.relative));
          return {
            plugins: [{
              cleanupIDs: {
                prefix: prefix + '-',
                minify: true
              }
            }]
          }
        }))
        .pipe(svgstore({ inlineSvg: true }))
        .pipe(cheerio(function ($) {
          $('svg').attr('style', 'display:none');
          }));
  function fileContents(filePath, file) {
    return file.contents.toString();
  }
  
  return gulp.src('src/html/template/inline-svg.html')
        .pipe(inject(svgs, { transform: fileContents }))
        .pipe(gulp.dest('src/html/template/'));
});

gulp.task('iconify', function() {
  iconify({
    src: path.src.svg.data + 'expirience/' + '*.svg',
    pangOutput: path.src.img + 'png',
    defaultWidth: '60px',
    defaultHeight: '50px',
    svgoOptions: {
      enabled: true,
      options: {
                plugins: [
                    { removeUnknownsAndDefaults: false },
                    { mergePaths: false }
                ]
            }
    }
    
    
  });
});

gulp.task('watcher', ['css', 'js', 'html','browserSync', 'svgstore'], function() {
  gulp.watch(path.watch.svg.inline, ['svgstore']);
  gulp.watch(path.watch.bower, ['bower']);
  gulp.watch(path.watch.sass, ['css']);
  gulp.watch(path.watch.html, ['html']);
  gulp.watch(path.watch.js, ['js']);
});

gulp.task('default', ['watcher', 'css', 'js', 'html', 'browserSync']);



