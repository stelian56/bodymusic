package net.geocentral.bodymusic;

import java.util.ArrayList;
import java.util.Deque;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;

public class BMAttitudeFilter {

    // 5-point quadratic/cubic filter
//    private static final double[] convCoeffs = {-3, 12, 17, 12, -3, 35};
//    private static final double[] rateConvCoeffs = {-2, -1, 0, 1, 2, 10};
    // 7-point quadratic/cubic filter
//    private static final double[] convCoeffs = {-2, 3, 6, 7, 6, 3, -2, 21};
//    private static final double[] rateConvCoeffs = {-3, -2, -1, 0, 1, 2, 3, 28};
    // 9-point quadratic/cubic filter
//    private static final double[] convCoeffs = {-21, 14, 39, 54, 59, 54, 39, 14, -21, 231};
//    private static final double[] rateConvCoeffs = {-4, -3, -2, -1, 0, 1, 2, 3, 4, 60};
    // 11-point quadratic/cubic filter
    private static final double[] convCoeffs = {-36, 9, 44, 69, 84, 89, 84, 69, 44, 9, -36, 429};
    private static final double[] rateConvCoeffs = {-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 110};
    // 13-point quadratic/cubic filter
//    private static final double[] convCoeffs = {-11, 0, 9, 16, 21, 24, 25, 24, 21, 16, 9, 0, -11, 143};
//    private static final double[] rateConvCoeffs = {-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 182};
    private static final int capacity = convCoeffs.length - 1;
    private Double timestamp;
    private List<Deque<Double>> sinQueues;
    private List<Deque<Double>> cosQueues;
    private double[] filteredAngles;
    private double[] filteredRates;
    
    public BMAttitudeFilter() {
        reset();
    }

    public void reset() {
        sinQueues = new ArrayList<Deque<Double>>(); 
        cosQueues = new ArrayList<Deque<Double>>();
        for (int angleIndex = 0; angleIndex < 3; angleIndex++) {
            sinQueues.add(new LinkedList<Double>());
            cosQueues.add(new LinkedList<Double>());
        }
        filteredAngles = new double[3];
        filteredRates = new double[3];
    }
    
    public void update(BMSensorData sensorData) {
        timestamp = sensorData.getTimestamp();
        double dt = 1.0/sensorData.getUpdateRate();
        double[] angles = new double[3];
        BMUtils.sensorData2Angles(sensorData, angles);
        for (int angleIndex = 0; angleIndex < 3; angleIndex++) {
            double angle = angles[angleIndex];
            double sin = Math.sin(angle);
            double cos = Math.cos(angle);
            Deque<Double> sinQueue = sinQueues.get(angleIndex);
            Deque<Double> cosQueue = cosQueues.get(angleIndex);
            sinQueue.add(sin);
            cosQueue.add(cos);
            int queueSize = sinQueue.size();
            if (queueSize > capacity) {
                sinQueue.pop();
                cosQueue.pop();
                double filteredSin = 0;
                double filteredCos = 0;
                double filteredSinRate = 0;
                double filteredCosRate = 0;
                Iterator<Double> sinIterator = sinQueue.iterator();
                Iterator<Double> cosIterator = cosQueue.iterator();
                int coeffIndex = 0;
                while (sinIterator.hasNext()) {
                    double sine = sinIterator.next();
                    double cosine = cosIterator.next();
                    double convCoeff = convCoeffs[coeffIndex];
                    filteredSin += convCoeff*sine;
                    filteredCos += convCoeff*cosine;
                    double rateConvCoeff = rateConvCoeffs[coeffIndex];
                    filteredSinRate += rateConvCoeff*sine;
                    filteredCosRate += rateConvCoeff*cosine;
                    coeffIndex++;
                }
                double normalizer = convCoeffs[capacity];
                filteredSin /= normalizer;
                filteredCos /= normalizer;
                filteredAngles[angleIndex] = Math.atan2(filteredSin, filteredCos);
                double rateNormalizer = rateConvCoeffs[capacity];
                filteredSinRate /= (rateNormalizer * dt);
                filteredCosRate /= (rateNormalizer * dt);
                filteredRates[angleIndex] = filteredSinRate*filteredCos - filteredSin*filteredCosRate;
            }
        }
    }

    public double[] getAngles() {
        return filteredAngles;
    }
    
    public double[] getAngleRates() {
        return filteredRates;
    }
    
    public Double getTimestamp() {
        return timestamp;
    }
}
