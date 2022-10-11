const aside = new Vue({
    el: '#amenities',

    data: {
        modal: null,
        list:   window.Amenities ? window.Amenities.list : [],
        filled: window.Amenities ? window.Amenities.filled : {},
    },

    methods: {
        saveAmenities() {
            let v = this

            axios.post('/amenities', {
                    filled: v.filled,
                 })
                 .then(response => {
                     if (response.data.success && window.Amenities.required) {
                         v.modal.close()
                     }

                     M.toast({
                         html:          response.data.message,
                         displayLength: 6000,
                         classes:       response.data.success ? 'blue darken-1 white-text' : 'red darken-1 white-text',
                     })
                 })
                 .catch(error => {
                     console.error(error)
                 })
        },
        setFilled(itemId, value) {
            let v = this

            v.filled[itemId] = value
        },
    },

    mounted() {
        let v = this
        // !! Only show this if role == club_admin
        v.modal = M.Modal.init(v.$refs.amenitiesModal, {dismissible: false})

        if (window.Amenities && window.Amenities.required) {
            setTimeout(() => {
                v.modal.open()
            }, 200)
        }
    },
});
