<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUsedCouponsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('used_coupons')) {
            Schema::create('used_coupons', function (Blueprint $table) {
                $table->id();

                $table->integer('company_id')->index();
                $table->integer('location_id')->index();
                $table->string('coupon');
                $table->integer('used_count')->default(0);

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
        Schema::dropIfExists('used_coupons');
    }
}
