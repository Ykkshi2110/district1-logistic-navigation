package vn.edu.kma.district1.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import vn.edu.kma.district1.exception.AppException;

/**
 * Đồ thị có hướng; cạnh hai chiều được biểu diễn bằng hai cạnh có hướng đối nhau.
 */
public final class Graph {

    private final Map<String, Node> nodes = new HashMap<>();

    public void addNode(String id, String name, double lat, double lng) {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(name, "name");
        Node node = nodes.computeIfAbsent(id, key -> new Node(key, name));
        node.setName(name);
        node.setLatitude(lat);
        node.setLongitude(lng);
    }

    /**
     * Thêm cạnh có hướng. {@code isOneWay == false} thì thêm cả chiều ngược.
     */
    public void addEdge(String fromId, String toId, double distanceMeters, double speedKmh, boolean isOneWay) {
        requireNode(fromId, "fromId");
        requireNode(toId, "toId");
        nodes.get(fromId).addEdge(new Edge(toId, distanceMeters, speedKmh, false));
        if (!isOneWay) {
            nodes.get(toId).addEdge(new Edge(fromId, distanceMeters, speedKmh, false));
        }
    }

    public boolean containsNode(String id) {
        return id != null && nodes.containsKey(id);
    }

    public Node getNode(String id) {
        Node node = nodes.get(id);
        if (node == null) {
            throw new AppException("Không tìm thấy đỉnh: " + id);
        }
        return node;
    }

    public Set<String> getAllNodeIds() {
        return Collections.unmodifiableSet(nodes.keySet());
    }

    public int getNodeCount() {
        return nodes.size();
    }

    public List<Edge> getAdjacentEdges(String nodeId) {
        return new ArrayList<>(getNode(nodeId).getEdges());
    }

    public void blockEdge(String fromId, String toId) {
        Edge edge = findEdge(fromId, toId);
        if (edge == null) {
            throw new AppException("Không tìm thấy đường từ " + fromId + " đến " + toId);
        }
        edge.setBlocked(true);
    }

    public void unblockEdge(String fromId, String toId) {
        Edge edge = findEdge(fromId, toId);
        if (edge == null) {
            throw new AppException("Không tìm thấy đường từ " + fromId + " đến " + toId);
        }
        edge.setBlocked(false);
    }

    private Edge findEdge(String fromId, String toId) {
        if (!containsNode(fromId) || !containsNode(toId)) {
            return null;
        }
        for (Edge edge : nodes.get(fromId).getEdges()) {
            if (edge.getToNodeId().equals(toId)) {
                return edge;
            }
        }
        return null;
    }

    private void requireNode(String id, String paramName) {
        if (!containsNode(id)) {
            throw new AppException("Đỉnh không tồn tại (" + paramName + "): " + id);
        }
    }

    /**
     * Liệt kê các cạnh (fromId → toId) để gợi ý trên CLI.
     */
    public List<String> listEdgeSummaries() {
        return nodes.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .flatMap(entry -> entry.getValue().getEdges().stream()
                        .map(edge -> formatNode(entry.getKey()) + " → " + formatNode(edge.getToNodeId())
                                + " (" + (int) edge.getDistanceMeters() + " m, "
                                + (int) edge.getSpeedKmh() + " km/h"
                                + (edge.isBlocked() ? ", đã chặn" : "")
                                + ")"))
                .collect(Collectors.toList());
    }

    private String formatNode(String nodeId) {
        Node node = nodes.get(nodeId);
        if (node == null) {
            return nodeId;
        }
        return node.getName() + " (" + nodeId + ")";
    }
}
