package vn.edu.kma.district1.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class RouteResultTest {

    @Test
    void noPathIsNotReachable() {
        assertFalse(RouteResult.noPath().isReachable());
    }

    @Test
    void successExposesTotalCost() {
        RouteResult result = RouteResult.success(List.of("A", "B"), 5.0);
        assertTrue(result.isReachable());
        assertEquals(5.0, result.getTotalCost(), 1e-9);
    }
}
