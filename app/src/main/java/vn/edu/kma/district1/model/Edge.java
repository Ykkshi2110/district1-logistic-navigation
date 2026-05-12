package vn.edu.kma.district1.model;

import java.util.Objects;

/**
 * Cạnh có hướng từ một {@link Node} tới {@link #toNodeId}.
 */
public final class Edge {

    public static final double METERS_PER_KILOMETER = 1000.0;
    public static final double SECONDS_PER_HOUR = 3600.0;

    private final String toNodeId;
    private final double distanceMeters;
    private final double speedKmh;
    private boolean blocked;

    public Edge(String toNodeId, double distanceMeters, double speedKmh, boolean blocked) {
        this.toNodeId = Objects.requireNonNull(toNodeId, "toNodeId");
        this.distanceMeters = distanceMeters;
        this.speedKmh = speedKmh;
        this.blocked = blocked;
    }

    public String getToNodeId() {
        return toNodeId;
    }

    public double getDistanceMeters() {
        return distanceMeters;
    }

    public double getSpeedKmh() {
        return speedKmh;
    }

    public boolean isBlocked() {
        return blocked;
    }

    public void setBlocked(boolean blocked) {
        this.blocked = blocked;
    }

    public boolean isTraversable() {
        return !blocked;
    }

    /**
     * Trọng số phục vụ Dijkstra: mét (DISTANCE) hoặc giây di chuyển (TIME).
     * Thời gian: d / (s * 1000/3600) với d mét, s km/h.
     */
    public double getWeight(WeightMode mode) {
        return switch (mode) {
            case DISTANCE -> distanceMeters;
            case TIME -> distanceMeters / (speedKmh * METERS_PER_KILOMETER / SECONDS_PER_HOUR);
        };
    }
}
