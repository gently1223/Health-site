<?php

use App\Http\Controllers\Auth\WelcomeController;
use App\Http\Controllers\Integration\OuraController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

include __DIR__.'/connect.php';
include __DIR__.'/services.php';

Auth::routes();
Route::group(['prefix' => 'auth', 'namespace' => 'Auth'], function () {
    Route::get('/', 'OauthController@index');
    Route::get('/register', 'OauthController@register');
});

Route::get('/', 'HomeController@index')->name('index');

Route::post('/user/exists', 'HomeController@checkUserExists');
Route::post('/company/search', 'HomeController@findCompany');
Route::post('/promocode/verify', 'HomeController@verifyPromocode');
Route::post('/register/validate', 'Auth\RegisterController@validateRequest');
Route::post('/register/get_card_token', 'Auth\RegisterController@getCardToken');

Route::group(['prefix' => 'welcome', 'namespace' => 'Auth'], function () {
    Route::get('/',             'WelcomeController@showRegistrationForm')->name('welcome');
    Route::post('/verify',      'WelcomeController@verifyCode');
    Route::post('/validate',    'WelcomeController@validateRequest');
    Route::post('/register',    'WelcomeController@register')->name('welcome.register');
});

Route::get('/waitlist', 'WaitlistController@index')->name('waitlist.index');
Route::post('/waitlist', 'WaitlistController@save')->name('waitlist.save');
Route::get('/waitlist/success', 'WaitlistController@success')->name('waitlist.success');

Route::group(['prefix' => 'integration', 'namespace' => 'Integration'], function () {
    Route::group(['prefix' => 'ouraring'], function () {
        Route::get('/auth', [OuraController::class, 'auth']);
        Route::get('/callback', [OuraController::class, 'callback']);
        Route::get('/profile', [OuraController::class, 'profile']);
        Route::get('/import', [OuraController::class, 'importData']);
    });
});

Route::middleware(['auth'])->group(function() {
    Route::get('/logout', 'HomeController@logout')->name('logout');
    Route::post('/amenities', 'AmenitiesController@save');

    Route::middleware(['role:club_member'])->group(function() {
        Route::get('/dasbhoard', 'MemberDashboardController@index')->name('member.dasbhoard');
    });

    Route::middleware(['role:club_admin|club_employee|club_enterprise|root'])->group(function() {
        Route::post('/search', 'HomeController@findMembers');
    });

    Route::middleware(['role:club_admin|insurance|root'])->group(function() {
        Route::get('/checkin/{ledgerId}/members', 'HomeController@checkinMembers')->name('member.checkin');
        Route::post('/checkin/{ledgerId}/members/search', 'HomeController@checkinMemberSearch')->name('member.checkin.search');
    });

    Route::middleware(['role:root'])->group(function() {
        Route::group(['prefix' => 'root/products', 'namespace' => 'Stripe'], function(){
            Route::post('/fetch', 'ProductsController@fetch');
            Route::get('/', 'ProductsController@index')->name('root.products');
            Route::get('/archive', 'ProductsController@archive')->name('root.products.archive');
            Route::get('/{productId}/prices', 'ProductsController@prices')->name('root.products.prices');
            Route::get('/{productId}/prices/archive', 'ProductsController@pricesArchive')->name('root.products.prices.archive');
            Route::post('/{productId}/remove', 'ProductsController@remove')->name('root.products.remove');
            Route::post('/{productId}/restore', 'ProductsController@restore')->name('root.products.restore');
            Route::post('/{productId}/set-as-register', 'ProductsController@setAsRegisterOption')->name('root.products.setAsRegisterOption');
            Route::post('/{productId}/remove-from-register', 'ProductsController@removeFromRegisterOptions')->name('root.products.removeFromRegisterOptions');
            Route::post('/{productId}/prices/{priceId}/remove', 'ProductsController@removePrice')->name('root.products.prices.remove');
            Route::post('/{productId}/prices/{priceId}/restore', 'ProductsController@restorePrice')->name('root.products.prices.restore');
        });

        Route::group(['prefix' => 'root/locations', 'namespace' => 'Root'], function(){
            Route::get('/', 'LocationsController@index')->name('root.locations');
            Route::post('/search', 'LocationsController@search');
        });

        Route::group(['prefix' => 'root/shipments', 'namespace' => 'Root'], function(){
            Route::get('/', 'ShipmentsController@index')->name('root.shipments');
            Route::post('/search', 'ShipmentsController@search');
        });

        Route::group(['prefix' => 'root/notifications', 'namespace' => 'Root'], function(){
            Route::get('/', 'GlobalNotificationsController@index')->name('root.notifications');
            Route::get('/create', 'GlobalNotificationsController@create')->name('root.notifications.create');
            Route::get('/remove/{id}', 'GlobalNotificationsController@remove')->name('root.notifications.remove');
            Route::get('/{id}', 'GlobalNotificationsController@edit')->name('root.notifications.edit');
            Route::post('/save', 'GlobalNotificationsController@save')->name('root.notifications.save');
            Route::post('/delete/{id}', 'GlobalNotificationsController@delete')->name('root.notifications.delete');
        });

        Route::group(['prefix' => 'root/amenities', 'namespace' => 'Root'], function(){
            Route::get('/', 'RootAmenitiesController@index')->name('root.amenities');
            Route::get('/{id}', 'RootAmenitiesController@edit')->name('root.amenities.edit');
            Route::post('/{id}', 'RootAmenitiesController@save');
        });

        Route::group(['prefix' => 'root/companies', 'namespace' => 'Root'], function(){
            Route::get('/', 'CompanyController@index')->name('root.company');
            Route::get('/create', 'CompanyController@create')->name('root.company.create');
            Route::post('/search', 'CompanyController@search')->name('root.company.search');
            Route::get('/edit/{companyId}', 'CompanyController@edit')->name('root.company.edit');
            Route::post('/save', 'CompanyController@save')->name('root.company.save');
        });

        Route::group(['prefix' => 'root/o-clients', 'namespace' => 'Root'], function(){
            Route::get('/', 'OAuthClientController@index')->name('root.oclients');
            Route::get('/create', 'OAuthClientController@create')->name('root.oclients.create');
            Route::post('/search', 'OAuthClientController@search')->name('root.oclients.search');
            Route::get('/edit/{clientId}', 'OAuthClientController@edit')->name('root.oclients.edit');
            Route::post('/save', 'OAuthClientController@save')->name('root.oclients.save');
        });

        Route::group(['prefix' => 'root/activity', 'namespace' => 'Root'], function(){
            Route::get('/', 'ActivityController@index')->name('root.activity');
            Route::get('/create', 'ActivityController@create')->name('root.activity.create');
            Route::post('/search', 'ActivityController@search')->name('root.activity.search');
            Route::get('/edit/{activityId}', 'ActivityController@edit')->name('root.activity.edit');
            Route::post('/save', 'ActivityController@save')->name('root.activity.save');
        });

        Route::group(['prefix' => 'root/apis', 'namespace' => 'Root'], function(){
            Route::get('/', 'ApiController@index')->name('root.apis');
            Route::get('/create', 'ApiController@create')->name('root.apis.create');
            Route::post('/search', 'ApiController@search')->name('root.apis.search');
            Route::get('/edit/{apiId}', 'ApiController@edit')->name('root.apis.edit');
            Route::post('/save', 'ApiController@save')->name('root.apis.save');
        });

        Route::group(['prefix' => 'root/challenge', 'namespace' => 'Root'], function(){
            Route::get('/', 'ChallengeController@index')->name('root.challenges');
            Route::get('/create', 'ChallengeController@create')->name('root.challenges.create');
            Route::post('/search', 'ChallengeController@search')->name('root.challenges.search');
            Route::get('/edit/{challengeId}', 'ChallengeController@edit')->name('root.challenges.edit');
            Route::post('/save', 'ChallengeController@save')->name('root.challenges.save');
        });

        Route::group(['prefix' => 'root/programs', 'namespace' => 'Root'], function(){
            Route::get('/', 'ProgramController@index')->name('root.programs');
            Route::get('/create', 'ProgramController@create')->name('root.programs.create');
            Route::post('/search', 'ProgramController@search')->name('root.programs.search');
            Route::get('/edit/{programId}', 'ProgramController@edit')->name('root.programs.edit');
            Route::post('/save', 'ProgramController@save')->name('root.programs.save');
        });

        Route::group(['prefix' => 'root/roles', 'namespace' => 'Root'], function(){
            Route::get('/', 'RoleController@index')->name('root.roles');
            Route::get('/create', 'RoleController@create')->name('root.roles.create');
            Route::post('/search', 'RoleController@search')->name('root.roles.search');
            Route::get('/edit/{roleId}', 'RoleController@edit')->name('root.roles.edit');
            Route::post('/save', 'RoleController@save')->name('root.roles.save');
        });

        Route::group(['prefix' => 'root/sectors', 'namespace' => 'Root'], function(){
            Route::get('/', 'CompanyProgramSectorController@index')->name('root.sectors');
            Route::get('/create', 'CompanyProgramSectorController@create')->name('root.sectors.create');
            Route::post('/search', 'CompanyProgramSectorController@search')->name('root.sectors.search');
            Route::get('/edit/{sectorId}', 'CompanyProgramSectorController@edit')->name('root.sectors.edit');
            Route::post('/save', 'CompanyProgramSectorController@save')->name('root.sectors.save');
        });

        Route::group(['prefix' => 'root/tiers', 'namespace' => 'Root'], function(){
            Route::get('/', 'CompanyProgramTierController@index')->name('root.tiers');
            Route::get('/create', 'CompanyProgramTierController@create')->name('root.tiers.create');
            Route::post('/search', 'CompanyProgramTierController@search')->name('root.tiers.search');
            Route::get('/edit/{tierId}', 'CompanyProgramTierController@edit')->name('root.tiers.edit');
            Route::post('/save', 'CompanyProgramTierController@save')->name('root.tiers.save');
        });

        Route::group(['prefix' => 'root/report', 'namespace' => 'Root'], function(){
            Route::get('/activity', 'ReportsController@activityReport')->name('root.report.activity');
            Route::post('/activity', 'ReportsController@activityReport');
            Route::get('/download/activity', 'ReportsController@downloadActivityReport')->name('root.report.download.activity');
            Route::get('/download/humana', 'ReportsController@downloadHumanaReport')->name('root.report.humana');
        });
    });

        Route::middleware(['role:club_enterprise|root|insurance|corp_wellness'])->group(function() {
            Route::group(['prefix' => 'corporate', 'namespace' => 'Corporate'], function(){
                    Route::get('insight', 'InsightController@index')->name('corporate.insight');
                    Route::get('partners', 'PartnerController@index')->name('corporate.partners');
                    Route::get('communication', 'CommunicationController@index')->name('corporate.communication');
                    Route::get('challenge', 'ChallengeController@index')->name('corporate.challenge');
                    Route::get('reward', 'RewardController@index')->name('corporate.reward');
            });
         });

    Route::middleware(['role:club_enterprise|root|insurance|corp_wellness'])->group(function() {
        Route::group(['prefix' => 'club/programs', 'namespace' => 'Club'], function(){
            Route::get('/', 'ClubProgramsController@index')->name('club.programs');
            Route::get('/add', 'ClubProgramsController@add')->name('club.programs.add');
            Route::post('/connect', 'ClubProgramsController@connect')->name('club.programs.connect');
            Route::get('/{programId}/disable', 'ClubProgramsController@disable')->name('club.programs.disable');
            Route::get('/{programId}/edit', 'ClubProgramsController@edit')->name('club.programs.edit');
            Route::post('/{programId}/save', 'ClubProgramsController@save')->name('club.programs.save');
        });

        Route::group(['prefix' => 'corporate/members', 'namespace' => 'Corporate'], function(){
            Route::get('/', 'MembersController@index')->name('corporate.members');
            Route::post('search', 'MembersController@search');
            Route::get('{memberId}/view', 'MembersController@view')->name('corporate.members.view');
            Route::get('{memberId}/edit', 'MembersController@edit')->name('corporate.members.edit');
            Route::post('save', 'MembersController@save')->name('corporate.members.save');
            Route::post('{memberId}/checkin', 'MembersController@checkin')->name('corporate.members.checkin');
            Route::post('verifyCode', 'MembersController@verifyCode')->name('corporate.members.checkin');

            Route::middleware(['role:club_admin|club_enterprise|root|insurance'])->group(function() {
                Route::get('/create', 'MembersController@create')->name('corporate.members.create');
            });
        });

        Route::group(['prefix' => 'corporate/programs', 'namespace' => 'Corporate'], function(){
            Route::get('/', 'CorporateProgramsController@index')->name('corporate.programs');
            Route::get('/add', 'CorporateProgramsController@add')->name('corporate.programs.add');
            Route::post('/connect', 'CorporateProgramsController@connect')->name('corporate.programs.connect');
            Route::get('/{programId}/disable', 'CorporateProgramsController@disable')->name('corporate.programs.disable');
            Route::get('/{programId}/edit', 'CorporateProgramsController@edit')->name('corporate.programs.edit');
            Route::post('/{programId}/save', 'CorporateProgramsController@save')->name('corporate.programs.save');
        });

        Route::group(['prefix' => 'enterprise/amenities', 'namespace' => 'Enterprise'], function(){
           Route::get('/', 'AmenitiesEnterpriseController@index')->name('enterprise.amenities');
           Route::post('/search', 'AmenitiesEnterpriseController@search');
           Route::get('/{id}', 'AmenitiesEnterpriseController@view')->name('enterprise.amenities.view');
           Route::get('/download/all', 'AmenitiesEnterpriseController@downloadAll')->name('enterprise.amenities.download.all');
           Route::get('/download/{id}', 'AmenitiesEnterpriseController@download')->name('enterprise.amenities.download');
        });

        Route::group(['prefix' => 'enterprise/locations', 'namespace' => 'Enterprise'], function(){
            Route::get('/', 'LocationsController@index')->name('enterprise.locations');
            Route::get('/map', 'LocationsController@map')->name('enterprise.locations.map');
            Route::post('/search', 'LocationsController@search');
            Route::get('/switch/{locationId}', 'LocationsController@switch')->name('enterprise.locations.switch');

            Route::get('/list', 'LocationsController@list')->name('enterprise.locations.list');
            Route::get('/{locationId}/edit', 'LocationsController@edit')->name('enterprise.locations.edit');
            Route::post('/save', 'LocationsController@save')->name('enterprise.locations.save');

            Route::get('/report/download/onboard', 'ReportsController@downloadOnboardReport')->name('enterprise.report.download.onboard');
        });

        Route::group(['prefix' => 'enterprise/provisioning', 'namespace' => 'Enterprise'], function(){
            Route::get('/', 'ProvisioningController@index')->name('enterprise.provisioning');
            Route::post('/search', 'ProvisioningController@search');
        });

        Route::group(['prefix' => 'enterprise/employees', 'namespace' => 'Enterprise'], function(){
            Route::get('/', 'EmployeesController@index')->name('enterprise.employees');
            Route::post('/search', 'EmployeesController@search');
            Route::get('/create', 'EmployeesController@create')->name('enterprise.employees.create');
            Route::get('/{userId}/edit', 'EmployeesController@edit')->name('enterprise.employees.edit');
            Route::post('/save', 'EmployeesController@save')->name('enterprise.employees.save');
        });

        Route::group(['prefix' => 'enterprise/members', 'namespace' => 'Enterprise'], function(){
            Route::get('/', 'MembersController@index')->name('enterprise.members');
            Route::post('search', 'MembersController@search');
            Route::get('{memberId}/view', 'MembersController@view')->name('enterprise.members.view');
            Route::get('{memberId}/edit', 'MembersController@edit')->name('enterprise.members.edit');
            Route::post('save', 'MembersController@save')->name('enterprise.members.save');
            Route::post('{memberId}/checkin', 'MembersController@checkin')->name('enterprise.members.checkin');
        });

        Route::group(['prefix' => 'enterprise/programs', 'namespace' => 'Enterprise'], function(){
            Route::get('/', 'ProgramsController@index')->name('enterprise.programs');
            Route::get('/add', 'ProgramsController@add')->name('enterprise.programs.add');
            Route::post('/connect', 'ProgramsController@connect')->name('enterprise.programs.connect');
            Route::get('/{programId}/disable', 'ProgramsController@disable')->name('enterprise.programs.disable');
            Route::get('/{programId}/edit', 'ProgramsController@edit')->name('enterprise.programs.edit');
            Route::post('/{programId}/save', 'ProgramsController@save')->name('enterprise.programs.save');
        });

        Route::get('/enterprise/docs', 'Enterprise\DocsController@index')->name('enterprise.docs');
    });

    Route::group(['prefix' => 'enterprise', 'namespace' => 'Billing', 'middleware' => 'role:insurance|club_enterprise|root|vendor'], function() {
        Route::get('/account', 'EnterpriseAccountController@index')->name('enterprise.billing.account');
        Route::post('/account', 'EnterpriseAccountController@index');
        Route::get('/account/download/transactions', 'EnterpriseAccountController@downloadTransactions');
        Route::get('/account/download/insurance', 'EnterpriseAccountController@downloadInsurance');
    });

    Route::middleware(['role:club_admin|club_employee|club_enterprise|root|insurance|vendor'])->group(function() {
        Route::group(['prefix' => 'club', 'namespace' => 'Club'], function() {

            Route::get('/amenities', 'AmenitiesClubController@index')->name('club.amenities');
            Route::post('/amenities/{id}', 'AmenitiesClubController@save')->name('club.amenities.save');

            Route::get('/locations', 'LocationsController@index')->name('club.locations');
            Route::get('/locations/switch/{locationId}', 'LocationsController@switch')->name('club.locations.switch');
            Route::post('/locations/search', 'LocationsController@search');

            Route::middleware(['role:club_admin|club_enterprise|root|insurance'])->group(function() {
                Route::get('/locations/create', 'LocationsController@create')->name('club.locations.create');
                Route::post('/locations/slave', 'LocationsController@slave')->name('club.locations.slave');
                Route::post('/locations/slave/validate', 'LocationsController@validateSlave');
                Route::get('/locations/{locationId}/edit', 'LocationsController@edit')->name('club.locations.edit');
                Route::post('/locations/save', 'LocationsController@save')->name('club.locations.save');
            });
        });

        Route::group(['prefix' => 'settings', 'namespace' => 'Settings'], function() {
            Route::get('/profile', 'ProfileController@index')->name('settings.profile');
            Route::post('/profile', 'ProfileController@save');

            Route::get('/company', 'CompanyController@index')->name('settings.company');
            Route::post('/company', 'CompanyController@save');

            Route::post('/profile/image/upload', 'ProfileController@uploadImage');
        });

        // notSlaveLocation
        Route::group(['prefix' => 'billing', 'namespace' => 'Billing', 'middleware' => ['role:club_admin|club_enterprise|root|insurance|vendor']], function() {
            // Route::get('/', 'SubscriptionController@index')->name('billing.subscription');
            Route::get('/invoices', 'SubscriptionController@invoices')->name('billing.invoices');
            Route::get('/card', 'SubscriptionController@card')->name('billing.card');
            Route::post('/card', 'SubscriptionController@changeCard');
            Route::post('/purchase/{productId}/{priceId}', 'SubscriptionController@pay')->name('billing.pay');

            Route::get('/account', 'AccountController@index')->name('billing.account');
            Route::post('/account', 'AccountController@index');
            Route::get('/account/redirect', 'AccountController@redirect')->name('billing.account.redirect');
            Route::post('/account/setDefaultPayoutMethod', 'AccountController@setDefaultPayoutMethod');
            Route::get('/account/download/transactions', 'AccountController@downloadTransactions');
            Route::get('/account/download/insurance', 'AccountController@downloadInsurance');

            Route::group(['middleware' => 'role:root'], function() {
                Route::get('/account/payout', 'AccountController@testPayout');
            });
        });

        /* Only paid access */
        Route::middleware(['access.paid'])->group(function() {
            Route::group(['prefix' => 'club/members', 'namespace' => 'Club'], function(){
                Route::get('/', 'MembersController@index')->name('club.members');
                Route::post('search', 'MembersController@search');
                Route::get('{memberId}/view', 'MembersController@view')->name('club.members.view');
                Route::get('{memberId}/edit', 'MembersController@edit')->name('club.members.edit');
                Route::post('save', 'MembersController@save')->name('club.members.save');
                Route::post('{memberId}/checkin', 'MembersController@checkin')->name('club.members.checkin');
                Route::post('verifyCode', 'MembersController@verifyCode')->name('club.members.checkin');

                Route::middleware(['role:club_admin|club_enterprise|root|insurance'])->group(function() {
                    Route::get('/create', 'MembersController@create')->name('club.members.create');
                });
            });


            Route::middleware(['role:club_admin|club_enterprise|root|insurance'])->group(function() {
                Route::get('/club/docs', 'Club\DocsController@index')->name('club.docs');
                Route::get('/club/checkins', 'Club\CheckinsController@index')->name('club.checkins');
                Route::post('/club/checkins/search', 'Club\CheckinsController@search');

                Route::get('/club/employees', 'Club\EmployeesController@index')->name('club.employees');
                Route::post('/club/employees/search', 'Club\EmployeesController@search');
                Route::get('/club/employees/create', 'Club\EmployeesController@create')->name('club.employees.create');
                Route::get('/club/employees/{userId}/edit', 'Club\EmployeesController@edit')->name('club.employees.edit');
                Route::post('/club/employees/save', 'Club\EmployeesController@save')->name('club.employees.save');
            });
        });
    });
});

Route::get('/tests/bugsnag', 'TestController@bugsnag');
Route::get('/tests/playground', 'TestController@playground');
Route::get('/tests/slack/provisioning', 'TestController@testSlackProvisioning');
