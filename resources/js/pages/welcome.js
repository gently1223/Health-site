/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

require('../bootstrap');
require('materialize-css');

window.Vue      = require('vue');
window.moment   = require('moment');

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

const registrationPage = new Vue({
    el: '#registrationPage',

    data: {
        isLoad:           true,

        timeout:          null,
        stepper:          null,
        type:             'join_to_company',
        company_id:       null,
        company_name:     '',
        company_domain:   '',
        search_company:   '',

        ccode:            null,
        rcode:            null,
        terms:            false,
        isSending:        false,

        user_email:       '',
        user_first_name:  '',
        user_last_name:   '',
        user_phone:       '',
        user_password:    '',
        user_password_confirmation: '',

        invalid_domain:    false,

        companies: [],
    },

    watch: {
        search_company() {
            let v = this

            clearTimeout(v.timeout)

            v.timeout = setTimeout(function() {
                if (v.search_company == '') {
                    v.companies = []
                } else {
                    axios.post('/company/search', {
                            search: v.search_company,
                         })
                         .then(response => {
                             if (response.data.success) {
                                 v.companies = response.data.companies
                             } else {
                                 v.companies = []
                             }
                         })
                         .catch(error => {
                             console.error(error)
                         })
                }
            }, 500)
        },
    },

    methods: {
        selectCompany(companyId, companyDomain) {
            let v = this

            v.company_id = companyId
            v.company_domain = companyDomain
            v.nextStep()
        },
        sendCode() {
            let v = this

            clearTimeout(v.ccodeTimeout)
            v.isSending = true;
            v.ccodeTimeout = setTimeout(function() {
                axios.post('/welcome/verify', {
                    email: v.user_email,
                })
                .then(response => {
                    v.isSending = false;
                    if (response.data.success) {
                        v.rcode = response.data.code
                        M.toast({
                            html:          'Verification Code has been sent to your E-Mail!',
                            displayLength: 6000,
                            classes:       'blue darken-1 white-text',
                        })
                    }
                })
                .catch(error => {
                    console.error(error)
                })
            }, 12000)
        },
        nextStep() {
            let v = this

            let valid = v.validate()

            if (!valid) {
                v.stepper.wrongStep()
            } else {
                v.stepper.nextStep()
            }

        },
        validate() {
            let v = this
            let valid = true
            let steps = v.stepper.getSteps()

            if (steps.active.index == 0) {
                switch (v.type) {
                    case 'join_to_company':
                        if (v.company_id == null) {
                            valid = false
                        }
                        break;
                }
            } else if (steps.active.index == 1) {
                if (v.user_email ==    '' ||
                    v.user_first_name ==    '' ||
                    v.user_last_name ==   '' ||
                    v.user_phone ==  '' ||
                    v.user_password == '' ||
                    v.user_password_confirmation == ''
                ) {
                    valid = false
                }

                let regex = new RegExp(v.company_domain+'\\s*$')
                if (!regex.test(v.user_email)){
                    valid = false
                    v.invalid_domain = true
                }
            }
            return valid
        },
        beforeSubmit() {
            let v = this

            axios.post('/welcome/validate', {
                    company_id:       v.company_id,
                    ccode:            v.ccode,
                    user_email:       v.user_email,
                    user_first_name:  v.user_first_name,
                    user_last_name:   v.user_last_name,
                    user_phone:       v.user_phone,
                    user_password:    v.user_password,
                    user_password_confirmation: v.user_password_confirmation,

                    terms: v.terms,
                 })
                 .then(response => {
                     if (response.data.success) {
                         v.$refs.registerForm.submit();
                     } else {
                         v.stepper.openStep(response.data.step)

                         M.toast({
                             html:          response.data.error,
                             displayLength: 6000,
                             classes:       'blue darken-1 white-text',
                         })
                     }
                 })
                 .catch(error => {
                     console.error(error)
                 })
        },
    },

    mounted() {
        let v = this

        v.stepper = new MStepper(document.querySelector('.stepper'), {
            // options
            firstActive: 0, // this is the default
            linearStepsNavigation: true,
            validationFunction: v.validate,
        })

        v.isLoad = false
    },
});
