package vn.edu.kma.district1.model;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class WeightModeTest {

    @Test
    void switchExpressionCoversAllModes() {
        assertEquals(10, code(WeightMode.DISTANCE));
        assertEquals(20, code(WeightMode.TIME));
    }

    private static int code(WeightMode mode) {
        return switch (mode) {
            case DISTANCE -> 10;
            case TIME -> 20;
        };
    }
}
