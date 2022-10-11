$(function() {
    let revenues = [];
    let checkins = [];

    for (let i in window.Laravel.dashboard.months) {
        month = window.Laravel.dashboard.months[i]

        revenues.push(window.Laravel.dashboard.checkins[month] ? window.Laravel.dashboard.checkins[month]['revenue'] : 0);
        checkins.push(window.Laravel.dashboard.checkins[month] ? window.Laravel.dashboard.checkins[month]['count'] : 0);
    }

    let insuranceRevenueByMonth = {
        chart: {
           type: 'column'
        },
        title: {
            text: ''
        },
        xAxis: {
            categories: window.Laravel.dashboard.months,
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Insurance Revenue by Month'
            },
        },
        legend: false,
        colors: ['#49a349'],
        series: [{
            name: '',
            data: revenues
        }]
    };

    if ($('#insuranceRevenueByMonth').length) {
        Highcharts.chart('insuranceRevenueByMonth', insuranceRevenueByMonth);
    }

    let insuranceCheckinsByMonth = {
        chart: {
           type: 'column'
        },
        title: {
            text: ''
        },
        xAxis: {
            categories: window.Laravel.dashboard.months,
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Insurance Checkins by Month'
            },
        },
        legend: false,
        colors: ['#f08f02'],
        series: [{
            name: '',
            data: checkins
        }]
    };

    if ($('#insuranceCheckinsByMonth').length) {
        Highcharts.chart('insuranceCheckinsByMonth', insuranceCheckinsByMonth);
    }
});

const locations = new Vue({
    el: '#search',

    data: {
        isLoad:  false,
        search:  null,
        timeout: null,
        blocked: false,
        members: [],
    },

    methods: {
        searchMembers() {
            let v = this

            axios.post('/search', {
                    search: v.search
                 })
                 .then(response => {
                     v.blocked = false

                     if (response.data.success) {
                         v.members = response.data.members
                     }
                 })
                 .catch(error => {
                     console.error(error)
                 })
        }
    },

    watch: {
        search(value) {
            let v = this

            v.blocked = true

            clearTimeout(v.timeout)
            v.timeout = setTimeout(() => {
                v.searchMembers()
            }, 500)
        }
    },

    mounted() {
        setTimeout(function() {
            if(document.hidden) {
                $(window).focus(function() {
                    window.location.reload();
                });
            } else {
                window.location.reload();
            }
        }, 300000);
    },
});

const dashboards = new Vue({
    el: '#dashboard',

    data: {
        issuers: window.Laravel.dashboard.issuers,
    },

    methods: {
        getColor(key) {
            let base = '#232a53'

            if (key == 0) {
                return base
            }

            let opacity = key/10
            return Highcharts.color(base).brighten(opacity).get()
        },
    },

    mounted() {

    },
});
