<div class="memberDashboard__tab" id="memberDashboard__wellness" v-if="tab == 'wellness'">
    <div class="tiles">
        <div class="tile tile--1" data-type="points">
            <div class="title">Points</div>
            <div class="tile__content tile__content--number">0</div>
        </div>
         <!-- <div class="tile tile--1"  data-type="activitya">
            <div class="title">Calories</div>
            <div class="tile__content tile__content--graph">
                <canvas></canvas>
            </div>
        </div> -->
        <div class="tile tile--1"  data-type="activity">
            <div class="title">Calories</div>
            <div class="tile__content tile__content--graph">
                <canvas></canvas>
            </div>
        </div>
        <div class="tile tile--1" data-type="steps">
            <div class="title">Steps</div>
            <div class="tile__content tile__content--graph">
                <canvas></canvas>
            </div>
        </div>
        <div class="tile tile--1" data-type="bmi">
            <div class="title">Distance</div>
            <div class="tile__content tile__content--graph">
                <canvas></canvas>
            </div>
        </div>
    </div>
    <div class="tiles">
        <div class="tile tile--1" data-type="weight">
            <div class="title">Weight</div>
            <div class="tile__content tile__content--graph">
                <canvas></canvas>
            </div>
        </div>
        <div class="tile tile--1" data-type="water">
            <div class="title">Duration</div>
            <div class="tile__content tile__content--graph">
                <canvas></canvas>
            </div>
        </div>
        <div class="tile tile--1" data-type="watts">
            <div class="title">Watts</div>
            <div class="tile__content tile__content--graph">
                <canvas></canvas>
            </div>
        </div>
        <div class="tile tile--1" data-type="calories">
            <div class="title">Calories</div>
            <!-- <p style="font-size:2">21 days</p> -->
            <div class="tile__content tile__content--number">0</div>
        </div>
    </div>
</div>
