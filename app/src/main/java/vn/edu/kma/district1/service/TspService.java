package vn.edu.kma.district1.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.model.RouteResult;
import vn.edu.kma.district1.model.WeightMode;

public final class TspService {

    private final DijkstraService dijkstraService = new DijkstraService();

    public TspResult solve(Graph graph, String depotId, List<String> deliveryIds, WeightMode mode) {
        Objects.requireNonNull(graph, "graph");
        Objects.requireNonNull(depotId, "depotId");
        Objects.requireNonNull(deliveryIds, "deliveryIds");
        Objects.requireNonNull(mode, "mode");

        if (deliveryIds.contains(depotId)) {
            throw new AppException("Depot không được trùng với điểm giao hàng.");
        }

        List<String> steps = new ArrayList<>();
        steps.add("Bắt đầu giải bài toán TSP với kho: " + dijkstraService.getNodeName(graph, depotId)
                + ", các điểm giao: "
                + deliveryIds.stream().map(id -> dijkstraService.getNodeName(graph, id)).collect(Collectors.toList()));

        List<String> allPoints = new ArrayList<>(deliveryIds.size() + 1);
        allPoints.add(depotId);
        allPoints.addAll(deliveryIds);

        steps.add("Bước 1: Xây dựng ma trận chi phí giữa các điểm...");
        double[][] matrix = buildCostMatrix(graph, allPoints, mode);

        steps.add("Bước 2: Tìm thứ tự thăm tối ưu bằng thuật toán Quay lui (Backtracking)...");
        return runBacktracking(graph, allPoints, matrix, steps, mode);
    }

    double[][] buildCostMatrix(Graph graph, List<String> allPoints, WeightMode mode) {
        int n = allPoints.size();
        double[][] matrix = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (i == j) {
                    matrix[i][j] = 0.0;
                    continue;
                }
                RouteResult leg = dijkstraService.findRoute(graph, allPoints.get(i), allPoints.get(j), mode);
                if (!leg.isReachable()) {
                    throw new AppException("Không liên thông giữa "
                            + allPoints.get(i) + " và " + allPoints.get(j) + ".");
                }
                matrix[i][j] = leg.getTotalCost();
            }
        }
        return matrix;
    }

    private TspResult runBacktracking(Graph graph, List<String> allPoints, double[][] matrix, List<String> steps,
            WeightMode mode) {
        int n = allPoints.size();
        boolean[] visited = new boolean[n];
        int[] currentPath = new int[n];
        int[] bestPath = new int[n];
        double[] bestCost = { Double.MAX_VALUE };

        currentPath[0] = 0;
        visited[0] = true;

        backtrack(graph, 1, 0.0, allPoints, matrix, visited, currentPath, bestPath, bestCost, steps, mode);

        if (bestCost[0] >= Double.MAX_VALUE / 2) {
            steps.add("Không tìm được lộ trình TSP hợp lệ.");
            throw new AppException("Không tìm được lộ trình TSP hợp lệ.");
        }

        List<String> order = new ArrayList<>(n);
        for (int idx : bestPath) {
            order.add(allPoints.get(idx));
        }
        steps.add("> [Kết quả] Lộ trình tối ưu: "
                + order.stream().map(id -> dijkstraService.getNodeName(graph, id)).collect(Collectors.joining(" -> "))
                + " -> " + dijkstraService.getNodeName(graph, allPoints.get(0)));
        return new TspResult(order, bestCost[0], steps);
    }

    private void backtrack(
            Graph graph,
            int depth,
            double currentCost,
            List<String> allPoints,
            double[][] matrix,
            boolean[] visited,
            int[] currentPath,
            int[] bestPath,
            double[] bestCost,
            List<String> steps,
            WeightMode mode) {

        int n = allPoints.size();
        String indent = "  ".repeat(depth);
        String currentNodeName = dijkstraService.getNodeName(graph, allPoints.get(currentPath[depth - 1]));

        // Pruning: nếu nhánh đã đắt hơn lời giải tốt nhất thì cắt tỉa
        if (currentCost >= bestCost[0]) {
            if (steps.size() < 1000) {
                steps.add(indent + "- [Cắt tỉa] Nhánh này đã đắt hơn lộ trình tốt nhất ("
                        + formatCost(currentCost, mode) + " >= " + formatCost(bestCost[0], mode) + ")");
            }
            return;
        }

        if (depth == n) {
            int last = currentPath[n - 1];
            double withReturn = currentCost + matrix[last][0];
            if (withReturn < bestCost[0]) {
                steps.add(indent + "> [Kỷ lục] Đã tìm thấy lộ trình tốt hơn với tổng chi phí: "
                        + formatCost(withReturn, mode));
                bestCost[0] = withReturn;
                System.arraycopy(currentPath, 0, bestPath, 0, n);
            }
            return;
        }

        for (int next = 1; next < n; next++) {
            if (visited[next]) {
                continue;
            }
            int previous = currentPath[depth - 1];
            double stepCost = matrix[previous][next];
            String nextNodeName = dijkstraService.getNodeName(graph, allPoints.get(next));

            steps.add(indent + "+ [Thử] Đi đến " + nextNodeName + " (Chi phí tích lũy: "
                    + formatCost(currentCost + stepCost, mode) + ")");

            currentPath[depth] = next;
            visited[next] = true;
            backtrack(graph, depth + 1, currentCost + stepCost, allPoints, matrix, visited, currentPath, bestPath,
                    bestCost, steps, mode);

            steps.add(indent + "< [Quay lui] Rời khỏi " + nextNodeName);
            visited[next] = false;
        }
    }

    private String formatCost(double cost, WeightMode mode) {
        if (mode == WeightMode.DISTANCE) {
            return String.format("%.0f m", cost);
        } else {
            return String.format("%.0f giây", cost);
        }
    }
}
