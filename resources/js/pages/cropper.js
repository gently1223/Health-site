import { Cropper, CircleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css';

new Vue({
    el: '#hasCropper',
    components: {
        Cropper, CircleStencil
    },
    data: {
        cropModal: null,
        cropperVisible: false,
        cropperCanvas: null,
        cropperError: null,
        avatar: window.Laravel.avatar,
        changeAvatar: null,
        img: null,
        options: {
            aspectRatio: 1
        },
    },
    methods: {
        openAvatarModal() {
            let v = this

            v.cropModal.open()
        },
        showCropper(e) {
            let v = this

            v.cropperVisible = true

            const file = e.target.files[0]
            v.img = URL.createObjectURL(file)
        },
        cropImage({coordinates, canvas}) {
            let v = this

            v.cropperCanvas = canvas
        },
        saveCropper() {
            let v = this

            if (v.cropperCanvas) {
                v.avatar = v.cropperCanvas.toDataURL()

                const form = new FormData();

                v.cropperCanvas.toBlob(blob => {
                    form.append('image', blob)

                    axios.post('/settings/profile/image/upload', form)
                         .then(response => {
                             if (response.data.success) {
                                 v.changeAvatar = response.data.image

                                 v.cropperVisible = false
                                 v.cropModal.close()
                             } else {
                                 v.cropperError   = 'Only image files supported.'
                                 v.cropperVisible = false
                             }
                         })
                         .catch(error => {
                             console.error(error)
                         })

				}, "image/png")
            }
        },
        cancelCropper() {
            let v = this
            v.cropperVisible = false
            v.cropModal.close()
        }
    },
    mounted() {
        let v = this

        v.cropModal = M.Modal.init(v.$refs.cropperModal)
    }
})
