package vn.edu.kma.district1.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import vn.edu.kma.district1.model.Graph;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

public class WebServer {
    private final HttpServer server;
    private final Graph graph;

    public WebServer(Graph graph) throws IOException {
        this.graph = graph;
        this.server = HttpServer.create(new InetSocketAddress(8080), 0);
        
        server.createContext("/api/nodes", new NodesHandler(graph));
        server.createContext("/api/edges", new EdgesHandler(graph));
        server.createContext("/api/route", new RouteHandler(graph));
        server.createContext("/api/tsp", new TspHandler(graph));
        server.createContext("/api/block", new BlockHandler(graph));
        server.createContext("/", this::handleIndex);
        
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
    }

    public void start() {
        server.start();
        System.out.println(">>> Mở trình duyệt: http://localhost:8080");
    }

    private void handleIndex(HttpExchange exchange) throws IOException {
        InputStream is = getClass().getResourceAsStream("/web/index.html");
        if (is == null) {
            String error = "404 Not Found: index.html missing in resources/web/";
            sendJson(exchange, 404, "{\"error\":\"" + error + "\"}");
            return;
        }
        byte[] content = is.readAllBytes();
        exchange.getResponseHeaders().set("Content-Type", "text/html; charset=UTF-8");
        exchange.sendResponseHeaders(200, content.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(content);
        }
    }

    public static void sendJson(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    public static String readBody(HttpExchange exchange) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
            return reader.lines().collect(Collectors.joining("\n"));
        }
    }

    public static String jsonEscape(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            switch (ch) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (ch < ' ') {
                        String t = "000" + Integer.toHexString(ch);
                        sb.append("\\u").append(t.substring(t.length() - 4));
                    } else {
                        sb.append(ch);
                    }
                }
            }
        }
        return sb.toString();
    }
}
