var Paginate = require('vuejs-paginate')

const members = new Vue({
    el: '#membersList',

    components: {
        paginate: Paginate,
    },

    data: {
        timeout:      null,
        search:       '',
        isLoad:       false,
        list:         window.Laravel.members,
        isAdmin:      window.dashboard.isAdmin,
        isEnterprise: window.Laravel.isEnterprise,
        isCorporate:  window.Laravel.isCorporate,
        ledgerId:     window.Laravel.ledgerId,
        page:         1,
        pages:        window.Laravel.pages,
        searchId:     0,
    },

    watch: {
        search() {
            let v = this

            v.searchMembers()
        },
    },

    methods: {
        searchMembers(resetPage = true) {
            let v = this

            if (resetPage) {
                v.page = 1
            }

            v.searchId += 1

            clearTimeout(v.timeout)
            v.timeout = setTimeout(() => {
                $link = ''
                if (v.ledgerId) $link = '/checkin/'+ v.ledgerId +'/members/search'
                else if (v.isCorporate) $link = '/corporate/members/search'
                else if (v.isEnterprise) $link = '/enterprise/members/search'
                else $link = '/club/members/search'

                axios.post($link, {
                        searchId: v.searchId,
                        search:   v.search,
                        page:     v.page,
                     })
                     .then(response => {
                         if (response.data.success && response.data.searchId == v.searchId) {
                             v.list  = response.data.list
                             v.pages = response.data.pages
                         }
                     })
                     .catch(error => {
                         console.log(error.response)
                     })
            }, 500)
        },

        setPage(page) {
            this.page = page

            this.searchMembers(false)
        },

        redirectToViewPage(id) {
            let v = this

            $link = ''
            if (v.isCorporate) $link = '/corporate/members/'+id+'/view'
            else if (v.isEnterprise) $link = '/enterprise/members/'+id+'/view'
            else $link = '/club/members/'+id+'/view'

            window.location = $link;
        },

        localTime(utcTime) {
            return moment(utcTime).local().format('MM/DD/YYYY hh:mma')
        }
    },

    mounted() {
        let v = this

        v.isLoad = true
    },
});
