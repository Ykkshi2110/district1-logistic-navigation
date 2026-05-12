package vn.edu.kma.district1.ui;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Scanner;
import vn.edu.kma.district1.exception.AppException;
import vn.edu.kma.district1.model.Edge;
import vn.edu.kma.district1.model.Graph;
import vn.edu.kma.district1.model.RouteResult;
import vn.edu.kma.district1.model.WeightMode;
import vn.edu.kma.district1.service.DijkstraService;
import vn.edu.kma.district1.service.TspResult;
import vn.edu.kma.district1.service.TspService;
import vn.edu.kma.district1.validation.InputValidator;

/**
 * Giao diện dòng lệnh tiếng Việt — bắt {@link AppException} để không crash.
 */
public final class ConsoleUI {

    private static final int MENU_SHORTEST_PATH = 1;
    private static final int MENU_TSP = 2;
    private static final int MENU_BLOCK = 3;
    private static final int MENU_LIST_NODES = 4;
    private static final int MENU_EXIT = 5;

    private static final int EDGE_SUGGESTION_DISPLAY_LIMIT = 15;

    private static final double SECONDS_PER_MINUTE = 60.0;

    private final Graph graph;
    private final DijkstraService dijkstraService = new DijkstraService();
    private final TspService tspService = new TspService();

    public ConsoleUI(Graph graph) {
        this.graph = graph;
    }

    public void run() {
        Scanner scanner = new Scanner(System.in, StandardCharsets.UTF_8);
        while (true) {
            printMainMenu();
            String raw = scanner.nextLine().strip();
            int choice;
            try {
                choice = Integer.parseInt(raw);
            } catch (NumberFormatException ex) {
                System.out.println("Lỗi: Vui lòng nhập số từ 1 đến 5 cho mục menu.");
                continue;
            }
            try {
                switch (choice) {
                    case MENU_SHORTEST_PATH -> handleShortestPath(scanner);
                    case MENU_TSP -> handleTsp(scanner);
                    case MENU_BLOCK -> handleBlockUnblock(scanner);
                    case MENU_LIST_NODES -> handleListNodes();
                    case MENU_EXIT -> {
                        System.out.println("Tạm biệt.");
                        return;
                    }
                    default -> System.out.println("Lỗi: Lựa chọn menu không hợp lệ. Nhập số từ 1 đến 5.");
                }
            } catch (AppException ex) {
                System.out.println("Lỗi: " + ex.getMessage());
            } catch (NumberFormatException ex) {
                System.out.println("Lỗi: Dữ liệu số không hợp lệ. Vui lòng nhập lại.");
            }
        }
    }

    private void printMainMenu() {
        System.out.println();
        System.out.println("===== BẢN ĐỒ QUẬN 1 — MENU CHÍNH =====");
        System.out.println("1. Tìm đường ngắn nhất / nhanh nhất");
        System.out.println("2. Tối ưu lộ trình giao hàng (TSP nhỏ)");
        System.out.println("3. Chặn / mở chặn đường");
        System.out.println("4. Xem danh sách địa điểm");
        System.out.println("5. Thoát");
        System.out.print("Chọn: ");
    }

    private void handleShortestPath(Scanner scanner) {
        System.out.print("Điểm đi (id): ");
        String from = scanner.nextLine().strip();
        System.out.print("Điểm đến (id): ");
        String to = scanner.nextLine().strip();
        System.out.print("Chế độ (1 = ngắn nhất theo mét, 2 = nhanh nhất theo thời gian): ");
        String modeRaw = scanner.nextLine().strip();
        WeightMode mode = parseWeightMode(modeRaw);
        InputValidator.validateNodeExists(graph, from);
        InputValidator.validateNodeExists(graph, to);
        RouteResult result = dijkstraService.findRoute(graph, from, to, mode);
        if (!result.isReachable()) {
            System.out.println("Không tìm thấy đường đi giữa hai điểm.");
            return;
        }
        RoutePhysicalSummary summary = summarizeRoute(graph, result.getPath());
        System.out.println("Lộ trình: " + formatPath(result.getPath()));
        System.out.printf(Locale.ROOT, "Chi phí theo chế độ đã chọn: %.2f%n", result.getTotalCost());
        System.out.printf(Locale.ROOT, "Tổng quãng đường: %.3f km%n", summary.totalKilometers());
        System.out.printf(Locale.ROOT, "Thời gian ước tính: %.1f phút%n", summary.totalMinutes());
    }

    private WeightMode parseWeightMode(String raw) {
        return switch (raw) {
            case "2" -> WeightMode.TIME;
            case "1" -> WeightMode.DISTANCE;
            default -> throw new AppException("Chế độ không hợp lệ. Nhập 1 hoặc 2.");
        };
    }

    private void handleTsp(Scanner scanner) {
        System.out.print("Kho / điểm xuất phát (id): ");
        String depot = scanner.nextLine().strip();
        InputValidator.validateNodeExists(graph, depot);
        System.out.print("Số điểm giao (1-5): ");
        int count;
        try {
            count = Integer.parseInt(scanner.nextLine().strip());
        } catch (NumberFormatException ex) {
            throw new AppException("Số điểm giao phải là số nguyên hợp lệ.");
        }
        if (count < InputValidator.MIN_DELIVERY_POINTS || count > InputValidator.MAX_DELIVERY_POINTS) {
            throw new AppException("Số điểm giao phải từ "
                    + InputValidator.MIN_DELIVERY_POINTS + " đến " + InputValidator.MAX_DELIVERY_POINTS + ".");
        }
        List<String> deliveries = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            System.out.print("Điểm giao thứ " + i + " (id): ");
            deliveries.add(scanner.nextLine().strip());
        }
        for (String id : deliveries) {
            InputValidator.validateNodeExists(graph, id);
        }
        InputValidator.validateDeliveryPoints(deliveries);
        System.out.print("Chế độ tối ưu (1 = khoảng cách, 2 = thời gian): ");
        WeightMode mode = parseWeightMode(scanner.nextLine().strip());
        TspResult tsp = tspService.solve(graph, depot, deliveries, mode);
        List<String> detailedPath = expandVisitOrderToDetailedPath(tsp.visitOrder(), mode);
        RoutePhysicalSummary summary = summarizeRoute(graph, detailedPath);
        System.out.println("Thứ tự thăm tối ưu: " + formatPath(tsp.visitOrder()));
        System.out.println("Lộ trình chi tiết: " + formatPath(detailedPath));
        System.out.printf(Locale.ROOT, "Tổng chi phí (theo chế độ): %.2f%n", tsp.totalCost());
        System.out.printf(Locale.ROOT, "Ước lượng quãng đường theo thứ tự trên: %.3f km%n", summary.totalKilometers());
        System.out.printf(Locale.ROOT, "Ước lượng thời gian lái xe: %.1f phút%n", summary.totalMinutes());
    }

    private void handleBlockUnblock(Scanner scanner) {
        System.out.println("Một số cạnh hiện có (gợi ý):");
        List<String> edges = graph.listEdgeSummaries();
        int limit = Math.min(EDGE_SUGGESTION_DISPLAY_LIMIT, edges.size());
        for (int i = 0; i < limit; i++) {
            System.out.println(" - " + edges.get(i));
        }
        if (edges.size() > limit) {
            System.out.println(" ... (" + edges.size() + " cạnh trong tổng số)");
        }
        System.out.print("Điểm đầu (from id): ");
        String from = scanner.nextLine().strip();
        System.out.print("Điểm cuối (to id): ");
        String to = scanner.nextLine().strip();
        System.out.print("Thao tác (1 = chặn, 2 = mở chặn): ");
        String op = scanner.nextLine().strip();
        if (op.equals("1")) {
            graph.blockEdge(from, to);
            System.out.println("Đã chặn cạnh " + formatNode(from) + " → " + formatNode(to) + ".");
        } else if (op.equals("2")) {
            graph.unblockEdge(from, to);
            System.out.println("Đã mở chặn cạnh " + formatNode(from) + " → " + formatNode(to) + ".");
        } else {
            throw new AppException("Lựa chọn thao tác không hợp lệ. Nhập 1 hoặc 2.");
        }
        Edge edge = requireEdge(from, to);
        System.out.println("Trạng thái hiện tại: có thể đi qua = " + (edge.isTraversable() ? "có" : "không"));
    }

    private void handleListNodes() {
        System.out.printf(Locale.ROOT, "%-6s %-35s %s%n", "ID", "Tên", "Số cạnh đi ra");
        graph.getAllNodeIds().stream().sorted().forEach(id -> {
            NodeView view = new NodeView(id, graph.getNode(id).getName(), graph.getAdjacentEdges(id).size());
            System.out.printf(Locale.ROOT, "%-6s %-35s %d%n", view.id(), view.name(), view.outDegree());
        });
        System.out.println("Tổng số địa điểm: " + graph.getNodeCount());
    }

    private Edge requireEdge(String fromId, String toId) {
        for (Edge edge : graph.getAdjacentEdges(fromId)) {
            if (edge.getToNodeId().equals(toId)) {
                return edge;
            }
        }
        throw new AppException("Không tìm thấy cạnh " + fromId + " → " + toId + ".");
    }

    private RoutePhysicalSummary summarizeRoute(Graph graph, List<String> path) {
        double meters = 0.0;
        double seconds = 0.0;
        for (int i = 0; i < path.size() - 1; i++) {
            Edge edge = findEdge(graph, path.get(i), path.get(i + 1));
            meters += edge.getDistanceMeters();
            seconds += edge.getWeight(WeightMode.TIME);
        }
        return new RoutePhysicalSummary(
                meters / Edge.METERS_PER_KILOMETER, seconds / SECONDS_PER_MINUTE);
    }

    private Edge findEdge(Graph graph, String fromId, String toId) {
        for (Edge edge : graph.getAdjacentEdges(fromId)) {
            if (edge.getToNodeId().equals(toId)) {
                return edge;
            }
        }
        throw new AppException("Không tìm thấy cạnh trên lộ trình: "
                + formatNode(fromId) + " → " + formatNode(toId));
    }

    private List<String> expandVisitOrderToDetailedPath(List<String> visitOrder, WeightMode mode) {
        if (visitOrder.size() < 2) {
            return List.copyOf(visitOrder);
        }
        List<String> detailed = new ArrayList<>();
        detailed.add(visitOrder.get(0));
        for (int i = 0; i < visitOrder.size() - 1; i++) {
            String from = visitOrder.get(i);
            String to = visitOrder.get(i + 1);
            RouteResult leg = dijkstraService.findRoute(graph, from, to, mode);
            if (!leg.isReachable()) {
                throw new AppException("Không tìm thấy lộ trình chi tiết giữa "
                        + formatNode(from) + " và " + formatNode(to) + ".");
            }
            List<String> legPath = leg.getPath();
            for (int idx = 1; idx < legPath.size(); idx++) {
                detailed.add(legPath.get(idx));
            }
        }
        // Khớp với TspService: totalCost đã gồm chi phí quay về kho (matrix[last][0]).
        String depotId = visitOrder.get(0);
        String lastStop = visitOrder.get(visitOrder.size() - 1);
        if (!lastStop.equals(depotId)) {
            RouteResult returnLeg = dijkstraService.findRoute(graph, lastStop, depotId, mode);
            if (!returnLeg.isReachable()) {
                throw new AppException("Không tìm thấy lộ trình chi tiết về kho: "
                        + formatNode(lastStop) + " → " + formatNode(depotId) + ".");
            }
            List<String> returnPath = returnLeg.getPath();
            for (int idx = 1; idx < returnPath.size(); idx++) {
                detailed.add(returnPath.get(idx));
            }
        }
        return detailed;
    }

    private String formatPath(List<String> ids) {
        return ids.stream().map(this::formatNode).reduce((a, b) -> a + " → " + b).orElse("");
    }

    private String formatNode(String nodeId) {
        return graph.getNode(nodeId).getName() + " (" + nodeId + ")";
    }

    private record RoutePhysicalSummary(double totalKilometers, double totalMinutes) {}

    private record NodeView(String id, String name, int outDegree) {}
}
