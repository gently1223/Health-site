<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAmenitiesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('amenities')) {
            Schema::create('amenities', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->integer('required')->default(0);
                $table->integer('text')->default(0);
                $table->integer('boolean')->default(0);
            });

            Schema::create('amenities_location', function (Blueprint $table) {
                $table->id();
                $table->integer('amenity_id');
                $table->text('value');
                $table->integer('location_id')->index();
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
        Schema::dropIfExists('amenities');
        Schema::dropIfExists('amenities_location');
    }
}
