package net.geocentral.bodymusic;

import java.util.Arrays;


public class BMPitchController {

    private static final int minPitch = 36;
    private static final int maxPitch = 96;
    private static final int defaultPitch = 48; // C3
    private Integer prevPitch;
    private int[] prevScale;
    private int prevScaleBase;
    private int prevScaleOffset;

    public int getPitch(int[] scale, int scaleBase, int direction) {
        if (prevPitch != null && (prevPitch <= minPitch && direction < 0 ||
                prevPitch >= maxPitch && direction > 0)) {
            return prevPitch;
        }
        int pitch;
        int scaleOffset;
        if (prevPitch == null) {
            pitch = defaultPitch;
            scaleOffset = getScaleOffset(pitch, scale, scaleBase, direction);
        }
        else if (scaleBase != prevScaleBase) {
            pitch = prevPitch;
            scaleOffset = getScaleOffset(pitch, scale, scaleBase, direction);
        }
        else if (!Arrays.equals(prevScale, scale)) {
            pitch = prevPitch;
            scaleOffset = getScaleOffset(pitch, scale, scaleBase, direction);
        }
        else {
            if (direction > 0) {
                scaleOffset = prevScaleOffset + 1;
            }
            else if (direction < 0) {
                scaleOffset = prevScaleOffset - 1;
            }
            else {
                scaleOffset = prevScaleOffset;
            }
            pitch = scaleOffset2Pitch(scale, scaleBase, scaleOffset);
        }
        prevPitch = pitch;
        prevScale = scale;
        prevScaleBase = scaleBase;
        prevScaleOffset = scaleOffset;
        return pitch;
    }

    private int scaleOffset2Pitch(int[] scale, int scaleBase, int scaleOffset) {
        int scaleLength = scale.length;
        int octaveNumber = scaleOffset / scaleLength;
        int inOctaveScaleOffset = scaleOffset % scaleLength;
        int pitch = scaleBase + 12 * octaveNumber + scale[inOctaveScaleOffset];
        return pitch;
    }
    
    private int getScaleOffset(int pitch, int[] scale, int scaleBase, int direction) {
        int octaveNumber = (pitch - scaleBase) / 12;
        int scaleLength = scale.length;
        int prevScaleOffset = Integer.MAX_VALUE;
        int prevScalePitch = Integer.MAX_VALUE;
        for (int scaleOffset = scaleLength * octaveNumber - 1;
                scaleOffset <= scaleLength * (octaveNumber + 1);
                scaleOffset++) {
            int scaleOctaveNumber = scaleOffset / scaleLength;
            int inOctaveScaleOffset = scaleOffset % scaleLength;
            int scalePitch = scaleBase + 12 * scaleOctaveNumber + scale[inOctaveScaleOffset];
            if (scalePitch == pitch) {
                return scaleOffset;
            }
            if (scalePitch > pitch) {
                int toPrev = pitch - prevScalePitch;
                int toNext = scalePitch - pitch;
                if (toPrev < toNext) {
                    return prevScaleOffset;
                }
                else if (toPrev > toNext) {
                    return scaleOffset;
                }
                else {
                    return direction > 0 ? scaleOffset : prevScaleOffset;
                }
            }
            prevScaleOffset = scaleOffset;
            prevScalePitch = scalePitch;
        }
        String message = String.format("Failed to compute scale offset for pitch %s", pitch);
        throw new RuntimeException(message);
    }
}
