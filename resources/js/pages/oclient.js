var Paginate = require('vuejs-paginate')

const client = new Vue({
    el: '#clientList',

    components: {
        paginate: Paginate,
    },

    data: {
        timeout: null,
        search:  '',
        isLoad:  false,
        list:    window.Laravel.clients,
        isRoot: window.dashboard.isRoot,
        search_url: window.Laravel.search_url,
        page:    1,
        pages:   window.Laravel.pages,
    },

    watch: {
        search() {
            let v = this

            v.searchClient()
        },
    },

    methods: {
        searchClient(resetPage = true) {
            let v = this

            if (resetPage) {
                v.page = 1
            }

            clearTimeout(v.timeout)
            v.timeout = setTimeout(() => {
                console.log(v.search_url, v.search);
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

            this.searchClient(false)
        },
    },

    mounted() {
        let v = this

        v.isLoad = true
    },
});

$("#company_id").on('change', function(){
    var company_id = $(this).val();
    var selected_company = window.Laravel.companies.find(c => (c.id == company_id));

    $('#program_id').empty();
    if (selected_company.programs && selected_company.programs.length > 0) {
        $('#program_id').append('<option>Choose program</option>');
        selected_company.programs.forEach(p => {
            $('#program_id').append('<option value="'+p.program.id+'">'+p.program.name+'</option>');
        });
    } else {
        $('#program_id').append('<option>No available programs</option>');
    }

    $('#program_id').formSelect();
});
