import React from 'react';
import ReactHowler from 'react-howler';
import { PiSpeakerSimpleHighLight, PiSpeakerSimpleLowLight, PiSpeakerSimpleNoneLight } from 'react-icons/pi'; // Import speaker icons

class Music extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      playing: true, // Always play by default
      volume: 0,
      previousVolume: 0.3, // Track the previous volume level for restoring
      isMuted: false
    };

    this.handleVolumeChange = this.handleVolumeChange.bind(this);
    this.handleSpeakerClick = this.handleSpeakerClick.bind(this);
  }

  handleVolumeChange(e) {
    const volume = parseFloat(e.target.value);
    this.setState({
      volume,
      isMuted: volume === 0 // Update isMuted based on whether the volume is 0
    });
  }

  handleSpeakerClick() {
    const { isMuted, volume, previousVolume } = this.state;

    if (isMuted) {
      // Unmute: Animate volume back to the previous level
      this.setState({ isMuted: false });
      this.animateVolume(previousVolume);
    } else {
      // Mute: Save current volume level and animate to 0
      this.setState({ previousVolume: volume, isMuted: true });
      this.animateVolume(0);
    }
  }

  animateVolume(targetVolume) {
    const step = targetVolume < this.state.volume ? -0.05 : 0.05; // Determine if increasing or decreasing volume
    const interval = 20; // Interval in milliseconds
    const animate = () => {
      this.setState((prevState) => {
        let newVolume = prevState.volume + step;

        // Stop at target volume
        if ((step < 0 && newVolume <= targetVolume) || (step > 0 && newVolume >= targetVolume)) {
          newVolume = targetVolume;
          clearInterval(this.volumeInterval);
        }

        return {
          volume: newVolume,
          isMuted: newVolume === 0 // Update isMuted when volume reaches 0
        };
      });
    };

    this.volumeInterval = setInterval(animate, interval);
  }

  render() {
    const { volume, isMuted } = this.state;

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
          src={['romeo_n_juliet.mp3']}
          playing={this.state.playing}
          volume={volume}
          ref={(ref) => (this.player = ref)}
        />

        <div className="volume">
          {/* Vertical Volume Slider */}
          <span className="slider-container">
            <input
              type="range"
              min="0"
              max="1"
              step=".05"
              value={volume}
              onChange={this.handleVolumeChange}
              className="vertical-slider"
            />
          </span>

          {/* Speaker Icon */}
          <span className="speaker-icon" onClick={this.handleSpeakerClick} style={{ cursor: 'pointer', marginBottom: '10px' }}>
            <SpeakerIcon />
          </span>
        </div>
      </div>
    );
  }
}

export default Music;
