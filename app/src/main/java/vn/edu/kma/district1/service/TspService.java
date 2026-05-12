package vn.edu.kma.district1.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.model.RouteResult;
import vn.edu.kma.district1.model.WeightMode;

/**
 * TSP nhỏ (≤5 điểm giao) bằng backtracking trên ma trận chi phí từ {@link DijkstraService}.
 */
public final class TspService {

    private final DijkstraService dijkstraService = new DijkstraService();

    /**
     * Kết quả: thứ tự thăm (bắt đầu từ kho), tổng chi phí đã gồm cả chiều về kho.
     */
    public TspResult solve(Graph graph, String depotId, List<String> deliveryIds, WeightMode mode) {
        Objects.requireNonNull(graph, "graph");
        Objects.requireNonNull(depotId, "depotId");
        Objects.requireNonNull(deliveryIds, "deliveryIds");
        Objects.requireNonNull(mode, "mode");
        if (deliveryIds.contains(depotId)) {
            throw new AppException("Depot không được trùng với điểm giao hàng.");
        }
        List<String> allPoints = new ArrayList<>(deliveryIds.size() + 1);
        allPoints.add(depotId);
        allPoints.addAll(deliveryIds);
        double[][] matrix = buildCostMatrix(graph, allPoints, mode);
        return runBacktracking(allPoints, matrix);
    }

    /**
     * Ma trận chi phí cặp đỉnh; nếu một cặp không liên thông thì báo lỗi sớm.
     */
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

    /**
     * Backtracking trên tập hoán vị các điểm giao (kho luôn ở chỉ số 0).
     * {@code visited[]} đánh dấu đỉnh đã nằm trong hoán vị một phần hiện tại để không thăm trùng.
     * Pruning cắt nhánh khi {@code currentCost} đã không thể vượt lời giải tốt nhất.
     * Khi thăm đủ tất cả đỉnh, cộng {@code matrix[last][0]} để tính chi phí quay về kho.
     */
    private TspResult runBacktracking(List<String> allPoints, double[][] matrix) {
        int n = allPoints.size();
        boolean[] visited = new boolean[n];
        int[] currentPath = new int[n];
        int[] bestPath = new int[n];
        double[] bestCost = {Double.MAX_VALUE};

        currentPath[0] = 0;
        visited[0] = true;

        backtrack(1, 0.0, allPoints, matrix, visited, currentPath, bestPath, bestCost);

        if (bestCost[0] >= Double.MAX_VALUE / 2) {
            throw new AppException("Không tìm được lộ trình TSP hợp lệ.");
        }
        List<String> order = new ArrayList<>(n);
        for (int idx : bestPath) {
            order.add(allPoints.get(idx));
        }
        return new TspResult(order, bestCost[0]);
    }

    private void backtrack(
            int depth,
            double currentCost,
            List<String> allPoints,
            double[][] matrix,
            boolean[] visited,
            int[] currentPath,
            int[] bestPath,
            double[] bestCost) {

        // Pruning: nếu nhánh đã đắt hơn lời giải tốt nhất thì không cần mở rộng thêm hoán vị con.
        if (currentCost >= bestCost[0]) {
            return;
        }

        int n = allPoints.size();
        if (depth == n) {
            int last = currentPath[n - 1];
            double withReturn = currentCost + matrix[last][0];
            if (withReturn < bestCost[0]) {
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
            currentPath[depth] = next;
            visited[next] = true;
            backtrack(depth + 1, currentCost + stepCost, allPoints, matrix, visited, currentPath, bestPath, bestCost);
            visited[next] = false;
        }
    }
}
