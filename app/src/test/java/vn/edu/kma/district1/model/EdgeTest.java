package vn.edu.kma.district1.model;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class EdgeTest {

    @Test
    void getWeightDistanceReturnsMeters() {
        Edge edge = new Edge("B", 250.0, 40.0, false);
        assertEquals(250.0, edge.getWeight(WeightMode.DISTANCE), 1e-9);
    }

    @Test
    void getWeightTimeReturnsSecondsUsingFormula() {
        Edge edge = new Edge("B", 1000.0, 36.0, false);
        double expected = 1000.0 / (36.0 * Edge.METERS_PER_KILOMETER / Edge.SECONDS_PER_HOUR);
        assertEquals(expected, edge.getWeight(WeightMode.TIME), 1e-6);
    }
}
