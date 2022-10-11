const locations = new Vue({
    el: '#billingAccount',

    data: {
        isLoad:            false,

        selectYearOpen:    false,
        selectMonthOpen:   false,
        selectCompanyOpen: false,
        timeout:           null,

        isEnterprise:      window.Laravel.billingAccount.isEnterprise,
        isActivity:        window.Laravel.billingAccount.isActivity,
        companies:         window.Laravel.billingAccount.companies,
        transfers:         window.Laravel.billingAccount.transfers,
        years:             window.Laravel.billingAccount.years,
        months:            window.Laravel.billingAccount.months,
        info:              window.Laravel.billingAccount.info,
        issuers:           window.Laravel.billingAccount.issuers,

        g1_months:         window.Laravel.billingAccount.g1_months,
        g1_mins:           window.Laravel.billingAccount.g1_mins,
        g2_dailyByHour:    window.Laravel.billingAccount.g2_dailyByHour,

        g1:                null,
        g2:                null,
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
        toggleYearSelect() {
            this.selectYearOpen = !this.selectYearOpen
        },
        toggleMonthSelect() {
            this.selectMonthOpen = !this.selectMonthOpen
        },
        toggleCompanySelect() {
            this.selectCompanyOpen = !this.selectCompanyOpen
        },
        selectCompany(companyId) {
            let v = this

            let activeCompany = v.companies.find(company => company.active === true)

            if (activeCompany.id != companyId) {
                for (i in v.companies) {
                    if (v.companies[i].id == activeCompany.id) {
                        v.companies[i].active = false
                    }

                    if (v.companies[i].id == companyId) {
                        v.companies[i].active = true
                    }
                }

                v.selectCompanyOpen = false
                v.refreshCounters()
            }
        },
        selectMonth(monthId) {
            let v = this

            let activeMonth = v.months.find(month => month.active === true)

            if (activeMonth.id != monthId) {
                for (i in v.months) {
                    if (v.months[i].id == activeMonth.id) {
                        v.months[i].active = false
                    }

                    if (v.months[i].id == monthId) {
                        v.months[i].active = true
                    }
                }

                v.selectMonthOpen = false
                v.refreshCounters()
            }
        },
        selectYear(yearId) {
            let v = this
            let activeYear = v.years.find(year => year.active === true)

            if (activeYear.id != yearId) {
                for (i in v.years) {
                    if (v.years[i].id == activeYear.id) {
                        v.years[i].active = false
                    }

                    if (v.years[i].id == yearId) {
                        v.years[i].active = true
                    }
                }

                v.selectYearOpen = false
                v.refreshCounters()
            }
        },
        tryCloseDropdowns(event) {
            let v = this

            if (v.selectYearOpen && !v.$refs.stylizedSelectYear.contains(event.target))  {
                this.selectYearOpen = false
            }

            if (v.selectMonthOpen && !v.$refs.stylizedSelectMonth.contains(event.target))  {
                this.selectMonthOpen = false
            }

            if (v.selectCompanyOpen && !v.$refs.stylizedSelectCompany.contains(event.target))  {
                this.selectCompanyOpen = false
            }
        },
        refreshCounters() {
            let v = this

            v.isLoad = true
            clearTimeout(v.timeout)
            v.timeout = setTimeout(() => {
                axios.post(v.isActivity?'/root/report/activity':(v.isEnterprise ? '/enterprise/account' : '/billing/account'), {
                        year:       v.selectedYear.id,
                        month:      v.selectedMonth.id,
                        company_id: v.selectedCompany.id,
                     })
                     .then(response => {
                        v.isLoad = false
                         if (response.data.success) {
                             v.companies = response.data.companies
                             v.transfers = response.data.transfers
                             v.years     = response.data.years
                             v.months    = response.data.months
                             v.info      = response.data.info
                             v.issuers   = response.data.issuers
                             v.g1_months   = response.data.minMonths
                             v.g1_mins   = response.data.monthlyMins
                             v.g2_dailyByHour   = response.data.dailyByHour

                            if (v.isActivity) {
                                v.g1.destroy();
                                v.g2.destroy();

                                setTimeout(() => {
                                    v.renderGraph();
                                }, 500);
                            }
                         }
                     })
                     .catch(error => {
                        v.isLoad = false
                         console.log('error', error.message);
                     })
            }, 500)
        },
        localTime(utcTime) {
            return moment(utcTime).local().format('MM/DD/YYYY hh:mma')
        },
        renderGraph() {
            let v = this

            let mins = [];

            for (let i in v.g1_months) {
                month = v.g1_months[i]
                mins.push(v.g1_mins[month] ? v.g1_mins[month] : 0);
            }

            let minsByMonth = {
                chart: {
                    type: 'column',
                    backgroundColor:'rgba(255, 255, 255, 0.0)',
                    renderTo: 'minsByMonth'
                },
                title: {
                    text: ''
                },
                xAxis: {
                    categories: v.g1_months,
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Activity Hours by Month'
                    },
                },
                legend: false,
                colors: ['#f08f02'],
                series: [{
                    name: '',
                    data: mins,
                    marker: {
                        enabled: false
                    }
                }]
            };

            v.g1 = new Highcharts.chart(minsByMonth);
            v.g1.setSize($('#minsByMonth').width(), 170, false);

            let hours = [];
            let counts = [];

            for (let i in v.g2_dailyByHour) {
                let data = v.g2_dailyByHour[i];
                hours.push(moment(data['hour']).local().format('DD HH:mm'));
                counts.push(data['count']);
            }

            let dailyByHour = {
                chart: {
                    type: 'column',
                    backgroundColor:'rgba(255, 255, 255, 0.0)',
                    renderTo: 'dailyByHour'
                },
                title: {
                    text: ''
                },
                xAxis: {
                    categories: hours,
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Daily Activity by Hour'
                    },
                },
                legend: false,
                colors: ['#f08f02'],
                series: [{
                    name: '',
                    data: counts,
                    marker: {
                        enabled: false
                    }
                }]
            };

            v.g2 = new Highcharts.chart(dailyByHour);
            v.g2.setSize($('#dailyByHour').width(), 170, false);
        }
    },

    computed: {
        selectedYear() {
            let v = this

            return v.years.find(year => year.active == true)
        },
        selectedMonth() {
            let v = this

            return v.months.find(month => month.active == true)
        },
        selectedCompany() {
            let v = this

            return v.companies.find(company => company.active == true)
        },
        malePercentage() {
            let v = this

            return v.info.male > 0 ? Math.round(v.info.male / ((v.info.male + v.info.female)/100)) : 0
        },
        femalePercentage() {
            let v = this

            return v.info.female > 0 ? Math.round(v.info.female / ((v.info.male + v.info.female)/100)) : 0
        },
    },

    mounted() {
        let v = this
        let colors = []
        let series = []
        for (let i in v.issuers.programs) {
            colors.push(v.getColor(i))

            series.push({
                name: v.issuers.programs[i].name,
                y: v.issuers.programs[i].count
            })
        }

        if (colors.length) {
            Highcharts.chart('pieGraph', {
                chart: {
                    type: 'pie',
                    backgroundColor: null,
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    margin: [0,0,10,0],
                    spacingTop: 0,
                    spacingBottom: 0,
                    spacingLeft: 0,
                    spacingRight: 0,
                },
                title: {
                    text: ''
                },
                tooltip: {
                    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                },
                accessibility: {
                    point: {
                        valueSuffix: '%'
                    }
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        colors: colors,
                        dataLabels: {
                            enabled: false,
                        },
                    }
                },
                series: [{
                    name: 'Checkins',
                    innerSize: '40%',
                    data: series,
                }],
                exporting: {
                    enabled: false
                },
            })
        }

        document.addEventListener('click', v.tryCloseDropdowns)

        if (v.isActivity) v.renderGraph();
    },
});
