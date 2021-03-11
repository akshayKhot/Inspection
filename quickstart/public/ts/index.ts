'use strict';

import { isSupported } from './video.js';
import { Browser } from './browser.js';
import { RoomJoiner } from './joinroom.js';
import { micLevel } from './miclevel.js';
import { MediaSelector } from './selectmedia.js';
import { RoomSelector } from './selectroom.js';
import { showError } from './showerror.js';
import { ConnectOptions, CreateLocalTrackOptions, Room } from 'twilio-video';

const $join = $('#join-room');
const $modals = $('#modals');
const $selectMicModal = $('#select-mic', $modals);
const $selectCameraModal = $('#select-camera', $modals);
const $showErrorModal = $('#show-error', $modals);
const $joinRoomModal = $('#join-room', $modals);

export class Inspection {

  browser: Browser;
  mediaSelector: MediaSelector;
  roomSelector: RoomSelector;
  roomJoiner: RoomJoiner;

  connectOptions: ConnectOptions;
  deviceIds: { video: unknown; audio: unknown };

  constructor() {
    this.browser = new Browser();
    this.mediaSelector = new MediaSelector();
    this.roomSelector = new RoomSelector();
    this.roomJoiner = new RoomJoiner();

    // ConnectOptions settings for a video web application.
    this.connectOptions = {
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
    if (Browser.isMobile()) {
      this.connectOptions
        .bandwidthProfile
        .video
        .maxSubscriptionBitrate = 2500000;
    }

    // On mobile browsers, there is the possibility of not getting any media even
    // after the user has given permission, most likely due to some other app reserving
    // the media device. So, we make sure users always test their media devices before
    // joining the Room. For more best practices, please refer to the following guide:
    // https://www.twilio.com/docs/video/build-js-video-application-recommendations-and-best-practices
    this.deviceIds = {
      audio: Browser.isMobile() ? null : localStorage.getItem('audioDeviceId'),
      video: Browser.isMobile() ? null : localStorage.getItem('videoDeviceId')
    };
  }

  /**
 * Select your Room name, your screen name and join.
 * @param [error=null] - Error from the previous Room session, if any
 */
  async selectAndJoinRoom(error = null) {
    const formData = await this.roomSelector.selectRoom($joinRoomModal, error);
    if (!formData) {
      // User wants to change the camera and microphone.
      // So, show them the microphone selection modal.
      this.deviceIds.audio = null;
      this.deviceIds.video = null;
      return this.selectMicrophone();
    }
    const { identity, roomName } = formData as any;

    try {
      // Fetch an AccessToken to join the Room.
      const response = await fetch(`/token?identity=${identity}`);

      // Extract the AccessToken from the Response.
      const token = await response.text();

      // Add the specified audio device ID to ConnectOptions.
      this.connectOptions.audio = { deviceId: { exact: this.deviceIds.audio } } as CreateLocalTrackOptions;

      // Add the specified Room name to ConnectOptions.
      this.connectOptions.name = roomName;

      // Add the specified video device ID to ConnectOptions.
      (this.connectOptions.video as any).deviceId = { exact: this.deviceIds.video } as ConstrainDOMString;

      // Join the Room.
      await this.roomJoiner.joinRoom(token, this.connectOptions);

      // After the video session, display the room selection modal.
      return this.selectAndJoinRoom();
    } catch (error) {
      return this.selectAndJoinRoom(error);
    }
  }

  /**
   * Select your camera.
   */
  async selectCamera() {
    if (this.deviceIds.video === null) {
      try {
        this.deviceIds.video = await this.mediaSelector.selectMedia('video', $selectCameraModal, videoTrack => {
          const $video = $('video', $selectCameraModal);
          videoTrack.attach($video.get(0))
        });
      } catch (error) {
        showError($showErrorModal, error);
        return;
      }
    }
    return this.selectAndJoinRoom();
  }

  /**
   * Select your microphone.
   */
  async selectMicrophone() {
    if (this.deviceIds.audio === null) {
      try {
        this.deviceIds.audio = await this.mediaSelector.selectMedia('audio', $selectMicModal, audioTrack => {
          const $levelIndicator = $('svg rect', $selectMicModal);
          const maxLevel = Number($levelIndicator.attr('height'));
          micLevel(audioTrack, maxLevel, level => $levelIndicator.attr('y', maxLevel - level));
        });
      } catch (error) {
        showError($showErrorModal, error);
        return;
      }
    }
    return this.selectCamera();
  }
}


// If the current browser is not supported by twilio-video.js, show an error
// message. Otherwise, start the application.
if (!isSupported) {
  showError($showErrorModal, new Error('This browser is not supported.'));
}

$join.on('click', () => {
  const inspection = new Inspection();
  inspection.selectMicrophone();
});