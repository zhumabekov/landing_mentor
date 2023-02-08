"use strict"

const {src, dest} = require("gulp")
const gulp = require("gulp")

const autoprefixer = require("gulp-autoprefixer")
const cssbeautify = require("gulp-cssbeautify")
const removeComments = require("gulp-strip-css-comments")
const rename = require("gulp-rename")
const sass = require("gulp-sass")(require("sass"))
const cssnano = require("gulp-cssnano")
const rigger = require("gulp-rigger")
const uglify = require("gulp-uglify")
const plumber = require("gulp-plumber")
const imagemin = require("gulp-imagemin")
const del = require("del")
const notify = require("gulp-notify")
const fileinclude = require("gulp-file-include")
const htmlmin = require("gulp-htmlmin");
const browserSync = require("browser-sync").create()

const srcPath = 'src/'
const distPath = 'dist/'

const path = {
    build: {
        html: distPath,
        css: `${distPath}assets/css/`,
        js: `${distPath}assets/js/`,
        img: `${distPath}assets/img/`,
        fonts: `${distPath}assets/fonts/`,
    },
    src: {
        html: `${srcPath}*.html`,
        css: `${srcPath}assets/scss/style.scss`,
        js: `${srcPath}assets/js/*.js`,
        img: `${srcPath}assets/img/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}`,
        fonts: `${srcPath}assets/fonts/**/*.{eot,woff,woff2ttf,cvg}`,
    },
    watch: {
        html: `${srcPath}**/*.html`,
        css: `${srcPath}assets/scss/**/*.scss`,
        js: `${srcPath}assets/js/**/*.js`,
        img: `${srcPath}assets/img/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}`,
        fonts: `${srcPath}assets/fonts/**/*.{eot,woff,woff2ttf,cvg}`,
    },
    clean: `./${distPath}`
}

function serve() {
    browserSync.init({
        server: {
            baseDir: `./${distPath}`
        }
    })
}

function html() {
    return src(path.src.html, {base: srcPath})
        .pipe(plumber()) // ПРИ ОШИБКЕ
        .pipe(fileinclude({
            prefix: '@@'
        }))
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(dest(path.build.html))
        .pipe(browserSync.reload({stream: true}))
}

function css() {
    return src(path.src.css, {base: `${srcPath}assets/scss/`})
        .pipe(plumber({
            errorHandler: function(err){
                notify.onError({
                    title: "SCSS Error",
                    message: "Error: <%= error.message %>"
                })(err);
                this.emit('end');
            }
        })) // ПРИ ОШИБКЕ
        .pipe(sass())
        .pipe(autoprefixer())
        // .pipe(cssbeautify())
        // .pipe(dest(path.build.css))
        .pipe(cssnano({
            zIndex: false,
            discardComments: {
                removeAll: true
            }
        }))
        .pipe(removeComments())
        .pipe(rename({
            suffix: ".min",
            extname: ".css"
        }))
        .pipe(dest(path.build.css))
        .pipe(browserSync.reload({stream: true}))
}

function js() {
    return src(path.src.js, {base: `${srcPath}assets/js/`})
        .pipe(plumber({
            errorHandler: function(err){
                notify.onError({
                    title: "JS Error",
                    message: "Error: <%= error.message %>"
                })(err);
                this.emit('end');
            }
        })) // ПРИ ОШИБКЕ
        .pipe(rigger()) // ОБЪЯДИНЕНИЕ НЕСКОЛЬКИХ ФАЙЛОВ В ОДИН
        // .pipe(dest(path.build.js))
        .pipe(uglify()) // минифицирует
        .pipe(rename({
            suffix: ".min",
            extname: ".js"
        }))
        .pipe(dest(path.build.js))
        .pipe(browserSync.reload({stream: true}))
}

function img() {
    return src(path.src.img, {base: `${srcPath}assets/img/`})
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ])) 
        .pipe(dest(path.build.img))
        .pipe(browserSync.reload({stream: true}))
}

function fonts() {
    return src(path.src.fonts, {base: `${srcPath}assets/fonts/`})
    .pipe(browserSync.reload({stream: true}))
}

function clean() {
    return del(path.clean)
}

function watchFiles() {
    gulp.watch([path.watch.html], html)
    gulp.watch([path.watch.css], css)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.img], img)
    gulp.watch([path.watch.fonts], fonts)
}

const build = gulp.series(clean, gulp.parallel(html, css, js, img, fonts))
const watch = gulp.parallel(build, watchFiles, serve)

// exports.html = html
// exports.css = css
// exports.js = js
// exports.img = img
// exports.fonts = fonts
// exports.clean = clean
// exports.build = build
// exports.watch = watch
exports.default = watch