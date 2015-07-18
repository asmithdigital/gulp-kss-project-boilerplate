"use strict";

var gulp = require('gulp');
var minifycss = require('gulp-minify-css');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var run = require('gulp-run');
var event = require('event-emitter')();
// var browserSync = require('browser-sync');
var async = require('async');
var autoprefixer = require('gulp-autoprefixer');
 

var jsFiles = {
    'all-top.min.js': [
        './bower_components/modernizr/modernizr.js',
        './bower_components/jquery/dist/jquery.min.js'
    ],
    'all-bottom.min.js': [
        './bower_components/foundation/js/foundation.min.js',
        './bower_components/foundation/js/foundation/foundation.clearing.js',
        './bower_components/imgLiquid/js/imgLiquid-min.js',
        './js/bottom.js',
    ],
    'optional.min.js':[
        './js/optional.js'
    ]
};

var sassFiles = [
    './scss/all.scss',
    './scss/screen.scss',
    './scss/print.scss'
];

var sassIncludes = [
    './bower_components/foundation/scss',
    './bower_components/bootstrap-sass/assets/stylesheets'
];

// gulp.task('clear-drupal-css-js-cache',function(){
//     run('drush cc css-js').exec(function(){
//         event.emit('drupal ccs-js cache cleared');
//     });
// });

// gulp.task('clear-drupal-template-cache', function(){
//     run('drush cc render').exec(function(){
//         event.emit('drupal template cache cleared');
//     });
// });

gulp.task('sass',function(){
    gulp.src(sassFiles)
    .pipe(sourcemaps.init())
    .pipe(sass({errLogToConsole: true, includePaths:sassIncludes}))
    .pipe(minifycss())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./../css'))
    .on('end',function(){
        event.emit('css created');
    });
});

gulp.task('js',function() {
    async.each(jsFiles,
        function(jsFile,callback){
            gulp.src(jsFiles[jsFile])
            .pipe(sourcemaps.init())
            .pipe(concat(jsFile))
            .pipe(uglify())
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('./../js'))
            .on('end',callback);
        },
        function(err){
            event.emit('js created');
        }
    );
});

gulp.task('autoprefixer', function () {
    return gulp.src('./../css/*.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('dist'));
});


// gulp.task('browser-sync', function() {
//     browserSync({proxy: "drupal.dev", port:31000, ui:{port:31001}});
// })

gulp.task('style-guide', function () {
    async.parallel({
        standalone:function(callback){
            run('./node_modules/.bin/kss-node scss/ \
                -t kss/templates/standalone \
                --css ../../../../css/all.css ../../../../css/screen.css ../../../../css/print.css \
                --js ../../../../js/all-top.min.js ../../../../js/all-bottom.min.js \
                --source kss/templates \
                --destination kss/generated/standalone > /dev/null').exec(callback);
        }
    },
    function(){
        event.emit('style guide created');
    });
});

gulp.task('watch-sass-js', function() {
    gulp.watch(['./scss/**/*'],['sass']);
    gulp.watch(['./js/**/*'],['js']);
});

gulp.task('watch-style-guide', function() {
    gulp.watch(['./kss/templates/**/*'],['style-guide']);
    event.on('css created',function(){
        gulp.start('style-guide');
    });
    event.on('js created',function(){
        gulp.start('style-guide');
    });
});

// gulp.task('watch-browser-sync', ['browser-sync'], function() {
//     gulp.watch(['./../templates/**/*'],['clear-drupal-template-cache']);
//     event.on('drupal ccs-js cache cleared',browserSync.reload);
//     event.on('drupal template cache cleared',browserSync.reload);
//     event.on('style guide created',browserSync.reload);
// });

gulp.task('default', ['sass','js']);
gulp.task('watch', ['watch-sass-js','watch-style-guide']);
