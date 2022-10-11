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

        products:         window.Laravel.products,
        stripe:           null,
        cardElement:      null,
        promocode:        null,
        promocodeTimeout: null,
        terms:            false,
        totalDiscount:    false,

        card_holder:      '',
        card_number:      '',
        card_valid_month: '',
        card_valid_year:  '',
        card_cvc:         '',

        timeout:          null,
        stepper:          null,
        type:             'join_to_company',
        company_id:       null,
        company_name:     '',
        search_company:   '',
        location_club_id: '',
        location_name:    '',
        location_city:    '',
        location_state:   '',
        location_postal:  '',
        location_address: '',
        location_phone:   '',
        user_email:       '',
        user_first_name:  '',
        user_last_name:   '',
        user_phone:       '',
        user_password:    '',
        user_password_confirmation: '',

        shipment_same_address: 1,
        shipment_city:    '',
        shipment_state:   '',
        shipment_postal:  '',
        shipment_address: '',

        subscription_id: 0,
        price_id:        0,

        stripe_token:    '',

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
        promocode() {
            let v = this

            clearTimeout(v.promocodeTimeout)

            v.promocodeTimeout = setTimeout(function() {
                if (v.promocode == '') {
                    v.discount = 0
                } else {
                    axios.post('/promocode/verify', {
                            promocode: v.promocode,
                         })
                         .then(response => {
                             if (response.data.success || response.data.products) {
                                 v.products = response.data.products

                                 if (v.products[0].prices[0].price == '$0.00') {
                                     v.totalDiscount = true
                                 } else {
                                     v.totalDiscount = false
                                 }
                             } else {
                                 v.products      = window.Laravel.products
                                 v.totalDiscount = false
                             }
                         })
                         .catch(error => {
                             console.error(error)
                         })
                }
            }, 500)
        }
    },

    methods: {
        formatCard() {
            let v = this

            let card_number = v.card_number.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
            let matches = card_number.match(/\d{4,16}/g)
            let match = matches && matches[0] || ''
            let parts = []

            for (i=0, len=match.length; i<len; i+=4) {
                parts.push(match.substring(i, i+4))
            }

            if (parts.length) {
                v.card_number = parts.join(' ')
            }
        },
        selectCompany(companyId) {
            let v = this

            v.company_id = companyId
            v.nextStep()
        },
        setPrice(productId, priceId) {
            let v = this

            $('#selectSubscriptionStep').removeClass('wrong');

            v.subscription_id = productId
            v.price_id = priceId
        },
        nextStep() {
            let v = this

            let cardStep = 4;
            let planStep = 2;

            if (v.stepper.getSteps().active.index == planStep) {
                if (v.price_id == 0 && v.promocode && v.products.length == 1 && v.products[0].prices.length == 1) {
                    v.setPrice(v.products[0].id, v.products[0].prices[0].id)
                }
            }

            if (v.stepper.getSteps().active.index == cardStep) {
                v.validateCard(cardStep)
            } else {
                let valid = v.validate()

                if (!valid) {
                    v.stepper.wrongStep()
                } else {
                    v.stepper.nextStep()
                }
            }
        },
        validateCard(cardStep) {
            let v = this

            axios.post('/register/get_card_token', {
                    card_holder:      v.card_holder,
                    card_number:      v.card_number,
                    card_valid_month: v.card_valid_month,
                    card_valid_year:  v.card_valid_year,
                    card_cvc:         v.card_cvc,
                }).then(response => {
                    if (response.data.success) {
                        v.stripe_token = response.data.token
                        v.stepper.nextStep()
                    } else {
                        v.stepper.openStep(cardStep)
                        v.stepper.wrongStep()

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
                    case 'new_company':
                        v.company_id = 0
                        if (v.company_name.trim() == '') {
                            valid = false
                        }
                        break;
                }
            } else if (steps.active.index == 1) {
                if (v.location_name ==    '' ||
                    v.location_city ==    '' ||
                    v.location_state ==   '' ||
                    v.location_postal ==  '' ||
                    v.location_address == '' ||
                    v.location_phone == ''   ||
                    v.location_club_id == ''
                ) {
                    valid = false
                }
            } else if (steps.active.index == 2) {
                if (v.subscription_id == 0 || v.price_id == 0) {
                    valid = false
                }
            } else if (steps.active.index == 3) {
                if (v.shipment_same_address == '0' && (
                    v.shipment_city ==    '' ||
                    v.shipment_state ==   '' ||
                    v.shipment_postal ==  '' ||
                    v.shipment_address == '' )
                ) {
                    valid = false
                }
            }

            return valid
        },
        beforeSubmit() {
            let v = this

            axios.post('/register/validate', {
                    type:             v.type,

                    company_id:       v.company_id,
                    company_name:     v.company_name,

                    location_club_id: v.location_club_id,
                    location_name:    v.location_name,
                    location_city:    v.location_city,
                    location_state:   v.location_state,
                    location_postal:  v.location_postal,
                    location_address: v.location_address,
                    location_phone:   v.location_phone,

                    shipment_same_address: v.shipment_same_address,
                    shipment_city:         v.shipment_city,
                    shipment_state:        v.shipment_state,
                    shipment_postal:       v.shipment_postal,
                    shipment_address:      v.shipment_address,

                    subscription_id:  v.subscription_id,
                    price_id:         v.price_id,
                    promocode:        v.promocode,

                    stripe_token:     v.stripe_token,

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
