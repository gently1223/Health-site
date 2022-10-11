var Paginate = require('vuejs-paginate')

const employees = new Vue({
    el: '#employeesList',

    components: {
        paginate: Paginate,
    },

    data: {
        timeout: null,
        search:  '',
        isLoad:  false,
        list:    window.Laravel.employees,
        isAdmin: window.dashboard.isAdmin,
        page:    1,
        pages:   window.Laravel.pages,
    },

    watch: {
        search() {
            let v = this

            v.searchEmployees()
        },
    },

    methods: {
        searchEmployees(resetPage = true) {
            let v = this

            if (resetPage) {
                v.page = 1
            }

            clearTimeout(v.timeout)
            v.timeout = setTimeout(() => {
                axios.post(window.Laravel.enterpriseEmployees ? '/enterprise/employees/search' : '/club/employees/search', {
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

            this.searchEmployees(false)
        },
    },

    mounted() {
        let v = this

        v.isLoad = true
    },
});
