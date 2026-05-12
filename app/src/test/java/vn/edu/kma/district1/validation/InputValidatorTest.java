package vn.edu.kma.district1.validation;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Graph;

class InputValidatorTest {

    @Test
    void missingNodeMessageContainsId() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        AppException ex = assertThrows(AppException.class, () -> InputValidator.validateNodeExists(graph, "XYZ"));
        assertTrue(ex.getMessage().contains("XYZ"));
    }

    @Test
    void tooManyDeliveriesThrows() {
        assertThrows(AppException.class, () -> InputValidator.validateDeliveryPoints(List.of("a", "b", "c", "d", "e", "f")));
    }
}
