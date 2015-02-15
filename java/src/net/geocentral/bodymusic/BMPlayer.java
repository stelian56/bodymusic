package net.geocentral.bodymusic;

import javax.sound.midi.MidiSystem;
import javax.sound.midi.Receiver;
import javax.sound.midi.ShortMessage;
import javax.sound.midi.Synthesizer;

public class BMPlayer {

    private static final int maxPitch = 127;
    private static final int minPitch = 0;
    private Synthesizer synthesizer;

    public void init() throws Exception {
        synthesizer = MidiSystem.getSynthesizer();
//        for (Instrument instrument : synthesizer.getAvailableInstruments()) {
//            System.out.println(String.format("%s", instrument));
//        }
        synthesizer.open();
        synthesizer.loadAllInstruments(synthesizer.getDefaultSoundbank());
    }
    
    public void play(BMNote note) {
        int pitch = note.getPitch();
        if (pitch > maxPitch || pitch < minPitch) {
            System.err.println(String.format("Pitch %d out of range", pitch));
        }
        final ShortMessage message = new ShortMessage();
        int midiInstrumentId = note.getMidiInstrumentId();
        int volume = note.getVolume();
        try {
            Receiver receiver = synthesizer.getReceiver();
            message.setMessage(ShortMessage.PROGRAM_CHANGE, 0, midiInstrumentId, 0);
            receiver.send(message, -1);
            message.setMessage(ShortMessage.NOTE_ON, 0, pitch, volume);
            receiver.send(message, -1);
        }
        catch (Exception exception) {
            exception.printStackTrace();
            return;
        }
    }
}
