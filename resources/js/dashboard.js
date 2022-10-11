/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

require('./bootstrap');
require('materialize-css');

window.Vue = require('vue');
window.moment = require('moment');

/**
 * The following block of code may be used to automatically register your
 * Vue components. It will recursively scan this directory for the Vue
 * components and automatically register them with their "basename".
 */

 let token = window.dashboard.csrfToken
 if (token) {
     window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token
 } else {
     console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token', token)
 }

/**
 * Next, we will create a fresh Vue application instance and attach it to
 * the page. Then, you may begin adding components to this application
 * or customize the JavaScript scaffolding to fit your unique needs.
 */

const aside = new Vue({
    el: '#aside',

    data: {
        'isOpen': false,
        'activeMenu': null,
        'activeMenuGroup': null,
        'activeMenuCollapse': null,
    },

    methods: {
        asideToggle() {
            this.isOpen = !this.isOpen
        },
    },

    mounted() {
        this.activeMenu      = window.dashboard.activeMenu
        this.activeMenuGroup = window.dashboard.activeMenuGroup
        this.activeMenuCollapse = window.dashboard.activeMenuCollapse
    },
});

$(document).ready(function(){
    $('.collapsible').collapsible();

    $('select:not(.select2)').formSelect();

    if (window.Laravel.alerts) {
        if (window.Laravel.alerts.success) {
            M.toast({
                html:          window.Laravel.alerts.success,
                displayLength: 6000,
                classes:       'blue darken-1 white-text',
            });
        }

        if (window.Laravel.alerts.error) {
            M.toast({
                html:          window.Laravel.alerts.error,
                displayLength: 6000,
                classes:       'red darken-1 white-text',
            });
        }
    }
});
