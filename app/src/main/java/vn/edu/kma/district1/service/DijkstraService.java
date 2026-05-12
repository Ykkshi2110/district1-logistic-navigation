package vn.edu.kma.district1.service;

import java.util.*;
import vn.edu.kma.district1.model.Edge;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.model.Node;
import vn.edu.kma.district1.model.RouteResult;
import vn.edu.kma.district1.model.WeightMode;

/**
 * Thuật toán Dijkstra tìm đường đi ngắn nhất.
 * Cải tiến: Thu thập log các bước thực hiện của thuật toán với định dạng trace chi tiết.
 */
public final class DijkstraService {

    private static final double COST_TOLERANCE = 1e-9;

    public RouteResult findRoute(Graph graph, String sourceId, String targetId, WeightMode mode) {
        Objects.requireNonNull(graph, "graph");
        Objects.requireNonNull(sourceId, "sourceId");
        Objects.requireNonNull(targetId, "targetId");
        Objects.requireNonNull(mode, "mode");

        List<String> steps = new ArrayList<>();
        steps.add("Bắt đầu tìm đường từ " + getNodeName(graph, sourceId) + " đến " + getNodeName(graph, targetId) + " (Chế độ: " + mode + ")");

        if (sourceId.equals(targetId)) {
            steps.add("Điểm đi trùng điểm đến. Kết thúc sớm.");
            return RouteResult.success(List.of(sourceId), 0.0, steps);
        }

        Map<String, Double> dist = new HashMap<>();
        Map<String, String> prev = new HashMap<>();
        Set<String> visited = new HashSet<>();
        
        for (String id : graph.getAllNodeIds()) {
            dist.put(id, Double.MAX_VALUE);
        }
        dist.put(sourceId, 0.0);

        PriorityQueue<Map.Entry<String, Double>> pq =
                new PriorityQueue<>(Comparator.comparingDouble(Map.Entry::getValue));
        pq.offer(new AbstractMap.SimpleEntry<>(sourceId, 0.0));

        while (!pq.isEmpty()) {
            Map.Entry<String, Double> entry = pq.poll();
            String nodeId = entry.getKey();
            double cost = entry.getValue();
            String nodeName = getNodeName(graph, nodeId);

            if (cost > dist.get(nodeId) + COST_TOLERANCE) {
                continue;
            }
            
            if (visited.contains(nodeId)) {
                continue;
            }
            
            steps.add("* [Thăm] Lấy đỉnh " + nodeName + " từ hàng đợi (Cost hiện tại: " + formatCost(cost, mode) + ")");
            
            if (nodeId.equals(targetId)) {
                steps.add("> [Đích] Đã tìm thấy đích " + nodeName + ". Dừng thuật toán.");
                break;
            }
            
            visited.add(nodeId);

            for (Edge edge : graph.getAdjacentEdges(nodeId)) {
                if (!edge.isTraversable()) {
                    continue;
                }
                String neighborId = edge.getToNodeId();
                String neighborName = getNodeName(graph, neighborId);
                double weight = edge.getWeight(mode);
                double oldCost = dist.get(neighborId);
                double newCost = dist.get(nodeId) + weight;
                
                if (newCost + COST_TOLERANCE < oldCost) {
                    dist.put(neighborId, newCost);
                    prev.put(neighborId, nodeId);
                    pq.offer(new AbstractMap.SimpleEntry<>(neighborId, newCost));
                    steps.add("  > [Relax] Đỉnh " + neighborName + " qua " + nodeName + ": " + (oldCost >= Double.MAX_VALUE / 2 ? "∞" : formatCost(oldCost, mode)) + " -> " + formatCost(newCost, mode) + " (Cải thiện!)");
                } else {
                    steps.add("  x [Skip] Đỉnh " + neighborName + " qua " + nodeName + ": " + formatCost(newCost, mode) + " >= " + formatCost(oldCost, mode) + " (Không tốt hơn)");
                }
            }
        }

        return reconstructPath(graph, sourceId, targetId, dist, prev, steps, mode);
    }

    public String getNodeName(Graph graph, String id) {
        Node n = graph.getNode(id);
        return n != null ? n.getName() : id;
    }

    private String formatCost(double cost, WeightMode mode) {
        if (mode == WeightMode.DISTANCE) {
            return String.format("%.0f m", cost);
        } else {
            return String.format("%.0f giây", cost);
        }
    }

    private RouteResult reconstructPath(
            Graph graph, String sourceId, String targetId, Map<String, Double> dist, Map<String, String> prev, List<String> steps, WeightMode mode) {
        if (dist.get(targetId) >= Double.MAX_VALUE / 2) {
            steps.add("Không tìm thấy đường đi tới đích.");
            return RouteResult.noPath(steps);
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
        if (path.isEmpty() || !path.getFirst().equals(sourceId)) {
            steps.add("Lỗi khi dựng lại đường đi.");
            return RouteResult.noPath(steps);
        }
        steps.add("> [Kết quả] Dựng lại đường đi thành công. Tổng chi phí: " + formatCost(dist.get(targetId), mode));
        return RouteResult.success(new ArrayList<>(path), dist.get(targetId), steps);
    }
}
