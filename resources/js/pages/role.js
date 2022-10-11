var Paginate = require('vuejs-paginate')

const role = new Vue({
    el: '#roleList',

    components: {
        paginate: Paginate,
    },

    data: {
        timeout: null,
        search:  '',
        isLoad:  false,
        list:    window.Laravel.roles,
        isRoot: window.dashboard.isRoot,
        search_url: window.Laravel.search_url,
        page:    1,
        pages:   window.Laravel.pages,
    },

    watch: {
        search() {
            let v = this

            v.searchRole()
        },
    },

    methods: {
        searchRole(resetPage = true) {
            let v = this

            if (resetPage) {
                v.page = 1
            }

            clearTimeout(v.timeout)
            v.timeout = setTimeout(() => {
                axios.post(v.search_url, {
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

            this.searchRole(false)
        },
    },

    mounted() {
        let v = this

        v.isLoad = true
    },
});
