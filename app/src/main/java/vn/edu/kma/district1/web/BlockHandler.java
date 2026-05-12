package vn.edu.kma.district1.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Graph;

import java.io.IOException;

public class BlockHandler implements HttpHandler {
    private final Graph graph;

    public BlockHandler(Graph graph) {
        this.graph = graph;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            WebServer.sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
            return;
        }

        String body = WebServer.readBody(exchange);
        String action = JsonParser.getString(body, "action");
        String fromId = JsonParser.getString(body, "from");
        String toId = JsonParser.getString(body, "to");

        if (action == null || fromId == null || toId == null) {
            WebServer.sendJson(exchange, 400, "{\"error\":\"Thiếu tham số\"}");
            return;
        }

        try {
            String msg;
            boolean blocked;
            if ("block".equals(action)) {
                graph.blockEdge(fromId, toId);
                msg = "Đã chặn đường " + fromId + " → " + toId;
                blocked = true;
            } else if ("unblock".equals(action)) {
                graph.unblockEdge(fromId, toId);
                msg = "Đã mở đường " + fromId + " → " + toId;
                blocked = false;
            } else {
                WebServer.sendJson(exchange, 400, "{\"error\":\"action phải là block hoặc unblock\"}");
                return;
            }

            String json = "{"
                    + "\"success\":true,"
                    + "\"message\":\"" + WebServer.jsonEscape(msg) + "\","
                    + "\"from\":\"" + WebServer.jsonEscape(fromId) + "\","
                    + "\"to\":\"" + WebServer.jsonEscape(toId) + "\","
                    + "\"blocked\":" + blocked
                    + "}";

            WebServer.sendJson(exchange, 200, json);
        } catch (AppException e) {
            WebServer.sendJson(exchange, 400, "{\"success\":false,\"error\":\"" + WebServer.jsonEscape(e.getMessage()) + "\"}");
        }
    }
}
