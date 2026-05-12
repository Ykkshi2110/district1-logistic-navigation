package vn.edu.kma.district1.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.model.Node;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class NodesHandler implements HttpHandler {
    private final Graph graph;

    public NodesHandler(Graph graph) {
        this.graph = graph;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            WebServer.sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
            return;
        }

        List<String> sortedIds = graph.getAllNodeIds().stream().sorted().toList();
        List<String> items = new ArrayList<>();
        for (String id : sortedIds) {
            Node node = graph.getNode(id);
            if (node != null) {
                items.add(JsonUtils.nodeToJson(node));
            }
        }

        WebServer.sendJson(exchange, 200, JsonUtils.toJsonArray(items));
    }
}
