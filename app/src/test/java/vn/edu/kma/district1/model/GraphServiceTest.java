package vn.edu.kma.district1.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.service.DijkstraService;

class GraphServiceTest {

    @Test
    void addNodesAndEdgesCountsAdjacency() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addNode("C", "C", 0.0, 0.0);
        graph.addEdge("A", "B", 10, 30, false);
        graph.addEdge("A", "C", 15, 30, false);
        graph.addEdge("B", "C", 5, 30, true);
        graph.addEdge("C", "B", 5, 30, true);
        assertEquals(3, graph.getNodeCount());
        assertEquals(2, graph.getAdjacentEdges("A").size());
    }

    @Test
    void duplicateNodeIdDoesNotGrowGraph() {
        Graph graph = new Graph();
        graph.addNode("A", "first", 0.0, 0.0);
        graph.addNode("A", "second", 0.0, 0.0);
        assertEquals(1, graph.getNodeCount());
        assertEquals("second", graph.getNode("A").getName());
    }

    @Test
    void addEdgeToMissingNodeThrowsAppException() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        assertThrows(AppException.class, () -> graph.addEdge("A", "Z", 1, 30, true));
    }

    @Test
    void bidirectionalEdgeAddsBothDirections() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addEdge("A", "B", 100, 40, false);
        assertTrue(graph.getAdjacentEdges("A").stream().anyMatch(e -> e.getToNodeId().equals("B")));
        assertTrue(graph.getAdjacentEdges("B").stream().anyMatch(e -> e.getToNodeId().equals("A")));
    }

    @Test
    void oneWayEdgeRespectsDirection() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addEdge("A", "B", 50, 30, true);
        assertEquals(1, graph.getAdjacentEdges("A").size());
        assertEquals(0, graph.getAdjacentEdges("B").size());
    }

    @Test
    void blockOnlyConnectingEdgeMakesDijkstraUnreachable() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addEdge("A", "B", 10, 30, false);
        DijkstraService dijkstra = new DijkstraService();
        RouteResult before = dijkstra.findRoute(graph, "A", "B", WeightMode.DISTANCE);
        assertTrue(before.isReachable());
        graph.blockEdge("A", "B");
        graph.blockEdge("B", "A");
        RouteResult after = dijkstra.findRoute(graph, "A", "B", WeightMode.DISTANCE);
        assertFalse(after.isReachable());
    }

    @Test
    void unblockRestoresOriginalRoute() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addEdge("A", "B", 10, 30, false);
        DijkstraService dijkstra = new DijkstraService();
        RouteResult first = dijkstra.findRoute(graph, "A", "B", WeightMode.DISTANCE);
        graph.blockEdge("A", "B");
        graph.blockEdge("B", "A");
        graph.unblockEdge("A", "B");
        graph.unblockEdge("B", "A");
        RouteResult second = dijkstra.findRoute(graph, "A", "B", WeightMode.DISTANCE);
        assertEquals(first.getPath(), second.getPath());
    }

    @Test
    void blockMissingEdgeThrows() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        assertThrows(AppException.class, () -> graph.blockEdge("A", "B"));
    }

    @Test
    void blockForcesDetourWithDifferentPath() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addNode("C", "C", 0.0, 0.0);
        graph.addEdge("A", "B", 100, 30, false);
        graph.addEdge("B", "C", 100, 30, false);
        graph.addEdge("A", "C", 50, 30, false);
        DijkstraService dijkstra = new DijkstraService();
        RouteResult direct = dijkstra.findRoute(graph, "A", "C", WeightMode.DISTANCE);
        assertEquals(List.of("A", "C"), direct.getPath());
        graph.blockEdge("A", "C");
        graph.blockEdge("C", "A");
        RouteResult detour = dijkstra.findRoute(graph, "A", "C", WeightMode.DISTANCE);
        assertTrue(detour.isReachable());
        assertEquals(List.of("A", "B", "C"), detour.getPath());
        assertNotEquals(direct.getPath(), detour.getPath());
    }

    @Test
    void blockedEdgeRemainsListedButNotTraversable() {
        Graph graph = new Graph();
        graph.addNode("A", "A", 0.0, 0.0);
        graph.addNode("B", "B", 0.0, 0.0);
        graph.addEdge("A", "B", 5, 30, true);
        graph.blockEdge("A", "B");
        Edge edge = graph.getAdjacentEdges("A").getFirst();
        assertEquals("B", edge.getToNodeId());
        assertFalse(edge.isTraversable());
    }
}
