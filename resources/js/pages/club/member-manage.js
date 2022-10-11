new Vue({
    el: '#managePrograms',

    data: {
        isLoad:                true,
        codeRequired:          false,
        codeVerifiable:        false,

        codeRequiredPrograms:  window.Laravel.code_required_programs,

        program_id:            window.Laravel.program_id,
        code:                  window.Laravel.eligibleCode,
    },

    watch: {
        program_id(value) {
            let v = this

            if (v.codeRequiredPrograms.includes(parseInt(v.program_id))) {
                v.showCodeRequiredField();
            } else {
                v.hideCodeRequiredField();
            }
        },
        code(value) {
            let v = this
            if (v.code.length > 5) v.codeVerifiable = true
            else v.codeVerifiable = false
        }
    },

    methods: {
        showCodeRequiredField() {
            let v = this

            v.codeRequired = true
        },
        hideCodeRequiredField() {
            let v = this

            v.codeRequired = false
        },
        confirmCode() {
            let v = this

            axios.post('/club/members/verifyCode', {
                    code:       v.code,
                    program_id: v.program_id,
                 })
                 .then(response => {
                     if (response.data.success) {
                         v.codeVerifiable = false

                         M.toast({
                             html:          response.data.message,
                             displayLength: 6000,
                             classes:       'green darken-1 white-text',
                         })
                     } else {
                         M.toast({
                             html:          response.data.message,
                             displayLength: 6000,
                             classes:       'red darken-1 white-text',
                         })
                     }
                 })
                 .catch(error => {
                     console.error(error)
                 })
        },
    },

    mounted() {
        let v = this

        if (v.codeRequiredPrograms.includes(parseInt(v.program_id))) {
            v.showCodeRequiredField();
        }

        if (v.code.length > 5) v.codeVerifiable = true;
    },
});
