import React from 'react';
import ReactHowler from 'react-howler';
import {
  PiSpeakerSimpleHighLight,
  PiSpeakerSimpleLowLight,
  PiSpeakerSimpleNoneLight,
} from 'react-icons/pi';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

class Music extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      playing: true,
      volume: 0.2, // Set a default volume
      previousVolume: 0.2,
      isMuted: false,
      showSlider: false, // Control slider visibility on mobile
      isTouchDevice: false, // Detect touch devices
    };

    this.handleVolumeChange = this.handleVolumeChange.bind(this);
    this.handleSpeakerClick = this.handleSpeakerClick.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.detectTouchDevice = this.detectTouchDevice.bind(this);

    // Create a ref to the volume control element
    this.volumeRef = React.createRef();
  }

  componentDidMount() {
    this.detectTouchDevice();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.isTouchDevice) {
      if (!prevState.showSlider && this.state.showSlider) {
        // Slider just opened; add event listener
        document.addEventListener('touchstart', this.handleClickOutside);
        document.addEventListener('mousedown', this.handleClickOutside);
      } else if (prevState.showSlider && !this.state.showSlider) {
        // Slider just closed; remove event listener
        document.removeEventListener('touchstart', this.handleClickOutside);
        document.removeEventListener('mousedown', this.handleClickOutside);
      }
    }
  }

  componentWillUnmount() {
    // Clean up event listeners
    document.removeEventListener('touchstart', this.handleClickOutside);
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  detectTouchDevice() {
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.setState({ isTouchDevice });
  }

  handleClickOutside(event) {
    if (
      this.volumeRef.current &&
      !this.volumeRef.current.contains(event.target)
    ) {
      this.setState({ showSlider: false });
    }
  }

  handleVolumeChange(value) {
    const volume = parseFloat(value);
    this.setState({
      volume,
      isMuted: volume === 0,
    });
  }

  handleSpeakerClick() {
    if (this.state.isTouchDevice) {
      // Toggle slider visibility on touch devices
      this.setState((prevState) => ({
        showSlider: !prevState.showSlider,
      }));
    }
  }

  render() {
    const { volume, isMuted, showSlider } = this.state;

    // Determine which speaker icon to display based on the volume level
    let SpeakerIcon;
    if (isMuted || volume === 0) {
      SpeakerIcon = PiSpeakerSimpleNoneLight;
    } else if (volume > 0 && volume <= 0.5) {
      SpeakerIcon = PiSpeakerSimpleLowLight;
    } else {
      SpeakerIcon = PiSpeakerSimpleHighLight;
    }

    return (
      <div className="music">
        <ReactHowler
          src={['city-of-love-135610.mp3']}
          playing={this.state.playing}
          volume={volume}
          ref={(ref) => (this.player = ref)}
        />

        <div
          className={`volume ${showSlider ? 'show-slider' : ''}`}
          ref={this.volumeRef}
        >
          {/* Speaker Icon */}
          <span
            className="speaker-icon"
            onClick={this.handleSpeakerClick}
            style={{ cursor: 'pointer', marginBottom: '10px' }}
          >
            <SpeakerIcon />
          </span>

          {/* Slider */}
          <div className="slider-container">
            <Slider
              vertical
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={this.handleVolumeChange}
              styles={{
                track: {
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  width: '2px',
                },
                handle: {
                  borderColor: 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  width: '14px',
                  height: '14px',
                  marginLeft: '-6px',
                  marginBottom: '-7px',
                },
                rail: {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  width: '2px',
                },
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default Music;
