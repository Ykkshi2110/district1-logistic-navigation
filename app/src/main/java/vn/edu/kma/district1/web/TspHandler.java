package vn.edu.kma.district1.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.model.RouteResult;
import vn.edu.kma.district1.model.WeightMode;
import vn.edu.kma.district1.service.DijkstraService;
import vn.edu.kma.district1.service.TspResult;
import vn.edu.kma.district1.service.TspService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class TspHandler implements HttpHandler {
    private final Graph graph;
    private final TspService tspService = new TspService();
    private final DijkstraService dijkstraService = new DijkstraService();

    public TspHandler(Graph graph) {
        this.graph = graph;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            WebServer.sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
            return;
        }

        String body = WebServer.readBody(exchange);
        String depotId = JsonParser.getString(body, "depot");
        List<String> deliveryIds = JsonParser.getStringArray(body, "deliveries");
        String modeStr = JsonParser.getString(body, "mode");

        WeightMode mode = "TIME".equals(modeStr) ? WeightMode.TIME : WeightMode.DISTANCE;

        if (depotId == null || deliveryIds.isEmpty()) {
            WebServer.sendJson(exchange, 400, "{\"error\":\"Thiếu tham số depot hoặc deliveries\"}");
            return;
        }

        try {
            TspResult tsp = tspService.solve(graph, depotId, deliveryIds, mode);
            
            List<String> fullOrder = new ArrayList<>(tsp.visitOrder());
            fullOrder.add(depotId);

            List<String> legJsons = new ArrayList<>();
            for (int i = 0; i < fullOrder.size() - 1; i++) {
                String from = fullOrder.get(i);
                String to = fullOrder.get(i + 1);
                RouteResult leg = dijkstraService.findRoute(graph, from, to, mode);
                
                List<String> legCoords = leg.getPath().stream()
                        .map(id -> JsonUtils.coordToJson(graph.getNode(id)))
                        .toList();
                
                legJsons.add("{"
                        + "\"stepIndex\":" + (i + 1) + ","
                        + "\"from\":\"" + WebServer.jsonEscape(from) + "\","
                        + "\"to\":\"" + WebServer.jsonEscape(to) + "\","
                        + "\"coordinates\":" + JsonUtils.toJsonArray(legCoords)
                        + "}");
            }

            List<String> orderJsons = tsp.visitOrder().stream()
                    .map(id -> "\"" + WebServer.jsonEscape(id) + "\"")
                    .toList();

            List<String> stepJsons = tsp.executionSteps().stream()
                    .map(s -> "\"" + WebServer.jsonEscape(s) + "\"")
                    .toList();

            String costFormatted = JsonUtils.formatCost(tsp.totalCost(), mode);

            String json = "{"
                    + "\"reachable\":true,"
                    + "\"visitOrder\":" + JsonUtils.toJsonArray(orderJsons) + ","
                    + "\"totalCost\":" + tsp.totalCost() + ","
                    + "\"totalCostFormatted\":\"" + costFormatted + "\","
                    + "\"legs\":" + JsonUtils.toJsonArray(legJsons) + ","
                    + "\"executionSteps\":" + JsonUtils.toJsonArray(stepJsons)
                    + "}";

            WebServer.sendJson(exchange, 200, json);
        } catch (AppException e) {
            WebServer.sendJson(exchange, 400, "{\"error\":\"" + WebServer.jsonEscape(e.getMessage()) + "\"}");
        }
    }
}
