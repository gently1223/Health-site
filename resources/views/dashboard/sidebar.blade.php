<aside id="aside" :class="{isOpen: isOpen}" class="mainColorBackground">
    <!-- <div class="logo"> -->
        <!-- <a href="{{ route('index') }}">{{ config('app.name', 'Veritap') }}</a> --><br>
    <!-- </div> -->
    <ul class="collapsible collapsible-accordion">
        @if (auth()->user()->hasRole('root'))
        <li :class="{active: activeMenuGroup == 'root'}">
            <!-- <a class="collapsible-header waves-effect waves-light">Root</a> -->
            <a class="collapsible-header waves-effect waves-light" href="javascript:void(0);"><b>Root<i class="right material-icons">chevron_right</i></b></a>
            <div class="collapsible-body">
                <ul class="collapsible">
                    <li :class="{currentRoute: activeMenu == 'enterprise.locations.map'}"><a href="{{ route('enterprise.locations.map') }}">Surveillance</a></li>
                    <li :class="{currentRoute: activeMenu == 'root.products'}"><a href="{{ route('root.products') }}"><b>Products (Stripe)</b></a></li>
                    <li :class="{currentRoute: activeMenu == 'root.locations'}"><a href="{{ route('root.locations') }}"><b>New Locations</b></a></li>
                    <li :class="{currentRoute: activeMenu == 'root.shipments'}"><a href="{{ route('root.shipments') }}"><b>Locations Shipments</b></a></li>
                    <li :class="{currentRoute: activeMenu == 'root.notifications'}"><a href="{{ route('root.notifications') }}"><b>Global Notifications</b></a></li>
                    <li :class="{active: activeMenuCollapse == 'root.report'}">
                        <a class="collapsible-header waves-effect waves-light" href="javascript:void(0);"><b>Reports<i class="right material-icons">chevron_right</i></b></a>
                        <ul class="collapsible-body">
                            <li :class="{currentRoute: activeMenu == 'root.report.activity'}"><a href="{{ route('root.report.activity') }}"><b>Activity Report</b></a></li>
                            <li :class="{currentRoute: activeMenu == 'root.report.humana'}"><a href="{{ route('root.report.humana') }}"><b>Humana Report</b></a></li>
                        </ul>
                    </li>
                    <li :class="{active: activeMenuCollapse == 'root.crud'}">
                        <a class="collapsible-header waves-effect waves-light" href="javascript:void(0);"><b>Tables<i class="right material-icons">chevron_right</i></b></a>
                        <ul class="collapsible-body">
                            <li :class="{currentRoute: activeMenu == 'root.amenities'}"><a href="{{ route('root.amenities') }}"><b>Amenities</b></a></li>
                            <li :class="{currentRoute: activeMenu == 'root.company'}"><a href="{{ route('root.company') }}">Companies</a></li>
                            <li :class="{currentRoute: activeMenu == 'root.oclients'}"><a href="{{ route('root.oclients') }}">OAuth Clients</a></li>
                            <li :class="{currentRoute: activeMenu == 'root.activity'}"><a href="{{ route('root.activity') }}">Activities</a></li>
                            <li :class="{currentRoute: activeMenu == 'root.apis'}"><a href="{{ route('root.apis') }}">Apis</a></li>
                            <li :class="{currentRoute: activeMenu == 'root.challenges'}"><a href="{{ route('root.challenges') }}">Challenges</a></li>
                            <li :class="{currentRoute: activeMenu == 'root.programs'}"><a href="{{ route('root.programs') }}">Programs</a></li>
                            <li :class="{currentRoute: activeMenu == 'root.roles'}"><a href="{{ route('root.roles') }}">Roles</a></li>
                            <li :class="{currentRoute: activeMenu == 'root.tiers'}"><a href="{{ route('root.tiers') }}">Program Tiers</a></li>
                            <li :class="{currentRoute: activeMenu == 'root.sectors'}"><a href="{{ route('root.sectors') }}">Program Sectors</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </li>
        @endif


        @if (auth()->user()->hasRole('insurance|club_enterprise|root'))
        <li :class="{active: activeMenuGroup == 'enterprise'}">
            <a class="collapsible-header waves-effect waves-light" href="javascript:void(0);"><b>Enterprise<i class="right material-icons">chevron_right</i></b></a>
            <div class="collapsible-body">
                <ul class="collapsible">
                    @if (auth()->user()->hasRole('club_enterprise|root|insurance'))

                    <li :class="{currentRoute: activeMenu == 'enterprise.locations'}"><a href="{{ route('enterprise.locations') }}"><b>Switch</b></a></li>
                    @endif

                    <li :class="{currentRoute: activeMenu == 'enterprise.employees'}"><a href="{{ route('enterprise.employees') }}">People</a></li>
                     @if (auth()->user()->hasRole('club_enterprise|root|insurance'))
                    <li :class="{currentRoute: activeMenu == 'enterprise.locations.list'}"><a href="{{ route('enterprise.locations.list') }}">Locations</a></li>
                     @endif

                    @if (auth()->user()->hasRole('club_enterprise|root'))
                    <li :class="{currentRoute: activeMenu == 'enterprise.provisioning'}"><a href="{{ route('enterprise.provisioning') }}">Provisioning</a></li>

                    <!-- <li :class="{currentRoute: activeMenu == 'enterprise.employees'}"><a href="{{ route('enterprise.employees') }}">Employees</a></li> -->
                    <!-- <li :class="{currentRoute: activeMenu == 'enterprise.members'}"><a href="{{ route('enterprise.members') }}">Members</a></li> -->
                    <li :class="{currentRoute: activeMenu == 'enterprise.programs'}"><a href="{{ route('enterprise.programs') }}">Programs</a></li>
                    {{-- <li :class="{currentRoute: activeMenu == 'enterprise.docs'}"><a href="{{ route('enterprise.docs') }}">Docs</a></li> --}}
                    @endif
                    @if (auth()->user()->hasRole('club_enterprise|root|insurance'))
                    <li :class="{active: activeMenuCollapse == 'enterprise.report'}">
                        <a class="collapsible-header waves-effect waves-light" href="javascript:void(0);"><b>Reports<i class="right material-icons">chevron_right</i></b></a>
                        <ul class="collapsible-body">
                            <li :class="{currentRoute: activeMenu == 'enterprise.billing.account'}"><a href="{{ route('enterprise.billing.account') }}"><b>Utilization Report</b></a></li>
                            <li><a href="{{ route('enterprise.report.download.onboard') }}"><b>Onboard Report</b></a></li>
                            <li :class="{currentRoute: activeMenu == 'enterprise.amenities'}"><a href="{{ route('enterprise.amenities') }}"><b>Amenities Report</b></a></li>
                        </ul>
                    </li>
                    @endif
                </ul>
            </div>
        </li>
        @endif

         @if (auth()->user()->hasRole('root|corp_wellness'))
           <li :class="{active: activeMenuCollapse == 'root.report'}">
                        <a class="collapsible-header waves-effect waves-light" href="javascript:void(0);"><b>Corporate<i class="right material-icons">chevron_right</i></b></a>
                        <ul class="collapsible-body">
                           
                        <li :class="{currentRoute: activeMenu == 'corporate.insight'}"><a href="{{ route('corporate.insight') }}">Insights</a></li>
                        <li :class="{currentRoute: activeMenu == 'corporate.partners'}"><a href="{{ route('corporate.partners') }}">Partners</a></li>
                        <li :class="{currentRoute: activeMenu == 'corporate.communication'}"><a href="{{ route('corporate.communication') }}">Communication</a></li>
                        <li :class="{currentRoute: activeMenu == 'corporate.challenge'}"><a href="{{ route('corporate.challenge') }}">Challenges</a></li>
                        <li :class="{currentRoute: activeMenu == 'corporate.reward'}"><a href="{{ route('corporate.reward') }}">Rewards</a></li>

                        <li :class="{currentRoute: activeMenu == 'corporate.members'}"><a href="{{ route('corporate.members') }}"><b>Employees</b></a></li>
                        </ul>
                    </li>
        @endif

        @if (auth()->user()->hasRole('club_admin|club_employee|club_enterprise|root|insurance'))
        <li :class="{active: activeMenuGroup == 'club'}">
           <a class="collapsible-header waves-effect waves-light" href="javascript:void(0);"><b>Club<i class="right material-icons">chevron_right</i></b></a>
            <div class="collapsible-body">
                <ul>
                    @if (auth()->user()->hasRole('club_admin|insurance|root') && isset($globalAmenities))
                    <li :class="{currentRoute: activeMenu == 'club.amenities'}"><a href="{{ route('club.amenities') }}"><b>Amenities</b></a></li>
                    @endif
                    @if (auth()->user()->hasRole('club_admin|club_enterprise|root'))
                    <li :class="{currentRoute: activeMenu == 'club.locations'}"><a href="{{ route('club.locations') }}">Location</a></li>
                    @endif
                    @if (auth()->user()->hasRole('club_enterprise|root|insurance'))
                    <!-- && auth()->user()->isOnClubParentLocation()) -->
                    <li :class="{currentRoute: activeMenu == 'club.programs'}"><a href="{{ route('club.programs') }}">Programs</a></li>
                    @endif
                    @if (auth()->user()->isRegisterFeePaid())
                    @if (auth()->user()->hasRole('club_admin|club_enterprise|root|insurance'))
                    <li :class="{currentRoute: activeMenu == 'club.employees'}"><a href="{{ route('club.employees') }}">Employees</a></li>
                    @endif
                    <li :class="{currentRoute: activeMenu == 'club.members'}"><a href="{{ route('club.members') }}">Members</a></li>
                    {{-- <li :class="{currentRoute: activeMenu == 'club.checkins'}"><a href="{{ route('club.checkins') }}">Checkins</a></li> --}}
                    {{-- <li :class="{currentRoute: activeMenu == 'club.docs'}"><a href="{{ route('club.docs') }}">Docs</a></li> --}}
                    @endif
                </ul>
            </div>
        </li>
        @endif
        @if (auth()->user()->hasRole('club_admin|club_enterprise|root') && auth()->user()->isOnClubParentLocation())
        <li :class="{active: activeMenuGroup == 'billing'}">
            <a class="collapsible-header waves-effect waves-light" href="javascript:void(0);"><b>Billing<i class="right material-icons">chevron_right</i></b></a>
            <div class="collapsible-body">
                <ul>
                    {{-- <li :class="{currentRoute: activeMenu == 'billing.subscription'}"><a href="{{ route('billing.subscription') }}">Subscription</a></li> --}}
                    <li :class="{currentRoute: activeMenu == 'billing.account'}"><a href="{{ route('billing.account') }}">Accounting
                    <li :class="{currentRoute: activeMenu == 'billing.card'}"><a href="{{ route('billing.card') }}">Card</a></li>
                    <li :class="{currentRoute: activeMenu == 'billing.invoices'}"><a href="{{ route('billing.invoices') }}">Invoices</a></li>
                </ul>
            </div>
        </li>
        @endif
        <li :class="{active: activeMenuGroup == 'settings'}">
           <a class="collapsible-header waves-effect waves-light" href="javascript:void(0);"><b>Settings<i class="right material-icons">chevron_right</i></b></a>
            <div class="collapsible-body">
                <ul>
                    @if (auth()->user()->hasRole('club_admin|club_enterprise|root'))
                    <li :class="{currentRoute: activeMenu == 'settings.company'}"><a href="{{ route('settings.company') }}">Company</a></li>
                    @endif

                    @if (auth()->user()->hasRole('club_admin|club_enterprise|root'))
                    <li :class="{currentRoute: activeMenu == 'settings.profile'}"><a href="{{ route('settings.profile') }}">Profile</a></li>
                    @endif
                    <li><a href="{{ route('logout') }}">Logout</a></li>
                </ul>
            </div>
        </li>
    </ul>
    <div class="hider" @click="asideToggle" :class="{isRight: !isOpen, isLeft: isOpen}">
        <i class="material-icons is_right mainColorBackground">chevron_right</i>
        <i class="material-icons is_left mainColorBackground">chevron_left</i>
    </div>
</aside>
