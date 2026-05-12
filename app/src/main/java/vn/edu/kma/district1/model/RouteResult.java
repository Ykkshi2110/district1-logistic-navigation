package vn.edu.kma.district1.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Kết quả tìm đường: danh sách đỉnh theo thứ tự đi, chi phí tích lũy, cờ đến được, và các bước thực thi.
 */
public final class RouteResult {

    private final List<String> path;
    private final double totalCost;
    private final boolean reachable;
    private final List<String> executionSteps;

    private RouteResult(List<String> path, double totalCost, boolean reachable, List<String> executionSteps) {
        this.path = path;
        this.totalCost = totalCost;
        this.reachable = reachable;
        this.executionSteps = executionSteps != null ? List.copyOf(executionSteps) : Collections.emptyList();
    }

    public static RouteResult success(List<String> path, double totalCost) {
        return success(path, totalCost, Collections.emptyList());
    }

    public static RouteResult success(List<String> path, double totalCost, List<String> executionSteps) {
        Objects.requireNonNull(path, "path");
        return new RouteResult(List.copyOf(path), totalCost, true, executionSteps);
    }

    public static RouteResult noPath() {
        return noPath(Collections.emptyList());
    }

    public static RouteResult noPath(List<String> executionSteps) {
        return new RouteResult(Collections.emptyList(), Double.POSITIVE_INFINITY, false, executionSteps);
    }

    public List<String> getPath() {
        return Collections.unmodifiableList(path);
    }

    public double getTotalCost() {
        return totalCost;
    }

    public boolean isReachable() {
        return reachable;
    }

    public List<String> getExecutionSteps() {
        return executionSteps;
    }
}
