package vn.edu.kma.district1.web;

import java.util.List;
import vn.edu.kma.district1.model.Edge;
import vn.edu.kma.district1.model.Node;
import vn.edu.kma.district1.model.WeightMode;

public class JsonUtils {

    public static String escapeString(String s) {
        if (s == null) return "";
        return WebServer.jsonEscape(s);
    }

    public static String nodeToJson(Node node) {
        return String.format("{\"id\":\"%s\",\"name\":\"%s\",\"lat\":%s,\"lng\":%s}",
                escapeString(node.getId()),
                escapeString(node.getName()),
                node.getLatitude(),
                node.getLongitude());
    }

    public static String edgeToJson(String fromId, Edge edge, Node fromNode, Node toNode) {
        return String.format("{\"from\":\"%s\",\"to\":\"%s\",\"fromLat\":%s,\"fromLng\":%s,\"toLat\":%s,\"toLng\":%s,\"distanceM\":%d,\"speedKmh\":%d,\"isBlocked\":%b}",
                escapeString(fromId),
                escapeString(edge.getToNodeId()),
                fromNode.getLatitude(),
                fromNode.getLongitude(),
                toNode.getLatitude(),
                toNode.getLongitude(),
                (int) edge.getDistanceMeters(),
                (int) edge.getSpeedKmh(),
                edge.isBlocked());
    }

    public static String coordToJson(Node node) {
        return String.format("{\"id\":\"%s\",\"name\":\"%s\",\"lat\":%s,\"lng\":%s}",
                escapeString(node.getId()),
                escapeString(node.getName()),
                node.getLatitude(),
                node.getLongitude());
    }

    public static String formatCost(double cost, WeightMode mode) {
        if (mode == WeightMode.DISTANCE) {
            return String.format("%.0f m (%.2f km)", cost, cost / 1000.0);
        } else {
            return String.format("%.0f giây (≈ %.1f phút)", cost, cost / 60.0);
        }
    }

    public static String toJsonArray(List<String> jsonItems) {
        return "[" + String.join(",", jsonItems) + "]";
    }
}
