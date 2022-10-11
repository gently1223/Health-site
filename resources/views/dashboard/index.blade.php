@extends('layouts.dashboard')

@section('content')
<div id="dashboard">


    <!-- Modal Trigger -->
    {{-- <a class="waves-effect waves-light btn modal-trigger" href="#modal1">Modal</a> --}}

      @if ($locationPaymentRequired)
<ul id="globalNotifications">
   <li>Please complete the account setup to receive your monthly payments? <a href="{{ route('billing.account.redirect') }}">
                    Setup your account &rarr;
                </a></li>
</ul>
 @endif

    <div class="hero">
        <div class="wrapper">
<!--             <div class="heroImageBackground" style="background-image: url('/images/homepersons/{{ isset($currentHomePerson) ? $currentHomePerson : '1' }}.png');"></div> -->
            <span>Welcome {{ auth()->user()->fname }}{{ $locationPaymentRequired ? ',' : '' }}</span>

            @if (!$locationPaymentRequired)
            <h5>Wellness your way.</h5>
            @endif

             @if (auth()->user()->hasRole('club_admin|club_enterprise|root'))
                @if ($locationPaymentRequired)
                <a href="{{ route('billing.account.redirect') }}">
                    <h5 style="color: #233746">Setup your account &rarr;</h5>
                </a>
                @endif
             @else
              @if ($locationPaymentRequired)
                <h5 style="color: #233746">Setup your account &rarr;</h5>
             @endif
            @endif



        </div>
    </div>
    <div id="search" style="display: none;">
        <input type="text" id="search--input" v-model="search" placeholder="Search for member by..." />
        <div class="" v-if="search && members.length">
            Search reults here
        </div>
        <div class="" v-else-if="search && !blocked">
            Empty results list
        </div>
    </div>


    @if (auth()->user()->hasRole('club_admin|club_enterprise|root|insurance'))
    <div class="wrapper">
        <ul class="fastLinks">
             @if (auth()->user()->hasRole('club_admin|club_enterprise|root'))
            <li><a href="{{ route('club.employees') }}">Employees <span>&rarr;</span></a></li>
             @endif
            @if (auth()->user()->hasRole('club_admin|club_enterprise|root|insurance'))
            <li><a href="{{ route('club.members') }}">Members <span>&rarr;</span></a></li>
             @endif
            @if (auth()->user()->hasRole('club_admin|club_enterprise|root|insurance'))
            <li><a href="{{ route('club.locations') }}">Locations <span>&rarr;</span></a></li>
            @endif
             <!-- @if (auth()->user()->hasRole('club_admin|club_enterprise|root|insurance')) -->
            <!-- <li><a href="{{ route('billing.account') }}">Club Accounting <span>&rarr;</span></a></li> -->
            <!-- @endif -->
        </ul>


        <div class="mainPageInfo">
            <div style="maring-top:10px;margin-bottom:10px;color: #349ea5;font-size: 15px">ESTIMATED REIMBURSEMENT <b>${{ $totalPayout }}</b></div>

            <div class="billingAccountInfo">

                <div class="billingAccountInfoLeftDash">
                    <span>Insurers</span>
                    <div class="billingAccountInfoRightGraph">
                        <!-- <div class="pieGraph" id="pieGraph" style="width: 110px; height: 110px;"></div> -->
                        <span>Total enrolled</span>
                        <b style="font-size: 25px;font-weight:700">{{ $issuers["enrolled"] }}</b>
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

            <a href="{{ route('billing.account') }}" class="detailedLink">View All Activity &rarr;</a>
            <h2>Latest Activities</h2>

            @if($transfers->count() == 0)
            <center>
                <img src="/images/concierge/no-location.13c24c22.png" width=200px>
                <br>
                <div style="font-size: 20px;">No Transactions</div>
            </center>
            @endif

            @if($transfers->count() > 0)
            <table class="striped highlight low-padding">
                <thead>
                    <tr>
                        <th class="padding-left-20">ID</th>
                        <th>Date</th>
                        <th>Total Visits</th>
                        <th>Paid Visits</th>
                        <th>Company</th>
                        <th>Location</th>
                        <th>Program</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    @foreach ($transfers as $transfer)
                    <tr onclick="location.href='{{ route('member.checkin', $transfer->id) }}'">
                        <td class="padding-left-20">{{ $transfer->id }}</td>
                        <td>{{ $transfer->active_date }}</td>
                        <td>{{ $transfer->visit_count }}</td>
                        <td>{{ $transfer->visit_process_count }}</td>
                        <td style="max-width:160px">{{ $transfer->company }}</td>
                        <td>{{ $transfer->address }}</td>
                        <td>{{ substr($transfer->name, 0, 20) }}{{ strlen($transfer->name) > 20 ? '...' : '' }}</td>
                        <td>${{ number_format($transfer->total, 2, '.', '')}}</td>
                        <td>{{ $transfer->stripe_status == 1 ? 'PAID' : '' }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="chartBlock">
                <div id="insuranceCheckinsByMonth"></div>
            </div>
            <div class="chartBlock">
                <div id="insuranceRevenueByMonth"></div>
            </div>
            @endif
            <br><br><a href="{{ route('billing.account') }}" class="detailedLink">View All Activity &rarr;</a><br><br>
        </div>
    </div>
    @else


    <center>
        <img src="/images/concierge/Fitnesslanding.png" width=100%>
    </center>

    @endif
</div>

<div class="content" style="display: none; padding: 10px 50px 50px;">
    @if (auth()->user()->isAdmin())
    <div class="row">
        <div class="col s12">
            <h5 class="text-main-color left">Current Monthly Revenue</h5>
            @if ($locationPaymentRequired)
            <div class="right">
                <a href="{{ route('billing.account') }}" class="waves-effect waves-light btn red lighten-1" style="margin-top: 1rem;">Set up banking information!</a>
            </div>
            @endif
        </div>
    </div>
    <div class="row">
        <div class="col s12">
            <div class="programsList">
                @foreach ($programs as $key => $program)
                <div class="tile dashboardTile-{{ $key }}">
                    <span>{{ $program->program->name }}</span>
                    <b>{{ $checkinsCount[$program->program->id] ?? 0 }}</b>
                    <i>${{ isset($checkinsCount[$program->program->id]) ? $checkinsCount[$program->program->id] * $program->rate : 0 }}</i>
                </div>
                @endforeach
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col s12 l6">
            <div class="card">
                <div class="card-content">
                    <div class="row">
                        <div class="col s12">
                            <h5 class="no-margin text-main-color">Insurance Revenue by Month</h5>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col s12">
                            {{-- <div id="insuranceRevenueByMonth"></div> --}}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col s12 l6">
            <div class="card">
                <div class="card-content">
                    <div class="row">
                        <div class="col s12">
                            <h5 class="no-margin text-main-color">Insurance Checkins by Month</h5>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col s12">
                            {{-- <div id="insuranceCheckinsByMonth"></div> --}}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    @endif
</div>
@endsection

@push('js')
<script src="https://code.highcharts.com/highcharts.js"></script>
<script>
    window.Laravel.dashboard = {!!json_encode([
        'months'   => $months,
        'checkins' => $monthlyCheckins,
        'issuers'  => $issuers,
    ]) !!}
</script>
<script src="{{ asset('js/pages/dashboard.js') }}"></script>
@endpush
