var Paginate = require('vuejs-paginate')

const locations = new Vue({
    el: '#rootAmenitiesResponses',

    components: {
        paginate: Paginate,
    },

    data: {
        timeout: null,
        isLoad:  false,
        search:  '',

        page:    1,
        list:    window.Laravel.amenitiesLocations,
        pages:   window.Laravel.pages,
    },

    watch: {
        search() {
            let v = this

            v.searchLocations()
        },
        // locationId() {
        //     let v = this
        //     let responses = v.responses[v.locationId] ?? []
        //
        //     for (let i in v.amenities) {
        //
        //     }
        //
        //     console.log(responses)
        // },
    },

    methods: {
        searchLocations(resetPage = true) {
            let v = this

            if (resetPage) {
                v.page = 1
            }

            clearTimeout(v.timeout)
            v.timeout = setTimeout(() => {
                axios.post('/enterprise/amenities/search', {
                        search: v.search,
                        page:   v.page,
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

            this.searchLocations(false)
        },
    },

    mounted() {
        let v = this
        //
        // if (v.locations.length > 0) {
        //     v.locationId = v.locations[0].id
        // }

        v.isLoad = true
    },
});
