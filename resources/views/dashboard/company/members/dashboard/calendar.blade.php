<div class="memberDashboard__tab" id="memberDashboard__checkins" v-if="tab == 'calendar'">
    <div class="legend">
        <ul class="left">
            <li><span class="dot__activity"></span> - Activity Day</li>
            <li><span class="dot__checkin"></span> - Check-in</li>
        </ul>
        <ul class="right">
            <li><i class="material-icons" :class="{'active': calendar.type == 'calendar'}" @click="switchCalendarType('calendar')">view_module</i></li>
            <li><i class="material-icons" :class="{'active': calendar.type == 'list'}" @click="switchCalendarType('list')">view_list</i></li>
        </ul>
        <div class="clear"></div>
    </div>
    <div class="memberDashboard__checkins">
        <ul :style="{'width': (calendarTabWidth * calendar.months.length) +'px'}">
            <li v-for="(month, index) in calendar.months"
               :style="{'width': calendarTabWidth +'px'}"
               :class="{'active': index == calendar.activeMonth}"
               @click="setCalendarMonth(index)"
            ><span>@{{ month.name }}</span>@{{ month.year }}</li>
        </ul>
    </div>
    <table v-if="calendar.type == 'calendar'">
        <thead>
            <tr>
                <th v-for="weekday in week">@{{ weekday }}</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="week in calendarWeeks">
                <td v-for="day in week">
                    @{{ day.date }}

                    <div class="dots" v-if="day.checkins.length">
                        <span class="dot dot__activity" v-for="checkin in day.checkins" v-if="checkin.type==2"></span>
                        <span class="dot dot__checkin" v-for="checkin in day.checkins" v-if="checkin.type==1"></span>
                    </div>
                    <ul v-if="day.checkins.length">
                        <li v-for="checkin in day.checkins">
                            @{{ checkin.locationName }}
                        </li>
                    </ul>
                </td>
            </tr>
        </tbody>
    </table>
    <template v-else-if="calendar.months[calendar.activeMonth].checkinsCount > 0" v-for="week in calendarWeeks">
        <template v-for="day in week" v-if="day.checkins.length">
            <div class="memberDashboardCheckinsHead">@{{ day.fullDate }}</div>
            <template v-for="checkin in day.checkins">
                <div class="memberDashboardCheckinsRow" v-for="checkin in day.checkins">@{{ checkin.locationName }}</div>
            </template>
        </template>
    </template>
    <div v-else class="memberDashboardEmptyCalendar">
        Member have no actions this month
    </div>
</div>
