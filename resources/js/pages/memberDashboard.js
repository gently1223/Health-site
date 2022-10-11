const locations = new Vue({
    el: '#memberDashboard',

    data: {
        memberId:     window.Laravel.member.id,
        isEnterprise: window.Laravel.isEnterprise,
        isLoad:       false,
        tab:          'calendar',
        week:         ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fi', 'Sa'],

        wellness:     window.Laravel.member.wellness,
        calendar: {
            type:        'calendar',
            checkins:    window.Laravel.member.checkins,
            activeMonth: 0,
            months:      [],
        },

        devices: window.Laravel.member.devices,

        wellnessGraphs: {},

        checkin: {
            modal:      null,
            datepicker: null,
        },

    },

    methods: {
        fillWellness(tiles) {
            let v = this
            for (let t in tiles){
                switch (tiles[t].type) {
                    case 'number':
                    v.wellnessNumber(t, tiles[t].value);
                    break;
                    case 'barGraph':
                    v.wellnessBarGraph(t, tiles[t].title, tiles[t].data, tiles[t].color);
                    break;
                    case 'stacked':
                    v.wellnessStacked(t, tiles[t].title, tiles[t].data);
                    break;
                }
            }
        },
        wellnessNumber(target, value){
            $('.tiles .tile[data-type="'+ target +'"] .tile__content').html(value);
        },
        wellnessBarGraph(target, title, data, color = '#039be5'){
            let v = this

            if (v.wellnessGraphs[target]) {
                v.wellnessGraphs[target].destroy();
            }
            var canvas = $('.tiles .tile[data-type="'+ target +'"] .tile__content canvas');
            var ctx = canvas.length ? canvas[0].getContext('2d') : null;
            ctx.height = $('.tiles .tile[data-type="'+ target +'"] .tile__content').height();

            var config = {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        backgroundColor: color,
                        borderColor: color,
                        data: data.dataset,
                        fill: true,
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    bezierCurve: false,
                    responsive: true,
                    elements: {
                        point: { radius: 0 },
                        line: { tension: 0 },
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            },
                        }]
                    },
                    title: {
                        display: title ? true : false,
                        text: title,
                    },
                    legend:{
                        display: false,
                    },
                },
            };

            if (ctx) {
                v.wellnessGraphs[target] = new Chart(ctx, config);
            }
        },
        wellnessStacked(target, title, data){
            let v = this

            if (v.wellnessGraphs[target]) {
                v.wellnessGraphs[target].destroy();
            }
            $('.tiles .tile[data-type="'+ target +'"] .tile__content').html('<canvas></canvas>');
            var canvas = $('.tiles .tile[data-type="'+ target +'"] .tile__content canvas');
            var ctx = canvas.length ? canvas[0].getContext('2d') : null;
            ctx.height = $('.tiles .tile[data-type="'+ target +'"] .tile__content').height();

            var config = {
                type: 'bar',
                data: {
                    labels:   data.labels,
                    datasets: data.datasets,
                },
                options: {
                    maintainAspectRatio: false,
                    bezierCurve: false,
                    responsive: true,
                    elements: {
                        point: { radius: 0 },
                        line: { tension: 0 },
                    },
                    scales: {
  				        xAxes: [{
  					        stacked: true,
  				        }],
  				        yAxes: [{
  					        stacked: true
  				        }]
  			        },
                    title: {
                        display: title ? true : false,
                        text: title,
                    },
                    legend:{
                        display: false,
                    },
                },
            };

            if (ctx) {
                v.wellnessGraphs[target] = new Chart(ctx, config);
            }
        },
        switchTab(tab) {
            let v = this

            v.tab = tab

            if (v.tab == 'wellness') {
                setTimeout(function() {
                    v.fillWellness(v.wellness)
                }, 500)
            }
        },
        openCheckinModal() {
            let v = this
            v.checkin.modal.open()
        },
        checkinMember() {
            let v = this

            v.checkin.modal.close()
            axios.post((v.isEnterprise ? '/enterprise' : '/club') +'/members/'+ v.memberId +'/checkin', {
                    date: moment(v.checkin.datepicker.date).format('YYYY-MM-DD'),
                    timezoneOffset: new Date().toString().match(/([-\+][0-9]+)\s/)[1],
                 })
                 .then(response => {
                     if (response.data.success) {
                         M.toast({
                             html:          response.data.message,
                             displayLength: 6000,
                             classes:       'blue darken-1 white-text',
                         });

                         setTimeout(() => window.location.reload(), 3);

                         // window.location.reload()
                     } else {
                         M.toast({
                             html:          response.data.message,
                             displayLength: 6000,
                             classes:       'blue darken-1 white-text',
                         });
                     }
                 })
                 .catch(error => {
                     console.error(error)
                 })
        },
        switchCalendarType(type) {
            let v = this
            v.calendar.type = type
        },
        fillCalendarMonths() {
            let v = this

            let startDate = moment(window.Laravel.member.start)
            let endDate   = moment()
            while (startDate < endDate) {
                let countCheckinsForMonth = 0
                for (let date in v.calendar.checkins) {
                    let checkinDate = moment(date)
                    if (checkinDate.format('YYYY-MM') == startDate.format('YYYY-MM')) {
                        countCheckinsForMonth += 1
                    }
                }

                v.calendar.months.push({
                    checkinsCount: countCheckinsForMonth,
                    year:          startDate.format('YYYY'),
                    month:         startDate.format('MM'),
                    name:          startDate.format('MMM'),
                })

                startDate.add(1, 'month')
            }

            v.setCalendarMonth(v.calendar.months.length - 1)

            v.scrollToLastCalendarMonth()
        },
        setCalendarMonth(activeMonth) {
            this.calendar.activeMonth = activeMonth
        },
        scrollToLastCalendarMonth() {
            let v = this

            setTimeout(function() {
                $('.memberDashboard__checkins').scrollLeft(v.calendarTabWidth * (v.calendar.months.length - 5))
            }, 500)
        },
    },

    computed: {
        calendarTabWidth() {
            return (window.innerWidth - 210) / 5
        },
        calendarWeeks() {
            let v = this

            let weeks        = []
            let currentMonth = v.calendar.months[v.calendar.activeMonth]

            if (currentMonth) {
                let firstDay = moment(currentMonth.year+'-'+ currentMonth.month +'-01')

                while (firstDay.format('MMM') == currentMonth.name) {
                    let week = [];
                    for (let w in v.week) {
                        if (firstDay.day() == w && firstDay.format('MMM') == currentMonth.name) {
                            week.push({
                                date:     firstDay.format('DD'),
                                fullDate: firstDay.format('DD MMM YYYY'),
                                checkins: v.calendar.checkins[firstDay.format('YYYY-MM-DD')] ? v.calendar.checkins[firstDay.format('YYYY-MM-DD')] : []
                            })

                            firstDay.add(1, 'day')
                        } else {
                            week.push({
                                date:     '',
                                fullDate: '',
                                checkins: []
                            })
                        }
                    }

                    weeks.push(week)
                }
            }

            return weeks
        },
    },

    mounted() {
        let v = this

        v.width = window.innerWidth
        v.isLoad = true
        v.fillCalendarMonths()

        v.checkin.modal      = M.Modal.init(v.$refs.checkinDateModal)
        v.checkin.datepicker = M.Datepicker.init(v.$refs.checkinDateDatepicker, {
            container: v.$refs.container,
        })

        v.checkin.datepicker.setDate(new Date())
        v.checkin.datepicker.setInputValue()
    },

    // checkins: {
    //     type: 'calendar',
    //     data: {},
    //     ul: 0,
    //     li: 0,
    //     first_open: false,
    //     week: null,
    //     initButton() {
    //         $('#memberDashboard__checkins--accept').unbind().bind('click', function() {
    //             concierge.modals.close('memberDashboard__checkins--modal');
    //
    //             globals.ajax('POST', '/concierge/member/' + concierge.member.dashboard.id + '/checkins/today', {}, function(response) {
    //                 Materialize.toast(response.message, 4000);
    //             });
    //         });
    //         $('#memberDashboard__checkins--button').unbind().bind('click', function() {
    //             concierge.modals.open('memberDashboard__checkins--modal');
    //         });
    //         $('.changeCheckinsView').unbind().bind('click', function() {
    //             concierge.member.dashboard.checkins.changeView($(this).attr('data-type'));
    //         });
    //     },
    //     init() {
    //         concierge.member.dashboard.checkins.get();
    //
    //         $('.memberDashboard__right .concierge__tabs [data-target="memberDashboard__checkins"]').bind('click', function() {
    //             if (concierge.member.dashboard.checkins.first_open) {
    //                 setTimeout(function() {
    //                     $('.memberDashboard__checkins').scrollLeft(concierge.member.dashboard.checkins.first_open);
    //                     concierge.member.dashboard.checkins.first_open = false;
    //                 }, 500);
    //             }
    //             concierge.member.dashboard.checkins.get();
    //         });
    //     },
    //     get() {
    //         globals.ajax('POST', '/concierge/member/' + concierge.member.dashboard.id + '/checkins', {
    //             insurance: concierge.member.dashboard.insurance,
    //         }, function(response) {
    //             if (response.success) {
    //                 concierge.member.dashboard.checkins.data = {};
    //                 concierge.member.dashboard.checkins.fill(response.checkins, response.year, response.week, response.today);
    //             }
    //         });
    //     },
    //     fill(data, year, week, today) {
    //         concierge.member.dashboard.checkins.li = $('.memberDashboard__right').width() / 5;
    //         concierge.member.dashboard.checkins.week = week;
    //
    //         let months = '';
    //         let active = '';
    //         let lis = 0;
    //         let cur_date = today.split(' ');
    //         for (let y in data) {
    //             if (!concierge.member.dashboard.checkins.data[y]) concierge.member.dashboard.checkins.data[y] = [];
    //             for (let m in year) {
    //                 let month = year[m];
    //                 if (data[y][month]) {
    //                     ++lis;
    //                     concierge.member.dashboard.checkins.data[y][month] = data[y][month];
    //
    //                     if (y == cur_date[0] && month == cur_date[1]) {
    //                         active = ' class="active"';
    //                         concierge.member.dashboard.checkins.table(data[y][month]);
    //                     }
    //
    //                     months += '<li style="width: ' + concierge.member.dashboard.checkins.li + 'px;" data-year="' + y + '" data-month="' + month + '"' + active + '><span>' + month + '</span>' + y + '</li>';
    //                 }
    //             }
    //         }
    //
    //         let $ul = $('.memberDashboard__checkins ul');
    //         $ul.html(months);
    //         concierge.member.dashboard.checkins.ul = concierge.member.dashboard.checkins.li * lis;
    //         $ul.css('width', concierge.member.dashboard.checkins.ul + 'px');
    //         $('.memberDashboard__checkins').scrollLeft(concierge.member.dashboard.checkins.li * (lis - 5));
    //         concierge.member.dashboard.checkins.first_open = concierge.member.dashboard.checkins.li * (lis - 5);
    //
    //         concierge.member.dashboard.checkins.bind();
    //     },
    //     table(data) {
    //         if ($('#memberDashboard__checkins table thead').html() == '') {
    //             let thead = '';
    //             for (let k in concierge.member.dashboard.checkins.week) {
    //                 thead += '<th>' + concierge.member.dashboard.checkins.week[k] + '</th>';
    //             }
    //             $('#memberDashboard__checkins table thead').html(thead);
    //         }
    //
    //         let table = '';
    //         let tr = '';
    //         let weekday = 0;
    //         for (let d in data) {
    //             let day = data[d];
    //             let today = day.today ? ' class="today"' : '';
    //             let dots = [];
    //             let popups = [];
    //             if (day.checkin) {
    //                 dots.push('<span class="dot dot__checkin"></span>');
    //                 popups.push('<li>' + day.checkin + '</li>');
    //             }
    //             if (Array.isArray(day.class) && day.class.length) {
    //                 dots.push('<span class="dot dot__class"></span>');
    //                 for (let c in day.class) {
    //                     popups.push('<li>' + day.class[c] + '</li>');
    //                 }
    //             }
    //             if (Array.isArray(day.booking) && day.booking.length) {
    //                 dots.push('<span class="dot dot__booking"></span>');
    //                 for (let b in day.booking) {
    //                     popups.push('<li>' + day.booking[b] + '</li>');
    //                 }
    //             }
    //             if (Array.isArray(day.peloton) && day.peloton.length) {
    //                 dots.push('<span class="dot dot__peloton"></span>');
    //                 for (let b in day.peloton) {
    //                     popups.push('<li>' + day.peloton[b] + '</li>');
    //                 }
    //             }
    //
    //             if (Array.isArray(day.fod) && day.fod.length) {
    //                 dots.push('<span class="dot dot__fod"></span>');
    //                 for (let b in day.fod) {
    //                     popups.push('<li>' + day.fod[b] + '</li>');
    //                 }
    //             }
    //
    //             dots = dots.length ? '<div class="dots">' + dots.join('') + '</div>' : '';
    //             popups = popups.length ? '<ul>' + popups.join('') + '</ul>' : '';
    //             weekday = parseInt(day.weekday);
    //
    //             if (d == 0 && weekday > 0) {
    //                 for (let k in concierge.member.dashboard.checkins.week) {
    //                     if (k < weekday) tr += '<td></td>';
    //                 }
    //             }
    //
    //             if (weekday == 0 && d != 0) {
    //                 table += '<tr>' + tr + '</tr>';
    //                 tr = '';
    //             }
    //
    //             tr += '<td' + today + '>' + day.date + dots + popups + '</td>';
    //         }
    //
    //         if (tr != '') {
    //             for (let k in concierge.member.dashboard.checkins.week) {
    //                 if (k > weekday) tr += '<td></td>';
    //             }
    //             table += '<tr>' + tr + '</tr>';
    //         }
    //
    //         $('#memberDashboard__checkins table tbody').html(table);
    //     },
    //     listTable(data, month, year) {
    //         $('#memberDashboard__checkins table thead').html('');
    //
    //         let table = '';
    //         for (let i in data) {
    //             let day = data[i]
    //             if (data[i].checkin ||
    //                 (Array.isArray(day.booking) && day.booking.length) ||
    //                 (Array.isArray(day.class) && day.class.length) ||
    //                 (Array.isArray(day.fod) && day.fod.length) ||
    //                 (Array.isArray(day.peloton) && day.peloton.length)
    //             ) {
    //                 table += '<tr class="memberDashboardCheckinsHead"><td>'+ day.date +' '+ month +' '+ year +'</td></tr>';
    //
    //                 if (day.checkin) {
    //                     table += '<tr class="memberDashboardCheckinsRow"><td>' + day.checkin + '</td></tr>';
    //                 }
    //                 if (Array.isArray(day.class) && day.class.length) {
    //                     for (let c in day.class) {
    //                         table += '<tr class="memberDashboardCheckinsRow"><td>' + day.class[c] + '</td></tr>';
    //                     }
    //                 }
    //                 if (Array.isArray(day.booking) && day.booking.length) {
    //                     for (let b in day.booking) {
    //                         table += '<tr class="memberDashboardCheckinsRow"><td>' + day.booking[b] + '</td></tr>';
    //                     }
    //                 }
    //                 if (Array.isArray(day.peloton) && day.peloton.length) {
    //                     for (let b in day.peloton) {
    //                         table += '<tr class="memberDashboardCheckinsRow"><td>' + day.peloton[b] + '</td></tr>';
    //                     }
    //                 }
    //
    //                 if (Array.isArray(day.fod) && day.fod.length) {
    //                     for (let b in day.fod) {
    //                         table += '<tr class="memberDashboardCheckinsRow"><td>' + day.fod[b] + '</td></tr>';
    //                     }
    //                 }
    //             }
    //         }
    //
    //         if (table == '') {
    //             table = '<tr class="empty"><td>Member have no actions this motnh</td></tr>';
    //         }
    //
    //         $('#memberDashboard__checkins table tbody').html(table);
    //     },
    //     switch (year, month) {
    //         if (concierge.member.dashboard.checkins.data[year][month]) {
    //             $('.memberDashboard__checkins ul li').removeClass('active');
    //             $('.memberDashboard__checkins ul li[data-year="' + year + '"][data-month="' + month + '"]').addClass('active');
    //
    //             if (concierge.member.dashboard.checkins.type == 'calendar') concierge.member.dashboard.checkins.table(concierge.member.dashboard.checkins.data[year][month]);
    //             else concierge.member.dashboard.checkins.listTable(concierge.member.dashboard.checkins.data[year][month], month, year);
    //         }
    //     },
    //     bind() {
    //         $('.memberDashboard__checkins ul li').unbind().bind('click', function() {
    //             let $this = $(this);
    //             if (!$this.hasClass('active')) {
    //                 concierge.member.dashboard.checkins.switch($this.attr('data-year'), $this.attr('data-month'));
    //             }
    //         });
    //     },
    //     changeView(type) {
    //         concierge.member.dashboard.checkins.type = type;
    //
    //         let currentYear  = $('.memberDashboard__checkins ul li.active').attr('data-year');
    //         let currentMonth = $('.memberDashboard__checkins ul li.active').attr('data-month');
    //
    //         if (type == 'calendar') {
    //             concierge.member.dashboard.checkins.table(concierge.member.dashboard.checkins.data[currentYear][currentMonth]);
    //         } else {
    //             concierge.member.dashboard.checkins.listTable(concierge.member.dashboard.checkins.data[currentYear][currentMonth], currentMonth, currentYear);
    //         }
    //
    //         $('.changeCheckinsView:not([data-type="'+ type +'"])').removeClass('active');
    //         $('.changeCheckinsView[data-type="'+ type +'"]').addClass('active');
    //     },
    // },
});
