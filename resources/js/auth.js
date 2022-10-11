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

 let token = window.auth.csrfToken
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

const authPage = new Vue({
    el: '#authPage',

    data: {
        email:   '',
        welcome: 'Welcome!',
        avatar:  null,

        forgotPopup: {
            open: false,
        },
    },

    methods: {
        closeForgotPopup() {
            this.forgotPopup.open = false
        },
        showForgotPopup(event) {
            event.preventDefault()

            this.forgotPopup.open = true
        },
        checkUserExists() {
            let v = this

            axios.post('/user/exists', {
                    email: v.email,
                 })
                 .then(response => {
                     if (response.data.success) {
                         v.welcome = 'Welcome Back!'
                         v.avatar  = response.data.avatar
                     } else {
                         v.welcome = 'Welcome!'
                         v.avatar  = null
                     }
                 })
                 .catch(error => {
                     console.error(error)
                 })
        },
    },
});

$(document).ready(function(){
    if (window.Laravel.status)
        M.toast({
            html:          window.Laravel.status,
            displayLength: 6000,
            classes:       'blue darken-1 white-text',
        });
})
