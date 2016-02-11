using System;
using System.Windows;
using System.Windows.Input;

namespace BodyMusic
{
    partial class MainWindow : Window
    {
        private Player player;
        private Scheduler scheduler;

        public MainWindow()
        {
            InitializeComponent();
            Init();
        }

        private void Init()
        {
            player = new Player();
            player.MetronomeEnabled = false;
            byte channel = 1;
            byte instrumentId = 0;
            player.AddVoice(channel, instrumentId, false);
            scheduler = new Scheduler(player);
        }

        private void OnKey(object sender, KeyEventArgs e)
        {
            if (!e.IsRepeat)
            {
                Console.Out.WriteLine(e.Key);
                int channel = 1;
                int pitch = 0;
                switch (e.Key)
                {
                    case Key.A:
                        pitch = 60;
                        break;
                    case Key.S:
                        pitch = 62;
                        break;
                    case Key.D:
                        pitch = 64;
                        break;
                    case Key.Space:
                        player.MetronomeEnabled = !player.MetronomeEnabled;
                        break;
                }
                if (pitch > 0)
                {
                    player.Update(channel, pitch);
                }
            }
        }

        private void OnClosed(object sender, EventArgs e)
        {
            scheduler.Stop();
            player.Stop();
        }

        private void ShowMessage(string message)
        {
            MessageBox.Show(message, "Body Music", MessageBoxButton.OK, MessageBoxImage.Information);
        }
    }
}
