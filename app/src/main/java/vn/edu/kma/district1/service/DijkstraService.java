package vn.edu.kma.district1.service;

import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.PriorityQueue;
import java.util.Set;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Edge;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.model.RouteResult;
import vn.edu.kma.district1.model.WeightMode;

/**
 * Dijkstra trên đồ thị không âm; trọng số lấy từ {@link Edge#getWeight(WeightMode)}.
 */
public final class DijkstraService {

    private static final double COST_TOLERANCE = 1e-9;

    /**
     * Tìm đường tối ưu theo {@link WeightMode} (khoảng cách mét hoặc thời gian giây).
     */
    public RouteResult findRoute(Graph graph, String sourceId, String targetId, WeightMode mode) {
        Objects.requireNonNull(graph, "graph");
        Objects.requireNonNull(mode, "mode");
        if (!graph.containsNode(sourceId) || !graph.containsNode(targetId)) {
            throw new AppException("Đỉnh nguồn hoặc đích không tồn tại trên bản đồ.");
        }
        if (sourceId.equals(targetId)) {
            return RouteResult.success(List.of(sourceId), 0.0);
        }

        // init: dist[source]=0 vì bắt đầu tại nguồn; các đỉnh khác vô cực để mọi bước relax đều cải thiện được.
        Map<String, Double> dist = new HashMap<>();
        Map<String, String> prev = new HashMap<>();
        Set<String> visited = new HashSet<>();
        for (String id : graph.getAllNodeIds()) {
            dist.put(id, Double.MAX_VALUE);
        }
        dist.put(sourceId, 0.0);

        // Ưu tiên cost nhỏ nhất — đây là cốt lõi greedy của Dijkstra trên trọng số không âm.
        PriorityQueue<Map.Entry<String, Double>> pq =
                new PriorityQueue<>(Comparator.comparingDouble(Map.Entry::getValue));
        pq.offer(new AbstractMap.SimpleEntry<>(sourceId, 0.0));

        while (!pq.isEmpty()) {
            Map.Entry<String, Double> entry = pq.poll();
            String nodeId = entry.getKey();
            double cost = entry.getValue();

            // Bỏ qua bản ghi “cũ” trong hàng đợi khi đã có đường tốt hơn tới cùng đỉnh (lazy decrease-key).
            // Vì ta không decrease-key tại chỗ, một đỉnh có thể nằm trong PQ nhiều lần; chỉ bản có cost khớp dist[] mới hợp lệ.
            if (cost > dist.get(nodeId) + COST_TOLERANCE) {
                continue;
            }
            if (visited.contains(nodeId)) {
                continue;
            }
            visited.add(nodeId);

            // poll: đã xác định đường tối nhất tới nodeId; giờ relax các cạnh đi ra để cập nhật hàng xóm.
            for (Edge edge : graph.getAdjacentEdges(nodeId)) {
                if (!edge.isTraversable()) {
                    continue;
                }
                String neighbor = edge.getToNodeId();
                double newCost = dist.get(nodeId) + edge.getWeight(mode);
                if (newCost + COST_TOLERANCE < dist.get(neighbor)) {
                    dist.put(neighbor, newCost);
                    prev.put(neighbor, nodeId);
                    pq.offer(new AbstractMap.SimpleEntry<>(neighbor, newCost));
                }
            }
        }

        return reconstructPath(sourceId, targetId, dist, prev);
    }

    /**
     * Dựng lại đường đi từ prev[]: đi ngược từ đích về nguồn rồi addFirst để thứ tự đúng từ nguồn → đích.
     */
    private RouteResult reconstructPath(
            String sourceId, String targetId, Map<String, Double> dist, Map<String, String> prev) {
        if (dist.get(targetId) >= Double.MAX_VALUE / 2) {
            return RouteResult.noPath();
        }
        LinkedList<String> path = new LinkedList<>();
        String cursor = targetId;
        while (cursor != null) {
            path.addFirst(cursor);
            if (cursor.equals(sourceId)) {
                break;
            }
            cursor = prev.get(cursor);
        }
        if (!path.getFirst().equals(sourceId)) {
            return RouteResult.noPath();
        }
        return RouteResult.success(new ArrayList<>(path), dist.get(targetId));
    }
}
