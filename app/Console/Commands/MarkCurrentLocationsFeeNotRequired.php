<?php

namespace App\Console\Commands;

use App\Models\Company\Location;
use Illuminate\Console\Command;

class MarkCurrentLocationsFeeNotRequired extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'locations:mark_fee_not_required';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark all current locations as fee not required';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('[Locations:MarkFeeNotRequired] Started');

        Location::whereNull('stripe_customer_id')->update([
            'is_register_fee_not_required' => true,
        ]);

        $this->info('[Locations:MarkFeeNotRequired] Done');
    }
}
