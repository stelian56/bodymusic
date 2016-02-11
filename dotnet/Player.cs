using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading;

namespace BodyMusic
{
    class Player
    {
        private int deviceId = 0;
        private byte metronomeChannel = 0;
        private byte metronomeInstrumentId = 115;
        private int metronomePitch = 72;
        private IntPtr midiOut;
        private Voice metronome;
        private Dictionary<int, Voice> voices = new Dictionary<int, Voice>();

        public Player()
        {
            MMRESULT result = midiOutOpen(out midiOut, (uint)deviceId, IntPtr.Zero, IntPtr.Zero, 0);
            if (result != MMRESULT.MMSYSERR_NOERROR)
            {
                throw new Exception();
            }
            metronome = AddVoice(metronomeChannel, metronomeInstrumentId, true);
            metronome.Update(metronomePitch);
        }

        internal Voice AddVoice(byte channel, byte instrumentId, bool recurrent)
        {
            Voice voice = new Voice(midiOut, channel, instrumentId, recurrent);
            voices.Add(channel, voice);
            return voice;
        }

        internal void Update(int channel, int pitch)
        {
            voices[channel].Update(pitch);
        }

        internal void Play()
        {
            if (MetronomeEnabled)
            {
                metronome.Play();
            }
            foreach (Voice voice in voices.Values)
            {
                voice.Play();
            }
        }

        internal bool MetronomeEnabled
        {
            get;
            set;
        }

        internal void Stop()
        {
            MMRESULT result = midiOutClose(midiOut);
            if (result != Player.MMRESULT.MMSYSERR_NOERROR)
            {
                throw new Exception();
            }
        }

        [Flags]
        internal enum MMRESULT : uint
        {
            MMSYSERR_NOERROR,
            MMSYSERR_ERROR,
            MMSYSERR_BADDEVICEID,
            MMSYSERR_NOTENABLED,
            MMSYSERR_ALLOCATED,
            MMSYSERR_INVALHANDLE,
            MMSYSERR_NODRIVER,
            MMSYSERR_NOMEM,
            MMSYSERR_NOTSUPPORTED,
            MMSYSERR_BADERRNUM,
            MMSYSERR_INVALFLAG,
            MMSYSERR_INVALPARAM,
            MMSYSERR_HANDLEBUSY,
            MMSYSERR_INVALIDALIAS,
            MMSYSERR_BADDB = 14,
            MMSYSERR_KEYNOTFOUND,
            MMSYSERR_READERROR,
            MMSYSERR_WRITEERROR,
            MMSYSERR_DELETEERROR,
            MMSYSERR_VALNOTFOUND,
            MMSYSERR_NODRIVERCB
        }

        [DllImport("winmm.dll")]
        internal static extern MMRESULT midiOutOpen(out IntPtr midiOut, uint deviceId, IntPtr dwCallback,
                IntPtr dwCallbackInstance, uint dwFlags);

        [DllImport("winmm.dll")]
        internal static extern MMRESULT midiOutClose(IntPtr midiOut);

        [DllImport("winmm.dll")]
        internal static extern MMRESULT midiOutShortMsg(IntPtr midiOut, uint message);
     }
}
