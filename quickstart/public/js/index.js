'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isSupported } from './twilio-video.js';
import { isMobile } from './browser.js';
import { joinRoom } from './joinroom.js';
import { micLevel } from './miclevel.js';
import { selectMedia } from './selectmedia.js';
import { selectRoom } from './selectroom.js';
import { showError } from './showerror.js';
const $join = $('#join-room');
const $modals = $('#modals');
const $selectMicModal = $('#select-mic', $modals);
const $selectCameraModal = $('#select-camera', $modals);
const $showErrorModal = $('#show-error', $modals);
const $joinRoomModal = $('#join-room', $modals);
// ConnectOptions settings for a video web application.
const connectOptions = {
    // Available only in Small Group or Group Rooms only. Please set "Room Type"
    // to "Group" or "Small Group" in your Twilio Console:
    // https://www.twilio.com/console/video/configure
    bandwidthProfile: {
        video: {
            dominantSpeakerPriority: 'high',
            mode: 'collaboration',
            renderDimensions: {
                high: { height: 720, width: 1280 },
                standard: { height: 90, width: 160 }
            }
        }
    },
    // Available only in Small Group or Group Rooms only. Please set "Room Type"
    // to "Group" or "Small Group" in your Twilio Console:
    // https://www.twilio.com/console/video/configure
    dominantSpeaker: true,
    // Comment this line if you are playing music.
    maxAudioBitrate: 16000,
    // VP8 simulcast enables the media server in a Small Group or Group Room
    // to adapt your encoded video quality for each RemoteParticipant based on
    // their individual bandwidth constraints. This has no utility if you are
    // using Peer-to-Peer Rooms, so you can comment this line.
    preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],
    // Capture 720p video @ 24 fps.
    video: { height: 720, frameRate: 24, width: 1280 }
};
// For mobile browsers, limit the maximum incoming video bitrate to 2.5 Mbps.
if (isMobile) {
    connectOptions
        .bandwidthProfile
        .video
        .maxSubscriptionBitrate = 2500000;
}
// On mobile browsers, there is the possibility of not getting any media even
// after the user has given permission, most likely due to some other app reserving
// the media device. So, we make sure users always test their media devices before
// joining the Room. For more best practices, please refer to the following guide:
// https://www.twilio.com/docs/video/build-js-video-application-recommendations-and-best-practices
const deviceIds = {
    audio: isMobile ? null : localStorage.getItem('audioDeviceId'),
    video: isMobile ? null : localStorage.getItem('videoDeviceId')
};
/**
 * Select your Room name, your screen name and join.
 * @param [error=null] - Error from the previous Room session, if any
 */
function selectAndJoinRoom(error = null) {
    return __awaiter(this, void 0, void 0, function* () {
        const formData = yield selectRoom($joinRoomModal, error);
        if (!formData) {
            // User wants to change the camera and microphone.
            // So, show them the microphone selection modal.
            deviceIds.audio = null;
            deviceIds.video = null;
            return selectMicrophone();
        }
        const { identity, roomName } = formData;
        try {
            // Fetch an AccessToken to join the Room.
            const response = yield fetch(`/token?identity=${identity}`);
            // Extract the AccessToken from the Response.
            const token = yield response.text();
            // Add the specified audio device ID to ConnectOptions.
            connectOptions.audio = { deviceId: { exact: deviceIds.audio } };
            // Add the specified Room name to ConnectOptions.
            connectOptions.name = roomName;
            // Add the specified video device ID to ConnectOptions.
            connectOptions.video.deviceId = { exact: deviceIds.video };
            // Join the Room.
            yield joinRoom(token, connectOptions);
            // After the video session, display the room selection modal.
            return selectAndJoinRoom();
        }
        catch (error) {
            return selectAndJoinRoom(error);
        }
    });
}
/**
 * Select your camera.
 */
function selectCamera() {
    return __awaiter(this, void 0, void 0, function* () {
        if (deviceIds.video === null) {
            try {
                deviceIds.video = yield selectMedia('video', $selectCameraModal, videoTrack => {
                    const $video = $('video', $selectCameraModal);
                    videoTrack.attach($video.get(0));
                });
            }
            catch (error) {
                showError($showErrorModal, error);
                return;
            }
        }
        return selectAndJoinRoom();
    });
}
/**
 * Select your microphone.
 */
function selectMicrophone() {
    return __awaiter(this, void 0, void 0, function* () {
        if (deviceIds.audio === null) {
            try {
                deviceIds.audio = yield selectMedia('audio', $selectMicModal, audioTrack => {
                    const $levelIndicator = $('svg rect', $selectMicModal);
                    const maxLevel = Number($levelIndicator.attr('height'));
                    micLevel(audioTrack, maxLevel, level => $levelIndicator.attr('y', maxLevel - level));
                });
            }
            catch (error) {
                showError($showErrorModal, error);
                return;
            }
        }
        return selectCamera();
    });
}
// If the current browser is not supported by twilio-video.js, show an error
// message. Otherwise, start the application.
if (!isSupported) {
    showError($showErrorModal, new Error('This browser is not supported.'));
}
$join.click(() => {
    alert("Hello World");
});
;
//# sourceMappingURL=index.js.map