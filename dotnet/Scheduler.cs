using System;
using System.Threading;

namespace BodyMusic
{
    class Scheduler
    {
        private int tempo = 120;
        private Player player;
        private Timer timer;

        public Scheduler(Player player)
        {
            this.player = player;
            AutoResetEvent resetEvent = new AutoResetEvent(false);
            TimeSpan tickInterval = TimeSpan.FromSeconds(60.0/tempo);
            timer = new Timer(Tick, resetEvent, 0, (long)tickInterval.TotalMilliseconds);
        }

        internal void Stop()
        {
            WaitHandle waitHandle = new AutoResetEvent(false);
            timer.Dispose(waitHandle);
            WaitHandle.WaitAll(new WaitHandle[] { waitHandle });
        }

        private void Tick(object state)
        {
            player.Play();
        }
    }
}
