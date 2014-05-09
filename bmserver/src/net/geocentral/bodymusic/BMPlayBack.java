package net.geocentral.bodymusic;

import javax.swing.JFileChooser;
import javax.swing.filechooser.FileNameExtensionFilter;

public class BMPlayBack {

    public static final String logDirName = "logs";

    private String getFileName() {
        JFileChooser fileChooser = new JFileChooser(logDirName);
        FileNameExtensionFilter filter = new FileNameExtensionFilter("BodyMusic logs", "log");
        fileChooser.setFileFilter(filter);
        int result = fileChooser.showOpenDialog(null);
        if (result == JFileChooser.APPROVE_OPTION) {
            return fileChooser.getSelectedFile().getName();
        }
        return null;
    }
    
    public static void main(String[] args) throws Exception {
        BMPlayBack playBack = new BMPlayBack();
        String fileName = playBack.getFileName();
        if (fileName == null) {
            return;
        }
        BMServer server = new BMServer(fileName);
        server.start();
    }
}
