package vn.edu.kma.district1.integration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import org.junit.jupiter.api.Test;
import vn.edu.kma.district1.io.CsvMapLoader;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.model.RouteResult;
import vn.edu.kma.district1.model.WeightMode;
import vn.edu.kma.district1.service.DijkstraService;
import vn.edu.kma.district1.service.TspService;

class District1IntegrationTest {

    private final DijkstraService dijkstraService = new DijkstraService();
    private final TspService tspService = new TspService();

    @Test
    void loadCsvAndRunThreeRealisticQueries() throws Exception {
        Graph graph = loadDistrictGraph();
        Set<String> ids = graph.getAllNodeIds();
        assertTrue(ids.size() >= 20);
        assertRouteReasonable(graph, "BT", "NTD");
        assertRouteReasonable(graph, "NHUE", "BITX");
        assertRouteReasonable(graph, "ISL1", "ISL2");
    }

    @Test
    void blockEdgeOnFirstPathChangesSecondQuery() throws Exception {
        Graph graph = loadDistrictGraph();
        RouteResult first = dijkstraService.findRoute(graph, "BT", "BITX", WeightMode.DISTANCE);
        assertTrue(first.isReachable());
        List<String> path = first.getPath();
        String from = path.get(0);
        String to = path.get(1);
        graph.blockEdge(from, to);
        RouteResult second = dijkstraService.findRoute(graph, "BT", "BITX", WeightMode.DISTANCE);
        assertNotEquals(first.getPath(), second.getPath());
    }

    @Test
    void tspFiveStopsCompletesUnderHalfSecond() throws Exception {
        Graph graph = loadDistrictGraph();
        long start = System.currentTimeMillis();
        tspService.solve(graph, "BT", List.of("NTD", "DDL", "NHUE", "BITX", "SAIGC"), WeightMode.DISTANCE);
        long elapsed = System.currentTimeMillis() - start;
        assertTrue(elapsed < 500, "TSP 5 điểm giao phải dưới 500ms, thực tế: " + elapsed + "ms");
    }

    @Test
    void islandNodesNotReachableFromMainComponent() throws Exception {
        Graph graph = loadDistrictGraph();
        RouteResult cross = dijkstraService.findRoute(graph, "BT", "ISL1", WeightMode.DISTANCE);
        assertFalse(cross.isReachable());
    }

    private Graph loadDistrictGraph() throws Exception {
        Path path = Paths.get(Objects.requireNonNull(
                        getClass().getResource("/district1_map.csv"), "district1_map.csv")
                .toURI());
        return CsvMapLoader.load(path.toString());
    }

    private void assertRouteReasonable(Graph graph, String from, String to) {
        RouteResult result = dijkstraService.findRoute(graph, from, to, WeightMode.DISTANCE);
        assertTrue(result.isReachable());
        assertTrue(result.getTotalCost() > 0);
        for (String node : result.getPath()) {
            assertTrue(graph.containsNode(node), "Path contains unknown node: " + node);
        }
    }
}
