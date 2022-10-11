var Paginate = require('vuejs-paginate')

const locations = new Vue({
    el: '#rootShipmentsList',

    components: {
        paginate: Paginate,
    },

    data: {
        timeout:      null,
        search:       '',
        isLoad:       false,
        list:         window.Laravel.shipments,
        isAdmin:      window.dashboard.isAdmin,
        isEnterprise: window.dashboard.isEnterprise,
        provisioned:  0,
        page:         1,
        pages:        window.Laravel.pages,
    },

    watch: {
        search() {
            let v = this

            v.searchShipments()
        },
        provisioned() {
            let v = this

            v.searchShipments()
        },
    },

    methods: {
        searchShipments(resetPage = true) {
            let v = this

            if (resetPage) {
                v.page = 1
            }

            clearTimeout(v.timeout)
            v.timeout = setTimeout(() => {
                axios.post('/root/shipments/search', {
                        search:      v.search,
                        page:        v.page,
                        provisioned: v.provisioned,
                     })
                     .then(response => {
                         if (response.data.success) {
                             v.list  = response.data.list
                             v.pages = response.data.pages
                         }
                     })
                     .catch(error => {
                         console.error(error)
                     })
            }, 500)
        },

        setPage(page) {
            this.page = page

            this.searchShipments(false)
        },
    },

    mounted() {
        let v = this

        v.isLoad = true
    },
});
