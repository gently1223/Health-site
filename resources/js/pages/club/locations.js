new Vue({
    el: '#clubLocationCreate',

    data: {
        isLoad:           true,

        products:         window.Laravel.products,

        timeout:          null,
        stepper:          null,
        location_club_id: '',
        location_name:    '',
        location_city:    '',
        location_state:   '',
        location_postal:  '',
        location_address: '',
        location_phone:   '',

        shipment_same_address: 1,
        shipment_city:    '',
        shipment_state:   '',
        shipment_postal:  '',
        shipment_address: '',

        subscription_id:  0,
        price_id:         0,
    },

    methods: {
        setPrice(productId, priceId) {
            let v = this

            $('#selectSubscriptionStep').removeClass('wrong');

            v.subscription_id = productId
            v.price_id = priceId
        },
        nextStep() {
            let v = this

            let valid = v.validate()

            if (!valid) {
                v.stepper.wrongStep()
            } else {
                v.stepper.nextStep()
            }

            setTimeout(function() {
                // In case if 100% discount attached we should skip
                let steps = v.stepper.getSteps()
                if (steps.active.index == 1) {
                    if (v.products[0].prices[0].price == '$0.00') {
                        v.subscription_id = v.products[0].id
                        v.price_id = v.products[0].prices[0].id

                        v.stepper.nextStep()
                    }
                }
            }, 500)
        },
        validate() {
            let v = this
            let valid = true
            let steps = v.stepper.getSteps()

            if (steps.active.index == 0)  {
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
            } else if (steps.active.index == 1) {
                if (v.subscription_id == 0 || v.price_id == 0) {
                    valid = false
                }
            } else if (steps.active.index == 2) {
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

            let valid = v.validate()

            if (!valid) {
                v.stepper.wrongStep()
            } else {
                axios.post('/club/locations/slave/validate', {
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
                     })
                     .then(response => {
                         if (response.data.success) {
                             v.$refs.slaveLocationForm.submit();
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
            }
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
