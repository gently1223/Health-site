const mix = require('laravel-mix');
let fs  = require('fs');
/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

let getFiles = function (dir) {
    // get all 'files' in this directory
    // filter directories
    return fs.readdirSync(dir).filter(file => {
        return fs.statSync(`${dir}/${file}`).isFile();
    });
};

getFiles('resources/js').forEach(function (JSpath) {
    if(JSpath !== 'bootstrap.js' ){
        mix.js('resources/js/' + JSpath, 'public/js');
    }
});

getFiles('resources/js/pages').forEach(function (JSpath) {
    mix.js('resources/js/pages/' + JSpath, 'public/js/pages');
});

getFiles('resources/js/pages/billing').forEach(function (JSpath) {
    mix.js('resources/js/pages/billing/' + JSpath, 'public/js/pages/billing');
});

getFiles('resources/js/pages/club').forEach(function (JSpath) {
    mix.js('resources/js/pages/club/' + JSpath, 'public/js/pages/club');
});

getFiles('resources/js/pages/enterprise').forEach(function (JSpath) {
    mix.js('resources/js/pages/enterprise/' + JSpath, 'public/js/pages/enterprise');
});

getFiles('resources/js/pages/root').forEach(function (JSpath) {
    mix.js('resources/js/pages/root/' + JSpath, 'public/js/pages/root');
});

getFiles('resources/sass').forEach(function (SASSpath) {
    mix.sass('resources/sass/' + SASSpath, 'public/css');
});

mix.copy('resources/images/*', 'public/images')
   .copy('resources/images/concierge', 'public/images/concierge')
   .copy('resources/images/homepersons', 'public/images/homepersons')
   .copy('resources/images/loginbackgrounds', 'public/images/loginbackgrounds')
   .copy('resources/widgets', 'public/widgets')
   .copy('resources/js/chartjs/Chart.min.js', 'public/js/Chart.min.js')
   .copy('resources/js/chartjs/Chart.bundle.min.js', 'public/js/Chart.bundle.min.js');
