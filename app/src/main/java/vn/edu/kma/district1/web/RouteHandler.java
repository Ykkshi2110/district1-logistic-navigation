package vn.edu.kma.district1.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.model.RouteResult;
import vn.edu.kma.district1.model.WeightMode;
import vn.edu.kma.district1.service.DijkstraService;

import java.io.IOException;
import java.util.List;

public class RouteHandler implements HttpHandler {
    private final Graph graph;
    private final DijkstraService dijkstraService = new DijkstraService();

    public RouteHandler(Graph graph) {
        this.graph = graph;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            WebServer.sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
            return;
        }

        String body = WebServer.readBody(exchange);
        String fromId = JsonParser.getString(body, "from");
        String toId = JsonParser.getString(body, "to");
        String modeStr = JsonParser.getString(body, "mode");

        WeightMode mode = "TIME".equals(modeStr) ? WeightMode.TIME : WeightMode.DISTANCE;

        if (fromId == null || toId == null) {
            WebServer.sendJson(exchange, 400, "{\"error\":\"Thiếu tham số from/to\"}");
            return;
        }

        try {
            RouteResult result = dijkstraService.findRoute(graph, fromId, toId, mode);
            if (!result.isReachable()) {
                List<String> stepJsons = result.getExecutionSteps().stream()
                        .map(s -> "\"" + WebServer.jsonEscape(s) + "\"")
                        .toList();
                WebServer.sendJson(exchange, 200, "{\"reachable\":false,\"path\":[],\"coordinates\":[],\"error\":\"Không tìm thấy đường đi\",\"executionSteps\":" + JsonUtils.toJsonArray(stepJsons) + "}");
                return;
            }

            List<String> coordJsons = result.getPath().stream()
                    .map(id -> JsonUtils.coordToJson(graph.getNode(id)))
                    .toList();

            List<String> pathJsons = result.getPath().stream()
                    .map(id -> "\"" + WebServer.jsonEscape(id) + "\"")
                    .toList();

            List<String> stepJsons = result.getExecutionSteps().stream()
                    .map(s -> "\"" + WebServer.jsonEscape(s) + "\"")
                    .toList();

            String costFormatted = JsonUtils.formatCost(result.getTotalCost(), mode);

            String json = "{"
                    + "\"reachable\":true,"
                    + "\"mode\":\"" + mode.name() + "\","
                    + "\"totalCost\":" + result.getTotalCost() + ","
                    + "\"totalCostFormatted\":\"" + costFormatted + "\","
                    + "\"path\":" + JsonUtils.toJsonArray(pathJsons) + ","
                    + "\"coordinates\":" + JsonUtils.toJsonArray(coordJsons) + ","
                    + "\"executionSteps\":" + JsonUtils.toJsonArray(stepJsons)
                    + "}";

            WebServer.sendJson(exchange, 200, json);
        } catch (AppException e) {
            WebServer.sendJson(exchange, 400, "{\"error\":\"" + WebServer.jsonEscape(e.getMessage()) + "\"}");
        }
    }
}
