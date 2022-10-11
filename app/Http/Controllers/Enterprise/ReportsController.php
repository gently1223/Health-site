<?php

namespace App\Http\Controllers\Enterprise;

use App\Models\Api;
use DB;
use Carbon\Carbon;
use App\Models\Program;
use App\Models\Users\User;
use App\Models\Users\Roles;
use App\Models\Users\MemberProgram;
use App\Models\Company\Company;
use App\Models\Company\CheckinHistory;
use App\Models\Company\CheckinLedger;
use App\Models\Company\CheckinLedgerMember;
use App\Models\Statistics\Activity;
use App\Services\Stripe\Payout;

class ReportsController extends \App\Http\Controllers\Controller
{
    /**
     * Download Onboard report as .csv
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function downloadOnboardReport()
    {

        $report = DB::select("select *  FROM _report_amenities_detail order by ch_id,parent_id");



        $csv = fopen('php://memory', 'w');

        $header = [
            'Brand',
            'CH ID',
            'Club ID',
            'Parent ID',
            'Location',
            'Address',
            'City',
            'State',
            'Postal',
            'Phone',
            'Enrolled',
            'Program Name',
            'Role',
            'First Name',
            'Last Name',
            'Email',
            'Credit Card Required',
            'Bank Account Required',
            'Amenities Waived',
            'Completed Amenities',
            'Credit Card on File',
            'Banking Account on File',
            // 'Amenities Created',
            // 'Amenities Updated'
        ];
        fputcsv($csv, $header);

        foreach ($report as $item) {
            fputcsv($csv, [
                $item->brand,
                $item->ch_id,
                $item->club_id,
                $item->parent_id,
                $item->brand_location,
                $item->brand_address,
                $item->brand_city,
                $item->brand_state,
                $item->brand_postal,
                $item->brand_phone,
                $item->enrolled,
                $item->program_name,

                $item->role_name,
                $item->fname,
                $item->lname,
                $item->email,
                $item->credit_card_required ? 'YES' : 'NO',
                $item->payment_required ? 'YES' : 'NO',
                $item->amenities_waived ? 'YES' : 'NO',
                $item->completed_amenities ? 'YES' : 'NO',
                $item->card_on_file ? 'YES' : 'NO',
                $item->bank_on_file ? 'YES' : 'NO',
                // $item->created,
                // $item->updated,
            ]);
        }

        header('Content-Type: application/csv');
        header('Content-Disposition: attachment; filename="Onboard-Report-'.date('Y-m-d').'.csv";');

        fseek($csv, 0);
        fpassthru($csv);
        fclose($csv);

        die();
    }
}
