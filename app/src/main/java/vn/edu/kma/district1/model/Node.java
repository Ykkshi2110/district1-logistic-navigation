package vn.edu.kma.district1.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Đỉnh đồ thị với danh sách cạnh đi ra.
 */
public final class Node {

    private final String id;
    private String name;
    private double latitude;
    private double longitude;
    private final List<Edge> adjacencyList = new ArrayList<>();

    public Node(String id, String name) {
        this.id = Objects.requireNonNull(id, "id");
        this.name = Objects.requireNonNull(name, "name");
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = Objects.requireNonNull(name, "name");
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public void addEdge(Edge edge) {
        adjacencyList.add(Objects.requireNonNull(edge, "edge"));
    }

    public List<Edge> getEdges() {
        return Collections.unmodifiableList(adjacencyList);
    }
}
