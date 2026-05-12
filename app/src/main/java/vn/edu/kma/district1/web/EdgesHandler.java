package vn.edu.kma.district1.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import vn.edu.kma.district1.model.Edge;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.model.Node;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class EdgesHandler implements HttpHandler {
    private final Graph graph;

    public EdgesHandler(Graph graph) {
        this.graph = graph;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            WebServer.sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
            return;
        }

        List<String> items = new ArrayList<>();
        List<String> sortedIds = graph.getAllNodeIds().stream().sorted().toList();
        
        for (String fromId : sortedIds) {
            Node fromNode = graph.getNode(fromId);
            if (fromNode == null) continue;
            
            for (Edge edge : graph.getAdjacentEdges(fromId)) {
                Node toNode = graph.getNode(edge.getToNodeId());
                if (toNode != null) {
                    items.add(JsonUtils.edgeToJson(fromId, edge, fromNode, toNode));
                }
            }
        }

        WebServer.sendJson(exchange, 200, JsonUtils.toJsonArray(items));
    }
}
