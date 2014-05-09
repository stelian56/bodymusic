package net.geocentral.bodymusic;

import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;

public class BMThreadFactory implements ThreadFactory {

    private String threadName;
    
    public BMThreadFactory(String threadName) {
        this.threadName = threadName;
    }
    
    public Thread newThread(Runnable worker) {
        Thread thread = Executors.defaultThreadFactory().newThread(worker);
        thread.setName(threadName);
        return thread;
    }

}
