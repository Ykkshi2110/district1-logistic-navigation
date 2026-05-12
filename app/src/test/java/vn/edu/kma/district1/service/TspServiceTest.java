package vn.edu.kma.district1.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.model.WeightMode;

class TspServiceTest {

    private final TspService tspService = new TspService();
    private final DijkstraService dijkstraService = new DijkstraService();

    @Test
    void threePointTourMatchesIndependentDijkstraMatrix() {
        Graph graph = triangleGraph();
        List<String> points = List.of("O", "A", "B");
        double[][] matrix = tspService.buildCostMatrix(graph, points, WeightMode.DISTANCE);
        for (int i = 0; i < points.size(); i++) {
            for (int j = 0; j < points.size(); j++) {
                if (i == j) {
                    assertEquals(0.0, matrix[i][j], 1e-9);
                } else {
                    double expected = dijkstraService
                            .findRoute(graph, points.get(i), points.get(j), WeightMode.DISTANCE)
                            .getTotalCost();
                    assertEquals(expected, matrix[i][j], 1e-9);
                }
            }
        }
        TspResult tsp = tspService.solve(graph, "O", List.of("A", "B"), WeightMode.DISTANCE);
        assertEquals(3.0, tsp.totalCost(), 1e-9);
        assertEquals(3, tsp.visitOrder().size());
    }

    @Test
    void unreachablePairThrowsAppException() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addNode("C", "C", 0.0, 0.0);
        graph.addEdge("A", "B", 1, 30, false);
        assertThrows(AppException.class, () -> tspService.solve(graph, "A", List.of("B", "C"), WeightMode.DISTANCE));
    }

    @Test
    void depotDuplicatedInDeliveriesThrows() {
        Graph graph = triangleGraph();
        assertThrows(AppException.class, () -> tspService.solve(graph, "O", List.of("O", "A"), WeightMode.DISTANCE));
    }

    @Test
    void fiveDeliveryPointsFinishesWithinOneSecond() {
        Graph graph = completeGraph(6, 100.0);
        List<String> deliveries = List.of("N1", "N2", "N3", "N4", "N5");
        long start = System.currentTimeMillis();
        tspService.solve(graph, "N0", deliveries, WeightMode.DISTANCE);
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 1000, "TSP 5 điểm phải hoàn tất dưới 1 giây");
    }

    private Graph triangleGraph() {
        Graph graph = new Graph();
        graph.addNode("O", "Depot", 0.0, 0.0);
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addEdge("O", "A", 1, 30, false);
        graph.addEdge("O", "B", 1, 30, false);
        graph.addEdge("A", "B", 1, 30, false);
        return graph;
    }

    private Graph completeGraph(int size, double weight) {
        Graph graph = new Graph();
        for (int i = 0; i < size; i++) {
            graph.addNode("N" + i, "Node " + i, 0.0, 0.0);
        }
        for (int i = 0; i < size; i++) {
            for (int j = i + 1; j < size; j++) {
                graph.addEdge("N" + i, "N" + j, weight, 40, false);
            }
        }
        return graph;
    }
}
