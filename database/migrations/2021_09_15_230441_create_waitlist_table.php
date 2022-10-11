<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateWaitlistTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('waitlist')) {
            Schema::create('waitlist', function (Blueprint $table) {
                $table->id();

                $table->string('legal_business_entity');
                $table->string('name_of_crossfit_affiliate');
                $table->string('address_of_location');
                $table->string('contractor_first_name');
                $table->string('contractor_last_name');
                $table->string('contractor_email');
                $table->string('direct_point_first_name');
                $table->string('direct_point_last_name');
                $table->string('direct_point_email');
                $table->string('retail_membership_rate');

                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('waitlist');
    }
}
