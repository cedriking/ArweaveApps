const gulp = require('gulp');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const minifycss = require('gulp-minify-css');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

sass.compiler = require('node-sass');

const paths = {
    js: {
        src: 'src/js/**/*.js',
        dest: 'public/js/'
    },
    sass: {
        src: 'src/sass/**/*.scss',
        dest: 'public/css/'
    }
};

function buildJs() {
    return gulp.src(paths.js.src)
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest(paths.js.dest));
}

function buildSass() {
    return gulp.src(paths.sass.src)
        .pipe(sass({ style: 'expanded' }).on('error', sass.logError))
        .pipe(autoprefixer("last 3 version", "safari 5", "ie 8", "ie 9"))
        .pipe(rename('main.css'))
        .pipe(gulp.dest(paths.sass.dest));
}

function watch() {
    gulp.watch(paths.js.src, buildJs);
    gulp.watch(paths.sass.src, buildSass);
}


const dev = gulp.series(buildJs, buildSass, watch);
const build = buildSass;

exports.watchSass = gulp.series(buildSass, watch);

exports.dev = dev;
exports.build = build;
exports.watch = watch;

exports.default = dev;