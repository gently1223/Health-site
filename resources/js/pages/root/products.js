const employees = new Vue({
    el: '#productsList',

    data: {
        fetchDisabled: false,
    },

    methods: {
        fetchProducts() {
            let v = this
            if (!v.fetchDisabled) {
                v.fetchDisabled = true

                axios.post('/root/products/fetch')
                     .then(response => {
                         if (response.data.success) {
                             window.location.reload()
                         }

                         v.fetchDisabled = false
                     })
                     .catch(error => {
                         console.error(error)
                     })
            }
        }
    },

    mounted() {
    },
});
