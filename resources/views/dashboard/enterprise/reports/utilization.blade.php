@extends('layouts.dashboard')

@section('content')
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
            <a :href="'/enterprise/account/download/transactions?year='+ selectedYear.id +'&month='+selectedMonth.id +'&company_id='+selectedCompany.id" class="button small dark with-icon-left"><span class="material-icon material-icons-outlined">file_download</span>Download Transactions</a>
             <a :href="'/enterprise/account/download/insurance?year='+ selectedYear.id +'&month='+selectedMonth.id +'&company_id='+selectedCompany.id" class="button small dark with-icon-left"><span class="material-icon material-icons-outlined">file_download</span>Download Insurance</a>
        </div>
    </div>

    <h1 class="newTitle">Transactions</h1>

    <div class="billingAccountInfo">
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
        <div class="billingAccountInfoRight">
            <span>Insurers</span>
            <div class="billingAccountInfoRightGraph">
                <div class="pieGraph" id="pieGraph" style="width: 110px; height: 110px;"></div>
                <span>Total enrolled</span>
                <b style="font-size: 25px;font-weight:700">@{{ issuers.enrolled }}</b>
            </div>
            <div class="billingAccountInfoRightBlocks">
                <div class="billingAccountInfoRightBlock" v-for="(program, key) in issuers.programs">
                    <div class="legend" :style="{background: getColor(key)}"></div>
                    <span>@{{ program.name }}</span>
                    <b>@{{ program.count }}</b>
                    <!-- <i>@{{ program.percentage }}%</i> -->
                </div>
            </div>
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
                    <th>Date</th>
                    <th>Total Visits</th>
                    <th>Paid Visits</th>
                    <th>Rate</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Program</th>
                    <th>Amount</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="transfer in transfers">
                    <td class="padding-left-20">@{{ transfer.id }}</td>
                    <td>@{{ transfer.active_date }}</td>
                    <td>@{{ transfer.visit_count }}</td>
                    <td>@{{ transfer.visit_process_count }}</td>
                    <td>@{{ transfer.reimbursement }}</td>
                    <td>@{{ transfer.company }}</td>
                    <td>@{{ transfer.address }}</td>
                    <td>@{{ transfer.name }}</td>
                    <td>$@{{ transfer.total }}</td>
                    <td>@{{ transfer.status }}</td>
                </tr>
            </tbody>
        </table>
    </template>
</div>
<div class="content" style="display: none;">
    <div class="row">
        <div class="col s12">
            <h5 class="left">Pay Out</h5>
            <a href="{{ route('billing.account.redirect') }}" id="stripe-connect" class="btn green mainColorBackground right" style="margin-top: 1rem;" v-if="stripeAccount">Update <b>Bank</b> Account</a>
            <a href="{{ route('billing.account.redirect') }}" id="stripe-connect" class="btn green mainColorBackground right" style="margin-top: 1rem;" v-else>Add <b>bank</b> account</a>
        </div>
    </div>
    <div class="row">
        <div class="col s12 m8 offset-m2">
            <template v-if="stripeAccount">
                <h5 v-html="stripeAccount.name"></h5>
                <div class="card payoutMethod" v-for="payoutMethod in stripeAccount.payment_methods" @click="setAsDefaultPayoutMethod(payoutMethod.id)">
                    <template v-if="payoutMethod.type == 'card'">
                        <i class="material-icons left">credit_card</i> Credit Card: @{{ payoutMethod.detailed.brand }} **** **** **** @{{ payoutMethod.detailed.last4 }} <i v-if="payoutMethod.preferable" class="material-icons right green-text">task_alt</i>
                    </template>
                    <template v-else>
                        <i class="material-icons left">account_balance</i> @{{ payoutMethod.detailed.bank_name }}: @{{ payoutMethod.detailed.routing_number }} | **** @{{ payoutMethod.detailed.last4 }} <i v-if="payoutMethod.preferable" class="material-icons right green-text">task_alt</i>
                    </template>
                </div>
            </template>
        </div>
    </div>
</div>
@endsection

@push('js')
<script src="https://code.highcharts.com/highcharts.js"></script>
<script>
window.Laravel.billingAccount = {!! json_encode([
    'isEnterprise' => true,
    'companies'    => $companies,
    'transfers'    => $transfers,
    'years'        => $years,
    'months'       => $months,
    'info'         => $info,
    'issuers'      => $issuers,
]) !!};
</script>
<script src="{{ asset('js/pages/billing/account.js') }}?v=1.1"></script>
@endpush
