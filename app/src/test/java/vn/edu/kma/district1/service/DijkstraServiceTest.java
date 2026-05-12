package vn.edu.kma.district1.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.model.RouteResult;
import vn.edu.kma.district1.model.WeightMode;

class DijkstraServiceTest {

    private final DijkstraService service = new DijkstraService();

    @Test
    void emptyGraphDoesNotThrowNullPointer() {
        assertThrows(AppException.class, () -> service.findRoute(new Graph(), "A", "B", WeightMode.DISTANCE));
    }

    @Test
    void fourNodeHandTraceMatchesFinalDistance() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addNode("C", "C", 0.0, 0.0);
        graph.addNode("D", "D", 0.0, 0.0);
        graph.addEdge("A", "B", 1, 60, true);
        graph.addEdge("B", "D", 1, 60, true);
        graph.addEdge("A", "C", 10, 60, true);
        graph.addEdge("C", "D", 1, 60, true);
        RouteResult toD = service.findRoute(graph, "A", "D", WeightMode.DISTANCE);
        assertEquals(2.0, toD.getTotalCost(), 1e-6);
        RouteResult toC = service.findRoute(graph, "A", "C", WeightMode.DISTANCE);
        assertEquals(10.0, toC.getTotalCost(), 1e-6);
    }

    @Test
    void relaxationKeepsPredecessorChainForSampleGraph() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addNode("D", "D", 0.0, 0.0);
        graph.addEdge("A", "B", 1, 60, true);
        graph.addEdge("B", "D", 1, 60, true);
        graph.addEdge("A", "D", 100, 60, true);
        RouteResult result = service.findRoute(graph, "A", "D", WeightMode.DISTANCE);
        assertEquals(List.of("A", "B", "D"), result.getPath());
    }

    @Test
    void pathOrderIsSourceToTarget() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addNode("C", "C", 0.0, 0.0);
        graph.addEdge("A", "B", 1, 30, true);
        graph.addEdge("B", "C", 1, 30, true);
        RouteResult result = service.findRoute(graph, "A", "C", WeightMode.DISTANCE);
        assertEquals(List.of("A", "B", "C"), result.getPath());
    }

    @Test
    void parallelEdgesChooseDistanceVersusTimeModes() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("T", "T", 0.0, 0.0);
        graph.addEdge("A", "T", 5000, 60, true);
        graph.addEdge("A", "T", 3000, 20, true);
        RouteResult distance = service.findRoute(graph, "A", "T", WeightMode.DISTANCE);
        RouteResult time = service.findRoute(graph, "A", "T", WeightMode.TIME);
        assertEquals(3000.0, distance.getTotalCost(), 1e-6);
        assertEquals(5000.0 / (60 * 1000.0 / 3600.0), time.getTotalCost(), 1e-3);
    }

    @Test
    void happyPathStraightLine() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addNode("C", "C", 0.0, 0.0);
        graph.addEdge("A", "B", 2, 30, true);
        graph.addEdge("B", "C", 3, 30, true);
        RouteResult result = service.findRoute(graph, "A", "C", WeightMode.DISTANCE);
        assertEquals(List.of("A", "B", "C"), result.getPath());
        assertEquals(5.0, result.getTotalCost(), 1e-6);
    }

    @Test
    void happyPathChoosesCheaperRoute() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addNode("C", "C", 0.0, 0.0);
        graph.addNode("D", "D", 0.0, 0.0);
        graph.addEdge("A", "B", 1, 30, true);
        graph.addEdge("B", "D", 1, 30, true);
        graph.addEdge("A", "C", 5, 30, true);
        graph.addEdge("C", "D", 1, 30, true);
        RouteResult result = service.findRoute(graph, "A", "D", WeightMode.DISTANCE);
        assertEquals(List.of("A", "B", "D"), result.getPath());
    }

    @Test
    void happyPathSourceEqualsTarget() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        RouteResult result = service.findRoute(graph, "A", "A", WeightMode.DISTANCE);
        assertTrue(result.isReachable());
        assertEquals(List.of("A"), result.getPath());
        assertEquals(0.0, result.getTotalCost(), 1e-9);
    }

    @Test
    void disconnectedComponentsReturnNoPath() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addNode("D", "D", 0.0, 0.0);
        graph.addEdge("A", "B", 1, 30, false);
        RouteResult result = service.findRoute(graph, "A", "D", WeightMode.DISTANCE);
        assertFalse(result.isReachable());
    }

    @Test
    void oneWayRespectsDirection() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addEdge("A", "B", 5, 30, true);
        RouteResult result = service.findRoute(graph, "B", "A", WeightMode.DISTANCE);
        assertFalse(result.isReachable());
    }

    @Test
    void missingNodeThrowsAppException() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        assertThrows(AppException.class, () -> service.findRoute(graph, "A", "Z", WeightMode.DISTANCE));
    }
}
