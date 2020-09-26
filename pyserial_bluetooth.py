import argparse
import pandas as pd
import numpy as np
import serial
import time
from scipy import signal
from scipy.integrate import simps
from scipy.io.wavfile import write
import matplotlib.pyplot as plt

# Byte codes
CONNECT = 0xc0
SYNC = 0xaa
EXCODE = 0x55
POOR_SIGNAL = 0x02
ATTENTION = 0x04
MEDITATION = 0x05
BLINK = 0x16
RAW_VALUE = 0x80
ASIC_EEG_POWER = 0x83

SAMPLE_RATE = 512


class BrainWaveDataParser(object):
    def __init__(self, parser_name=None):
        self.input_data = ""
        self.parse_data = self.parse_data()
        self.state = ""
        self.sending_data = False
        self.raw_data = []
        self.noise_data = []
        self.attention_data = []
        self.meditation_data = []
        self.data_limit = 1024
        self.band_list = []
        self.eSense_data_limit = 5  # number of values to determine connection
        self.raw_data_bytes = 512  # number of bytes of raw wave data
        next(self.parse_data)

    def get_data(self, data, data_limit):
        self.data_limit = data_limit
        for c in data:
            self.parse_data.send(c)

    def parse_data(self):
        """
            This generator parses one byte at a time.
        """
        while 1:
            byte = yield
            if byte == SYNC:
                byte = yield  # This byte should be "\aa" too
                if byte == SYNC:
                    # packet synced by 0xaa 0xaa
                    # print("synced")
                    packet_length = yield
                    packet_code = yield
                    if packet_code == CONNECT:
                        self.state = "connected"

                    else:
                        self.sending_data = True
                        left = packet_length - 2
                        while left > 0:
                            if packet_code == RAW_VALUE:
                                row_length = yield
                                low_byte = yield
                                high_byte = yield
                                # shift bits and take care of signed values
                                raw_value = (high_byte << 8) | low_byte
                                if raw_value > 32768:
                                    raw_value = raw_value - 65536

                                left -= 2
                                self.raw_data.append(raw_value)

                                if len(self.raw_data) > self.raw_data_bytes:
                                    df = pd.DataFrame(self.raw_data).reset_index()
                                    df.columns=["Time", "Value"]
                                    df.to_json("data/raw_value.json")
                                    write_data_panda(self.raw_data, 'data/raw_panda.csv')
                                    self.raw_data = []

                            elif packet_code == POOR_SIGNAL:  # Poor signal
                                poor_byte = yield
                                print("poor signals: ", poor_byte)
                                self.noise_data.append(poor_byte)
                                if poor_byte == 200:
                                    print("electrode not touching the skin")
                                if len(self.noise_data) >= self.eSense_data_limit:
                                    df_noise = pd.DataFrame(self.noise_data).reset_index()
                                    df_noise.columns = ["Status_Number", "Status"]
                                    df_noise.to_json("data/noise_status.json", orient="records")
                                    #write_data_panda(self.noise_data, 'data/noise_panda.csv')
                                    self.noise_data = []
                                left -= 1

                            elif packet_code == ATTENTION:  # Attention (eSense)
                                attn_byte = yield
                                print("attention", attn_byte)
                                if attn_byte <= 100:
                                    self.attention_data.append(attn_byte)

                                    if len(self.attention_data) > self.eSense_data_limit:
                                        write_data_panda(self.attention_data, 'data/attention_panda.csv')

                                        self.attention_data = []
                                left -= 1

                            elif packet_code == MEDITATION:  # Meditation (eSense)
                                med_byte = yield
                                if med_byte <= 100:
                                    self.meditation_data.append(med_byte)
                                    if len(self.meditation_data) > self.eSense_data_limit:
                                        write_data_panda(self.meditation_data, 'data/meditation_panda.csv')

                                        self.meditation_data = []

                                left -= 1

                            elif packet_code == ASIC_EEG_POWER:  # Bands
                                vector_length = yield
                                current_vector = []
                                for row in range(8):
                                    band_low_byte = yield
                                    band_middle_byte = yield
                                    band_high_byte = yield
                                    value = (band_high_byte << 16) | (band_middle_byte << 8) | band_low_byte
                                    current_vector.append(value)

                                left -= vector_length

                                bands_array = np.array(current_vector)
                                bands_normalized = bands_array / bands_array.sum()
                                # assign bands
                                band_data = {"delta": bands_normalized[0],
                                             "theta": bands_normalized[1],
                                             "low-alpha": bands_normalized[2],
                                             "high-alpha": bands_normalized[3],
                                             "low-beta": bands_normalized[4],
                                             "high-beta": bands_normalized[5],
                                             "low-gamma": bands_normalized[6],
                                             "mid-gamma": bands_normalized[7]
                                             }
                                self.band_list.append(band_data)
                                # print(len(self.band_list))
                                if len(self.band_list) > self.eSense_data_limit:
                                    band_df = pd.DataFrame(data=self.band_list).reset_index(drop=False)
                                    band_df.to_csv('data/band_data.csv')
                                    self.band_list = []

                            packet_code = yield
                else:
                    pass  # sync failed
            else:
                pass  # sync failed

def write_data_panda(data, filename):
    df = pd.DataFrame(data).reset_index()
    df.columns = ['Time', 'Value']
    df.to_csv(filename)


def mindwave_connect(serial_port, baud_rate=57600, bytesize=8, parity='N', stopbits=1, timeout=None, number_of_byte=512):
    ser = serial.Serial(serial_port)
    ser.port = serial_port
    ser.baudrate = baud_rate
    ser.bytesize = bytesize
    ser.parity = parity
    ser.stopbits = stopbits
    ser.timeout = timeout
    x = ser.read(number_of_byte)
    ser.close()
    return x


def process_brain_waves(filename):
    #normalize brain wave
    raw_df = pd.read_json(filename)
    brain_wave = raw_df.loc[:, 'Value']
    brain_wave = np.array(brain_wave)
    brain_wave_max = brain_wave.max()
    brain_wave_min = brain_wave.min()

    brain_wave_norm = 2 * (brain_wave - brain_wave_min) / (brain_wave_max - brain_wave_min) - 1
    sample_rate = 512
    time_period = np.arange(brain_wave_norm.size) / sample_rate
    data_norm = []

    for i, time_value in enumerate(time_period):
        data_norm.append([time_value, brain_wave_norm[i]])

    # write normalized values
    norm_df = pd.DataFrame(data_norm, columns=['Time', 'Amplitude'])
    norm_df.to_json('data/raw_norm.json', orient='records')
    raw_norm_range = len(norm_df.index)

    #Welch's periodogram
    from scipy import signal

    # Define window length
    win = time_period.max() * SAMPLE_RATE
    freqs, psd = signal.welch(brain_wave_norm, SAMPLE_RATE, nperseg=win)

    data_welch = []
    for i, freq in enumerate(freqs):
        data_welch.append([freq, psd[i]])

    welch_df = pd.DataFrame(data_welch, columns=['Frequency', 'Power'])
    welch_df.to_json('data/welch_value.json', orient='records')

    # Calculate Area Under The Curve
    # Source - https://nhahealth.com/brainwaves-the-language/

    band_range = {'Delta': [0.05, 3], 'Theta': [3.05, 8], 'Alpha': [8.05, 12],
                  'Low-Beta': [12.05, 15], 'Mid-Beta': [15.05, 18], 'High-Beta': [18.05, 30], 'Low-Gamma': [30.05, 39.75],
                  'Mid-Gamma': [39.80, 49.75],
                  'Total': [0.05, 49.75]}

    band_strength = []

    for key, value in band_range.items():
        auc_range = (freqs >= value[0]) & (freqs < value[1])
        band_freq = freqs[auc_range]
        band_psd = psd[auc_range]
        auc = simps(band_psd, band_freq)
        band_strength.append([key, value[0], value[1], auc])

    df_band_strength = pd.DataFrame(band_strength, columns=['Band', 'Lower_Range_Hz', 'Higher_Range_Hz', 'AUC'])
    total_auc = float(df_band_strength.loc[8, 'AUC'])
    df_band_strength['Normalized_AUC'] = df_band_strength.loc[:, 'AUC'] / total_auc
    df_band_strength = df_band_strength.loc[0:7, :] # remove total value for visulaization
    df_band_strength.to_json('data/band_strength.json', orient='records')
    band_range = len(df_band_strength.index)

    #Spectrogram
    spec_fig = plt.figure(figsize=(6, 4))
    powerSpectrum, freqenciesFound, time, imageAxis = plt.specgram(brain_wave_norm, Fs=SAMPLE_RATE, cmap='viridis',
                                                                   NFFT=100, noverlap=90)
    plt.xlabel('Time (Seconds)')
    plt.ylabel('Frequency (Hz)')
    plt.savefig('data/spectrogram')
    plt.close(spec_fig)

    #Sound conversion
    # Superimposing brainwave on a carrier wave to play sound

    carrier_frequency = 500  # Higher the frequency more the pitch of the sound
    sample_rate_sound = 22050
    number_of_samples = time_period.max() * sample_rate_sound
    steps = 1/number_of_samples
    x_interpolation_range = np.arange(0, time_period.max(), steps)
    brain_wave_interpolated = np.interp(x_interpolation_range, time_period, brain_wave_norm)

    # Amplitude Modulation Parameters
    carrier_amplitude = 0.5
    modulation_sensitivity = 15.0

    # Generate Sine Wave
    carrier = np.sin(2 * np.pi * carrier_frequency * x_interpolation_range)

    envelope = carrier_amplitude * (1.0 + modulation_sensitivity * brain_wave_interpolated)
    modulated = envelope * carrier
    modulated *= 0.10
    modulated_to_ints = np.int16(modulated * 32767)

    sound_wave = []
    for i in range(len(x_interpolation_range)):
        sound_wave.append([x_interpolation_range[i], modulated[i]])

    df_sound_wave = pd.DataFrame(sound_wave, columns=["Seconds", "Amplitude"])
    df_sound_wave.to_json('data/sound_wave_sound_visual.json', orient='records')

    #write sound
    write('data/brain_wave_sound.mp3', sample_rate_sound, modulated_to_ints)



parser = argparse.ArgumentParser(description='provide port information')
parser.add_argument('address', type=str, help="Please provide the port information. For Linux/MacOS it will look like"
                                              "/dev/rfcomm0 or similar serial port. For Windows it will be COM1 or "
                                              "similar port")
args = parser.parse_args()
print(args.address)
port_address = args.address
number_of_bytes = 512

mindwave_data = mindwave_connect(port_address, timeout=None, number_of_byte=number_of_bytes)
print("Mindwave connected to {}".format(port_address))
print(mindwave_data)
brain_data = BrainWaveDataParser()
brain_data.get_data(mindwave_data, number_of_bytes)


while True:
    mindwave_data = mindwave_connect(port_address, timeout=1, number_of_byte=number_of_bytes)
    brain_data.get_data(mindwave_data, number_of_bytes)
    process_brain_waves('data/raw_value.json')
    time.sleep(0.2)

