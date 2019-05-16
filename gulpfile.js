const gulp = require('gulp');
const concat = require('gulp-concat');
const cached = require('gulp-cached');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const remember = require('gulp-remember');
const util = require('gulp-util');
const autoprefixer = require('gulp-autoprefixer');
const minifycss = require('gulp-minify-css');

const log = util.log;
sass.compiler = require('node-sass');

const paths = {
    sass: {
        src: 'src/sass/**/*.scss',
        dest: 'public/css/'
    }
};

function buildSass() {
    return gulp.src(paths.sass.src)
        .pipe(sass({ style: 'expanded' }).on('error', sass.logError))
        .pipe(autoprefixer("last 3 version", "safari 5", "ie 8", "ie 9"))
        .pipe(rename('main.css'))
        .pipe(gulp.dest(paths.sass.dest))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest(paths.sass.dest));
}

function watch() {
    const watcherCss = gulp.watch(paths.sass.src, buildSass);
    watcherCss.on('change', function(e) {
        if(e.type === 'deleted') {
            delete cached.caches[paths.sass.src.toString()][e.path];
            remember.forget(paths.sass.src.toString(), e.path);
        }
    });
}


const dev = gulp.series(buildSass, watch);
const build = buildSass;

exports.watchSass = gulp.series(buildSass, watch);

exports.dev = dev;
exports.build = build;
exports.watch = watch;

exports.default = dev;