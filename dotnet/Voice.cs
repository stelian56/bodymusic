using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BodyMusic
{
   class Voice
    {
        private IntPtr midiOut;
        private int channel;
        private bool recurrent;
        private int currentPitch;
        private int nextPitch;

        public Voice(IntPtr midiOut, int channel, int instrumentId, bool recurrent)
        {
            this.midiOut = midiOut;
            this.channel = channel;
            this.recurrent = recurrent;
            Player.MMRESULT result = Player.midiOutShortMsg(midiOut, 0);
            int status = 0xC0 | channel;
            byte[] data = new byte[4] { (byte)status, (byte)instrumentId, 0, 0 };
            uint message = BitConverter.ToUInt32(data, 0);
            result = Player.midiOutShortMsg(midiOut, message);
            if (result != Player.MMRESULT.MMSYSERR_NOERROR)
            {
                throw new Exception();
            }
        }

        internal void Update(int pitch)
        {
            nextPitch = pitch;
        }

        internal void Play()
        {
            if (nextPitch > 0)
            {
                byte[] data;
                uint message;
                int status;
                Player.MMRESULT result;
                if (currentPitch > 0)
                {
                    status = 0x80 | channel;
                    data = new byte[4] { (byte)status, (byte)currentPitch, 0, 0 };
                    message = BitConverter.ToUInt32(data, 0);
                    result = Player.midiOutShortMsg(midiOut, message);
                    if (result != Player.MMRESULT.MMSYSERR_NOERROR)
                    {
                        throw new Exception();
                    }
                }
                status = 0x90 | channel;
                data = new byte[4] { (byte)status, (byte)nextPitch, 100, 0 };
                message = BitConverter.ToUInt32(data, 0);
                result = Player.midiOutShortMsg(midiOut, message);
                if (result != Player.MMRESULT.MMSYSERR_NOERROR)
                {
                    throw new Exception();
                }
                currentPitch = nextPitch;
                if (!recurrent)
                {
                    nextPitch = 0;
                }
            }
        }

        internal void Stop()
        {
            Player.MMRESULT result = Player.midiOutClose(midiOut);
            if (result != Player.MMRESULT.MMSYSERR_NOERROR)
            {
                throw new Exception();
            }
        }
    }
}
