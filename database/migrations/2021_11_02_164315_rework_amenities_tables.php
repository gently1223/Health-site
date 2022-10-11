<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

use App\Models\Amenities;

class ReworkAmenitiesTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('amenities')) {
            Schema::dropIfExists('amenities');
            Schema::dropIfExists('amenities_location');

            Schema::create('amenities', function (Blueprint $table) {
                $table->id();
                $table->string('type');
                $table->string('title');
                $table->text('description');
                $table->json('responses');
                $table->boolean('additional_textarea')->default(false);
                $table->boolean('required')->default(false);
            });

            Amenities::create([
                'type'                => 'input',
                'title'               => 'Facility website',
                'description'         => '',
                'responses'           => json_encode([]),
                'required'            => false,
                'additional_textarea' => false,
            ]);

            Amenities::create([
                'type'                => 'boolean',
                'title'               => 'Does your facility have a pool?',
                'description'         => '',
                'responses'           => json_encode([]),
                'required'            => false,
                'additional_textarea' => false,
            ]);

            Amenities::create([
                'type'                => 'select',
                'title'               => 'Is your facility co-ed or women only?',
                'description'         => '',
                'responses'           => json_encode(['Co-Ed', 'Women Only']),
                'required'            => false,
                'additional_textarea' => false,
            ]);

            Amenities::create([
                'type'                => 'checkbox',
                'title'               => 'Does your facility offer complimentary Group Exercises Classes?',
                'description'         => '',
                'responses'           => json_encode(['Cardio', 'Strength', 'Mind/Body', 'Aquatic', 'Speciality']),
                'required'            => false,
                'additional_textarea' => false,
            ]);

            Amenities::create([
                'type'                => 'boolean',
                'title'               => 'Do you allow caregivers free access to your facility when they accompany an eligible member who requires assistance?',
                'description'         => 'The caregiver only receives free access when they are with that eligible member. They themselves must have their own membership if they wish to utilize your facility independently.',
                'responses'           => json_encode([]),
                'required'            => true,
                'additional_textarea' => true,
            ]);

            Amenities::create([
                'type'                => 'boolean',
                'title'               => 'Is your location interested in offering a complimentary Personalized Fitness Plan session for eligible members once per calendar year?',
                'description'         => '',
                'responses'           => json_encode([]),
                'required'            => true,
                'additional_textarea' => false,
            ]);

            Amenities::create([
                'type'                => 'description',
                'title'               => 'Personalized Fitness Plan requirements:',
                'description'         => '<ul><li>Complimentary session must be with a Personal Trainer for a minimum of 30 minutes once per calendar year</li><li>Discuss and provide feedback on member’s health and wellbeing goals</li><li>Connect and recommend services, programs and classes that will help the member meet their health and wellbeing goals</li><li>Present a customized action plan to include an exercise prescription plan</li><li>Offer an equipment orientation</li></ul>',
                'responses'           => json_encode([]),
                'required'            => false,
                'additional_textarea' => false,
            ]);

            Amenities::create([
                'type'                => 'input',
                'title'               => 'Facility’s monthly standard single membership rate?',
                'description'         => '',
                'responses'           => json_encode([]),
                'required'            => false,
                'additional_textarea' => false,
            ]);

            Amenities::create([
                'type'                => 'input',
                'title'               => 'Facility’s monthly standard single senior membership rate?',
                'description'         => '',
                'responses'           => json_encode([]),
                'required'            => false,
                'additional_textarea' => false,
            ]);

            Amenities::create([
                'type'                => 'boolean',
                'title'               => 'Do you offer a tiered membership?',
                'description'         => '',
                'responses'           => json_encode([]),
                'required'            => false,
                'additional_textarea' => false,
            ]);

            Schema::create('amenities_location', function (Blueprint $table) {
                $table->id();
                $table->integer('amenity_id');
                $table->integer('location_id')->index();
                $table->json('responses');
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
