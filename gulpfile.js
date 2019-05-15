const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const cached = require('gulp-cached');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const remember = require('gulp-remember');
const util = require('gulp-util');
const autoprefixer = require('gulp-autoprefixer');
const minifycss = require('gulp-minify-css');
const ts = require('gulp-typescript');

const log = util.log;
sass.compiler = require('node-sass');

const paths = {
    ts: {
        src: 'src/typescript/**/*.ts',
        dest: 'src/js/'
    },
    js: {
        src: [
            'src/js/jquery-3.3.1.min.js',
            'src/js/materialize.min.js',
            'src/js/app.js'
        ],
        dest: 'public/js/'
    },
    sass: {
        src: 'src/sass/**/*.scss',
        dest: 'public/css/'
    }
};

function buildTypescript() {
    return gulp.src(paths.ts.src)
        .pipe(cached(paths.ts.src.toString()))
        .pipe(ts())
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(remember(paths.ts.src.toString()))
        .pipe(gulp.dest(paths.ts.dest));

}

function buildScripts() {
    return gulp.src(paths.js.src)
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest(paths.js.dest));
}

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
    const watcherTs = gulp.watch(paths.ts.src, gulp.series(buildTypescript, buildScripts));
    watcherTs.on('change', function (e) {
        if (e.type === 'deleted') {
            delete cached.caches[paths.ts.src.toString()][e.path];
            remember.forget(paths.ts.src.toString(), e.path);
        }
    });

    const watcherJs = gulp.watch(paths.js.src, buildScripts);
    watcherJs.on('change', function (e) {
        if (e.type === 'deleted') {
            delete cached.caches[paths.js.src.toString()][e.path];
            remember.forget(paths.js.src.toString(), e.path);
        }
    });

    const watcherCss = gulp.watch(paths.sass.src, buildSass);
    watcherCss.on('change', function(e) {
        if(e.type === 'deleted') {
            delete cached.caches[paths.sass.src.toString()][e.path];
            remember.forget(paths.sass.src.toString(), e.path);
        }
    });
}


const dev = gulp.series(gulp.parallel(gulp.series(buildTypescript, buildScripts), buildSass), watch);
const build = gulp.parallel(gulp.series(buildTypescript, buildScripts), buildSass);

exports.buildScripts = gulp.series(buildTypescript, buildScripts);
exports.buildSass = buildSass;

exports.watchScripts = gulp.series(buildTypescript, buildScripts, watch);
exports.watchSass = gulp.series(buildSass, watch);

exports.dev = dev;
exports.build = build;
exports.watch = watch;


exports.default = dev;