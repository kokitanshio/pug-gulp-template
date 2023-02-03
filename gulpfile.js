const gulp = require('gulp');
const del = require('del');

//scss
const sass = require('gulp-dart-sass'); //DartSassを使用
const plumber = require("gulp-plumber"); // エラーが発生しても強制終了させない
const notify = require("gulp-notify"); // エラー発生時のアラート出力
const browserSync = require("browser-sync"); //ブラウザリロード
const autoprefixer = require('gulp-autoprefixer'); //ベンダープレフィックス自動付与
const postcss = require("gulp-postcss"); //css-mqpackerを使用
const mqpacker = require('css-mqpacker'); //メディアクエリをまとめる
const pug = require('gulp-pug'); //pugを使用


// 入出力するフォルダを指定
const srcBase = './src';
const distBase = './dist';


const srcPath = {
  'scss': srcBase + '/scss/**/*.scss',
  'html': srcBase + '/**/*.html',
  'img': srcBase + '/images/**/*',
  'js': srcBase + '/js/*.js',
  'pug': srcBase + '/pug/**/*.pug',
};

const distPath = {
  'css': distBase + '/css/',
  'html': distBase + '/',
  'img': distBase + '/images/',
  'js': distBase + '/js/'
};


/**
 * clean
 */
const clean = () => {
  return del([distBase + '/**'], {
    force: true
  });
}

//ベンダープレフィックスを付与する条件
const TARGET_BROWSERS = [
  'last 2 versions', //各ブラウザの2世代前までのバージョンを担保
  'ie >= 11' //IE11を担保
];


/**
 * pug
 */
const compilePug = () => {
  // _*.pugはコンパイルしない
  return gulp.src([srcPath.pug, '!./src/pug/**/_*.pug'])
    .pipe(pug({
      pretty: true
    }))
    .pipe(
      //エラーが出ても処理を止めない
      plumber({
        errorHandler: notify.onError('Error:<%= error.message %>')
      }))
    .pipe(gulp.dest(distPath.html))
    .pipe(browserSync.stream())
    .pipe(notify({
      message: 'Pugをコンパイルしました！',
      onLast: true
    }))
};


/**
 * sass
 *
 */
const cssSass = () => {
  return gulp.src(srcPath.scss, {
      sourcemaps: true
    })
    .pipe(
      //エラーが出ても処理を止めない
      plumber({
        errorHandler: notify.onError('Error:<%= error.message %>')
      }))
    .pipe(sass({
      outputStyle: 'expanded'
    })) //指定できるキー expanded compressed
    .pipe(autoprefixer(TARGET_BROWSERS))
    .pipe(postcss([mqpacker()])) // メディアクエリをまとめる
    .pipe(gulp.dest(distPath.css, {
      sourcemaps: './'
    })) //コンパイル先
    .pipe(browserSync.stream())
    .pipe(notify({
      message: 'Sassをコンパイルしました！',
      onLast: true
    }))
}


/**
 * js
 */
const js = () => {
  return gulp.src(srcPath.js)
    .pipe(gulp.dest(distPath.js))
}


/**
 * image
 */
const image = () => {
  return gulp.src(srcPath.img)
    .pipe(gulp.dest(distPath.img))
}



/**
 * ローカルサーバー立ち上げ
 */
const browserSyncFunc = () => {
  browserSync.init(browserSyncOption);
}

const browserSyncOption = {
  server: distBase
}

/**
 * リロード
 */
const browserSyncReload = (done) => {
  browserSync.reload();
  done();
}


/**
 *
 * ファイル監視 ファイルの変更を検知したら、browserSyncReloadでreloadメソッドを呼び出す
 * series 順番に実行
 * watch('監視するファイル',処理)
 */
const watchFiles = () => {
  gulp.watch(srcPath.pug, gulp.series(compilePug, browserSyncReload))
  gulp.watch(srcPath.scss, gulp.series(cssSass))
  gulp.watch(srcPath.js, gulp.series(js, browserSyncReload))
  gulp.watch(srcPath.img, gulp.series(image, browserSyncReload))
}

/**
 * seriesは「順番」に実行
 * parallelは並列で実行
 *
 * 一度cleanでdistフォルダ内を削除し、最新のものをdistする
 */
exports.default = gulp.series(
  clean,
  gulp.parallel(compilePug, cssSass, js, image),
  gulp.parallel(watchFiles, browserSyncFunc)
);