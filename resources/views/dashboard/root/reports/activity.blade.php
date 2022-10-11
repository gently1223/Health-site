@extends('layouts.dashboard')

@section('content')
<style>

</style>
<div class="wrapper" id="billingAccount">
    <div class="pageLoading" v-if="isLoad">
        <div class="preloader-wrapper big active">
            <div class="spinner-layer spinner-blue-only">
                <div class="circle-clipper left">
                    <div class="circle"></div>
                </div><div class="gap-patch">
                    <div class="circle"></div>
                </div><div class="circle-clipper right">
                    <div class="circle"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="billingAccountHeader">
        <div class="stylizedSelect left" ref="stylizedSelectYear">
            <div class="stylizedSelectPlaceholder" @click="toggleYearSelect">@{{ selectedYear.id }}</div>
            <ul :class="{'active': selectYearOpen}">
                <li class="option" v-for="year in years" :class="{'active': year.active}" @click="selectYear(year.id)">@{{ year.id }}</li>
            </ul>
        </div>
        <div class="stylizedSelect left" ref="stylizedSelectMonth">
            <div class="stylizedSelectPlaceholder" @click="toggleMonthSelect">@{{ selectedMonth.title }}</div>
            <ul :class="{'active': selectMonthOpen}">
                <li class="option" v-for="month in months" :class="{'active': month.active}" @click="selectMonth(month.id)">@{{ month.title }}</li>
            </ul>
        </div>
        <div class="stylizedSelect left" ref="stylizedSelectCompany">
            <div class="stylizedSelectPlaceholder" @click="toggleCompanySelect">@{{ selectedCompany.title }}</div>
            <ul :class="{'active': selectCompanyOpen}">
                <li class="option" v-for="company in companies" :class="{'active': company.active}" @click="selectCompany(company.id)">@{{ company.title }}</li>
            </ul>
        </div>
        <div class="buttons right">
            <a :href="'/root/report/download/activity?year='+ selectedYear.id +'&month='+selectedMonth.id +'&company_id='+selectedCompany.id" class="button small dark with-icon-left"><span class="material-icon material-icons-outlined">file_download</span>Download Transactions</a>
        </div>
    </div>

    <h1 class="newTitle">Transactions</h1>

    <div class="billingAccountInfo" style="display: flex">
        <div class="billingAccountInfoLeft">
            <span>Total Members</span>
            <div class="totalBlock">
                <span>Total</span>
                <i>@{{ info.total }}</i>
            </div>
            <div class="infoBlock">
                <span>female</span>
                <i>@{{ femalePercentage }}%</i>
            </div>
            <div class="infoBlock">
                <span>male</span>
                <i>@{{ malePercentage }}%</i>
            </div>
            <div class="infoBlock">
                <span>avg.age</span>
                <i>@{{ info.age }}</i>
            </div>
        </div>
        <div class="chartBlock" style="flex-grow: 1;display:flex;">
            <div id="minsByMonth" style="flex: 1 0 50%"></div>
            <div id="dailyByHour" style="flex: 1 0 50%"></div>
        </div>
    </div>

    <template v-if="transfers.length == 0">
        <center><img src = "/images/concierge/no-location.13c24c22.png" width=200px><br><div style = "font-size: 20px;">No Transactions</div></center>
    </template>
    <template v-if="transfers.length > 0">
        <table class="striped highlight low-padding">
            <thead>
                <tr>
                    <th class="padding-left-20">ID</th>
                    <th>FName</th>
                    <th>LName</th>
                    <th>Activity</th>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Program</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="transfer in transfers">
                    <td class="padding-left-20">@{{ transfer.id }}</td>
                    <td>@{{ transfer.fname }}</td>
                    <td>@{{ transfer.lname }}</td>
                    <td>@{{ transfer.name }}</td>
                    <td>@{{ localTime(transfer.timestamp) }}</td>
                    <td>@{{ transfer.duration }}</td>
                    <td>@{{ transfer.program }}</td>
                </tr>
            </tbody>
        </table>
    </template>
</div>
@endsection

@push('js')
<script src="https://code.highcharts.com/highcharts.js"></script>
<script>
window.Laravel.billingAccount = {!! json_encode([
    'isEnterprise' => false,
    'isActivity'   => true,
    'companies'    => $companies,
    'transfers'    => $transfers,
    'years'        => $years,
    'months'       => $months,
    'info'         => $info,
    'issuers'      => [],
    'g1_months'       => $minMonths,
    'g1_mins'         => $monthlyMins,
    'g2_dailyByHour'  => $dailyByHour,
]) !!};
</script>
<script src="{{ asset('js/pages/billing/account.js') }}?v=1.1"></script>
@endpush
