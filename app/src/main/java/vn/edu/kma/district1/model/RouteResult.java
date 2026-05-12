package vn.edu.kma.district1.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Kết quả tìm đường: danh sách đỉnh theo thứ tự đi, chi phí tích lũy, cờ đến được.
 */
public final class RouteResult {

    private final List<String> path;
    private final double totalCost;
    private final boolean reachable;

    private RouteResult(List<String> path, double totalCost, boolean reachable) {
        this.path = path;
        this.totalCost = totalCost;
        this.reachable = reachable;
    }

    public static RouteResult success(List<String> path, double totalCost) {
        Objects.requireNonNull(path, "path");
        return new RouteResult(List.copyOf(path), totalCost, true);
    }

    public static RouteResult noPath() {
        return new RouteResult(Collections.emptyList(), Double.POSITIVE_INFINITY, false);
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
}
