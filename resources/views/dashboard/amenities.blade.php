<div id="amenities">
    @if (isset($globalAmenitiesPopup) && $globalAmenitiesPopup)
    <div class="modal" ref="amenitiesModal">
        <div class="modal-content">
            <h5 class="center-align">Please complete the below amenities assessment</h5>
    @else
    <div class="row">
        <div class="col s12">
            <h5>Amenities assessment: Edit</h5>
        </div>
    </div>
    <div class="row">
        <div class="col s12 m8 offset-m2">
    @endif
            <div class="amenities_questions">
                <div class="amenities_question" v-for="item in list">
                    <div class="amenities_title">@{{ item.title }}<span v-if="item.required" class="red-text">*</span></div>
                    <div class="amenities_boolean" v-if="item.type == 'boolean'">
                        <label :class="{'selected': filled[item.id] == true}" @click="setFilled(item.id, true)">YES</label>
                        <label :class="{'selected': filled[item.id] == false}" @click="setFilled(item.id, false)">NO</label>
                    </div>
                    <div class="amenities_input" v-if="item.type == 'input' || item.type == 'double'">
                        <input type="text" v-model="filled[item.id]">
                    </div>
                    <div class="amenities_select" v-if="item.type == 'select'">
                        <select class="select2" v-model="filled[item.id]">
                            <option v-for="response in item.responses" :value="response">@{{ response }}</option>
                        </select>
                    </div>
                    <div class="amenities_checkbox" v-if="item.type == 'checkbox'">
                        <div v-for="(response, index) in item.responses">
                            <input :id="'item-'+item.id+'-'+index" type="checkbox" v-model="filled[item.id][index]" />
                            <label :for="'item-'+item.id+'-'+index">@{{ response }}</label>
                        </div>
                    </div>
                    <div class="amenities_html" v-if="item.type == 'description'" v-html="item.description"></div>
                    {{-- <div class="amenities_additional_textarea" v-if="item.additional_textarea">
                        <textarea placeholder="Additional information"></textarea>
                    </div> --}}
                    <div class="clear"></div>
                    <div class="amenities_description" v-if="item.type != 'description' && item.description">@{{ item.description }}</div>
                    <div class="clear"></div>
                </div>
            </div>
        </div>
    @if (isset($globalAmenitiesPopup) && $globalAmenitiesPopup)
        <div class="modal-footer">
            <div class="left-align" style="padding: 0 0 20px 20px">
                <button type="button" class="waves-effect waves-light blue btn btn-primary mainColorBackground" @click="saveAmenities">Save</button>
            </div>
        </div>
    </div>
    @else
    </div>
    <div class="row">
        <div class="col s12 center-align">
            <button class="waves-effect waves-light btn green mainColorBackground" @click="saveAmenities">Save</button>
        </div>
    </div>
    @endif
</div>

@push('js')
<script>
window.Amenities = {
    required: {{ isset($globalAmenitiesPopup) && $globalAmenitiesPopup ? 1 : 0 }},
    list:     {!! isset($globalAmenities) ? json_encode($globalAmenities) : json_encode([]) !!},
    filled:   {!! isset($glboalLocationAmenities) ? json_encode($glboalLocationAmenities) : json_encode([]) !!}
}
</script>
<script src="{{ asset('js/amenities.js') }}"></script>
@endpush
