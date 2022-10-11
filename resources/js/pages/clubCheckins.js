var Paginate = require('vuejs-paginate')

const checkins = new Vue({
    el: '#clubCheckinsList',

    components: {
        paginate: Paginate,
    },

    data: {
        timeout: null,
        search:  '',
        isLoad:  false,
        list:    window.Laravel.checkins,
        page:    1,
        pages:   window.Laravel.pages,
    },

    watch: {
        search() {
            let v = this

            v.searchCheckins()
        },
    },

    methods: {
        searchCheckins(resetPage = true) {
            let v = this

            if (resetPage) {
                v.page = 1
            }

            clearTimeout(v.timeout)
            v.timeout = setTimeout(() => {
                axios.post('/club/checkins/search', {
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

            this.searchCheckins(false)
        },
         redirectToViewPage(id) {
                    let v = this

                    window.location = '/club/members/'+ id +'/view';
                },

    },

    mounted() {
        let v = this

        v.isLoad = true
    },
});
