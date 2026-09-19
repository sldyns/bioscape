"""Generate the film's original, understated ambient score (no external samples)."""
import array
import math
import os
import wave
from pathlib import Path
RATE = 44100
DURATION = 54
# Dmaj9 – Bm7 – Gmaj9 – Asus4; one gentle change every eight seconds.
CHORDS = [(50, 57, 61, 64, 69), (47, 54, 57, 62, 66), (43, 50, 54, 57, 62), (45, 52, 57, 62, 64)]
frequency = lambda note: 440 * 2 ** ((note - 69) / 12)
notes = [tuple(frequency(note) for note in chord) for chord in CHORDS]
frames = array.array('h')
for sample in range(RATE * DURATION):
    t = sample / RATE
    section = int(t / 8)
    local = t % 8
    chord = notes[section % 4]
    prior = notes[(section - 1) % 4]
    blend = min(1, local / 1.6)
    blend = blend * blend * (3 - 2 * blend)
    envelope = min(1, t / 2.8, max(0, (DURATION - t) / 4))
    channels = []
    for side in (-1, 1):
        pad = 0
        for active, weight in [(prior, 1-blend), (chord, blend)]:
            for index, hz in enumerate(active):
                detune = 1 + side * .00065
                pad += weight * (.055 * math.sin(2 * math.pi * hz * detune * t + index * .36) + .013 * math.sin(2 * math.pi * hz * 2.001 * t)) / len(active)
        beat = .75
        step = int(t / beat)
        age = t - step * beat
        hz = chord[[0, 2, 4, 1, 3, 2, 1, 4][step % 8]] * 2
        attack = min(1, age / .018)
        bell = .035 * attack * math.exp(-age * 4.6) * (math.sin(2*math.pi*hz*t) + .18*math.sin(2*math.pi*hz*2.003*t))
        breathing = .88 + .12 * math.sin(t * .45)
        value = (pad * breathing + bell * (1 + side * .12)) * envelope
        channels.append(round(max(-1,min(1,value)) * 32767))
    frames.extend(channels)
output = Path(os.environ.get('BIOSCAPE_MEDIA_OUTPUT', '/tmp/bioscape-media')) / 'score.wav'
output.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(output), 'wb') as audio:
    audio.setnchannels(2)
    audio.setsampwidth(2)
    audio.setframerate(RATE)
    audio.writeframes(frames.tobytes())
print(output)
