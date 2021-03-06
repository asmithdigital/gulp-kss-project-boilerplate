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
var scsslint = require('gulp-scss-lint');
var globbing = require('gulp-css-globbing');
var eslint = require('gulp-eslint');
 

var jsFiles = {
    'all-top.min.js': [
        './app/modernizr/modernizr.js',
        './app/jquery/dist/jquery.min.js'
    ],
    'all-bottom.min.js': [
        './app/foundation/js/foundation.min.js',
        './app/foundation/js/foundation/foundation.clearing.js',
        './app/imgLiquid/js/imgLiquid-min.js',
        './javascript/bottom.js',
    ],
    'optional.min.js':[
        './javascript/optional.js'
    ]
};

var sassFiles = [
    './scss/all.scss',
    './scss/screen.scss',
    './scss/print.scss'
];

var sassIncludes = [
    './app/foundation/scss',
    './app/bootstrap-sass/assets/stylesheets'
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
    .pipe(globbing({
        // Configure it to use SCSS files
        extensions: ['.scss']
    }))
    .pipe(sass({errLogToConsole: true, includePaths:sassIncludes}))
    .pipe(minifycss())
    .pipe(autoprefixer({
        browsers: ["last 4 versions", "ios 6"],
        cascade: false
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./../css'))
    .on('end',function(){
        event.emit('css created');
    });
});

gulp.task('js',function() {
    async.each(['all-top.min.js','all-bottom.min.js', 'optional.min.js'],
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
            if (err) {
                console.log(err);
            }
            event.emit('js created');
        }
    );
});


// gulp.task('browser-sync', function() {
//     browserSync({proxy: "drupal.dev", port:31000, ui:{port:31001}});
// })


gulp.task('scss-lint', function() {
  gulp.src('./scss/*.scss')
    .pipe(scsslint());
});


gulp.task('es-lint', function () {
    return gulp.src(['./javascript/*js'])
        // eslint() attaches the lint output to the eslint property 
        // of the file object so it can be used by other modules. 
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console. 
        // Alternatively use eslint.formatEach() (see Docs). 
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on 
        // lint error, return the stream and pipe to failOnError last. 
        .pipe(eslint.failOnError());
});

gulp.task('lint', ['es-lint', 'scss-lint']);

gulp.task('style-guide', function () {
    async.parallel({
        standalone:function(callback){
            run('./node_modules/.bin/kss-node scss/ \
                -t kss/templates/standalone \
                --css ../css/all.css ../css/screen.css ../css/print.css \
                --js ../../../../js/all-top.min.js ../../../../js/all-bottom.min.js \
                --source scss \
                --destination ../styleguide > /dev/null').exec(callback);
        }
    },
    function(){
        event.emit('style guide created');
    });
});

gulp.task('watch-sass-js', function() {
    gulp.watch(['./scss/**/*'],['sass']);
    gulp.watch(['./javascript/**/*'],['js']);
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

gulp.task('default', ['sass','js', 'lint']);
gulp.task('watch', ['watch-sass-js','watch-style-guide', 'lint']);
